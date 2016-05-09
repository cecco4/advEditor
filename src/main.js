var nodeNum;

function init() {
    var $ = go.GraphObject.make;  // for conciseness in defining templates

    myDiagram =
        $(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
            {
                initialContentAlignment: go.Spot.Center,
                allowDelete: false,
                allowCopy: false,
                layout: $(go.ForceDirectedLayout, { setsPortSpots: false}),
                "undoManager.isEnabled": true
            });

    
    // define several shared Brushes
    var bluegrad = $(go.Brush, "Linear", { 0: "rgb(150, 150, 250)", 0.5: "rgb(86, 86, 186)", 1: "rgb(86, 86, 186)" });
    var greengrad = $(go.Brush, "Linear", { 0: "rgb(158, 209, 159)", 1: "rgb(67, 101, 56)" });
    var redgrad = $(go.Brush, "Linear", { 0: "rgb(206, 106, 100)", 1: "rgb(180, 56, 50)" });
    var yellowgrad = $(go.Brush, "Linear", { 0: "rgb(254, 221, 50)", 1: "rgb(254, 182, 50)" });
    var lightgrad = $(go.Brush, "Linear", { 1: "#E6E6FA", 0: "#FFFAF0" });

    
    // the template for each attribute in a node's array of item data
    var itemTempl =
        $(go.Panel, "Horizontal",
            $(go.Shape,
                {   desiredSize: new go.Size(10, 10),
                    figure: "cube1",
                    fill: greengrad
                }),

            $(go.TextBlock,
                { stroke: "#333333",
                    font: "bold 14px sans-serif" },
                new go.Binding("text", "name"))
            );

    // define the Node template, representing an entity
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",  
            // the whole node panel
            { selectionAdorned: true,
                resizable: true,
                layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
                isShadowed: true,
                shadowColor: "#C5C1AA",
                selectionChanged: onSelectionChanged
            },
            
            new go.Binding("location", "location").makeTwoWay(),
            
            // define the node's outer shape, which will surround the Table
            $(go.Shape, "Rectangle",
                { fill: lightgrad, stroke: "#756875", strokeWidth: 3 }),
            
            $(go.Panel, "Table",
                { margin: 8, stretch: go.GraphObject.Fill },
                $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
                
                // the table header
                $(go.TextBlock,
                    {
                        row: 0, alignment: go.Spot.Center,
                        margin: new go.Margin(0, 14, 0, 2),  // leave room for Button
                        font: "bold 16px sans-serif"
                    },
                    new go.Binding("text", "name")),
                
                // the collapse/expand button
                $("PanelExpanderButton", "LIST",  // the name of the element whose visibility this button toggles
                    { row: 0, alignment: go.Spot.TopRight }),
                
                // the list of Panels, each showing an attribute
                $(go.Panel, "Vertical",
                    {
                        name: "LIST",
                        row: 1,
                        padding: 3,
                        alignment: go.Spot.TopLeft,
                        defaultAlignment: go.Spot.Left,
                        stretch: go.GraphObject.Horizontal,
                        itemTemplate: itemTempl
                    },
                    new go.Binding("itemArray", "items"))
            )  // end Table Panel
        );  // end Node
    
    // define the Link template, representing a relationship
    myDiagram.linkTemplate =
        $(go.Link,  // the whole link panel
            {
                selectionAdorned: true,
                layerName: "Foreground",
                reshapable: true,
                routing: go.Link.AvoidsNodes,
                corner: 5,
                curve: go.Link.JumpOver
            },

            new go.Binding("fromSpot", "text", getFromSpot),
            new go.Binding("toSpot", "toText", getToSpot),

            $(go.Shape,  // the link shape
                {   stroke: "#303B45", strokeWidth: 2.5 }),

            $(go.Shape,
                new go.Binding("toArrow", "toText",
                    function(s) {
                        if(s != null)
                            return "Backward";
                        else
                            return "X";})
            ),

            $(go.Shape,
                new go.Binding("fromArrow", "text",
                    function(s) {
                        if(s != null)
                            return "Standard";
                        else
                            return "X";})
            ),

            $(go.TextBlock,  // the "from" label
                {
                    textAlign: "center",
                    font: "bold 14px sans-serif",
                    stroke: "#1967B3",
                    segmentIndex: 0,
                    segmentOffset: new go.Point(NaN, NaN),
                    segmentOrientation: go.Link.OrientUpright
                },
                new go.Binding("text", "text")),
            
            $(go.TextBlock,  // the "to" label
                {
                    textAlign: "center",
                    font: "bold 14px sans-serif",
                    stroke: "#1967B3",
                    segmentIndex: -1,
                    segmentOffset: new go.Point(NaN, NaN),
                    segmentOrientation: go.Link.OrientUpright
                },
                new go.Binding("text", "toText"))
        );
    
    // create the model for the E-R diagram
    var item1 = { name: "chiavi"};
    var item2 = { name: "soldi"};
    var item3 = { name: "matita"};


    var node1 = {
        key: "1",
        name: "Casa",
        descr: "è una bella casa",
        items: [ item1 ]
    };

    var node2 = {
        key: "2",
        name: "Strada",
        descr: "la strada è buia",

        items: [ item2, item3 ]
    };

    var node3 = {
        key: "3",
        name: "Parco",
        descr: "c'è una altalena",

        items: [ ]
    };

    nodeNum = 4;

    var nodeDataArray = [ node1, node2, node3 ];

    var linkDataArray = [
        { from: "1", to: "2", text: "est", toText: "ovest"},
        { from: "2", to: "3", text: "sud", toText: "nord" },
        { from: "3", to: "1", text: "ovest", toText: null }
    ];
    myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

    initForms();

}


var selectedObj;
var addNewPortal;

function onSelectionChanged(node) {
    if(addNewPortal) {
        if(node.isSelected) {
            //add link
            myDiagram.startTransaction();

            var it = selectedObj.findLinksBetween(node);
            if(it.next()) {
                var link = it.value;
                console.log("aggiorno link: " + link);
                myDiagram.model.removeLinkData(link.data);

                if(link.data.from == selectedObj.data.key)
                    myDiagram.model.addLinkData({from: selectedObj.data.key, to: node.data.key, text: "new", toText: link.data.toText});
                else
                    myDiagram.model.addLinkData({from: node.data.key, to: selectedObj.data.key, text: link.data.text, toText: "new"});

            } else {
                console.log("creo nuovo nodo: "+ selectedObj.data.name + "->" + node.data.name);
                myDiagram.model.addLinkData({from: selectedObj.data.key, to: node.data.key, text: "new", toText: null});
            }
            myDiagram.commitTransaction();
            addNewPortal = false;

            myDiagram.select(selectedObj);
        }

        return;
    }

    if (node.isSelected)
        nodeSelected(node);
    else
        nodeDeselected(node);
}

function nodeSelected(node) {
    selectedObj = node;
    updateForm(node);
}

function nodeDeselected(node) {
    if(node == selectedObj)
        selectedObj = null;
    updateForm(selectedObj);
}


function initForms() {
    addNewPortal = false;

    // click event for button
    $('#addObject').on('click', function(ev) {

        //ev.preventDefault(); // stop default behaviour of submit button
        // value of input

        //salva
        saveNode();

        myDiagram.model.startTransaction();
        myDiagram.model.insertArrayItem(selectedObj.data.items, -1, {name:"oggetto"});
        myDiagram.model.commitTransaction();
        updateForm(selectedObj);
    });


    $('#save').on('click', saveNode);

    $('#addPortal').on('click', function () {
        addNewPortal = true;
    })

    $('#newNode').on('click', function () {
        myDiagram.model.startTransaction();
        myDiagram.model.addNodeData({ key: nodeNum, name: "Node", descr: "nuovo nodo bello", items: [ ] });
        node = myDiagram.findNodeForKey(nodeNum);
        nodeNum++;
        console.log("aggiunto nodo: "+ node + " key: "+ node.data.key);
        myDiagram.model.commitTransaction();

        myDiagram.select(node);
    })

    $('#delete').on('click', function () {
        myDiagram.model.startTransaction();

        var todel = [];
        var it = selectedObj.findLinksConnected(null);
        while (it.next())
            todel.push(it.value);

        for(i=0; i<todel.length; i++)
            myDiagram.model.removeLinkData(todel[i].data);
        myDiagram.model.removeNodeData(selectedObj.data);

        myDiagram.model.commitTransaction();
    })
}

function saveNode() {
    //ev.preventDefault(); // stop default behaviour of submit button

    myDiagram.model.startTransaction();
    myDiagram.model.setDataProperty(selectedObj.data, "name", $('#name').val());

    for( i=0; i<selectedObj.data.items.length; i++) {
        myDiagram.model.setDataProperty(selectedObj.data.items[i], "name", $('#item-'+i).val());
    }

    var it = selectedObj.findLinksConnected();
    while (it.next()) {
        var link = it.value;

        console.log(link.data.from + " " + selectedObj.data.key + " " + link.data.to);

        if(link.data.from == selectedObj.data.key) {
            console.log(link.data.text + "->"+ $('#link-'+link.data.to).val());
            myDiagram.model.setDataProperty(link.data, "text", $('#link-'+link.data.to).val());
        } else if(link.data.to == selectedObj.data.key) {
            console.log(link.data.toText + "->"+ $('#link-'+link.data.from).val());
            myDiagram.model.setDataProperty(link.data, "toText", $('#link-'+link.data.from).val());
        }

    }

    myDiagram.model.commitTransaction();
}

function updateForm(obj) {
    if(obj == null) {
        disableForm();
        return;
    }

    enableForm();

    selectedObj = obj;

    var name = $('#name');
    var descr = $('#descr');

    name.val(obj.data.name);
    descr.val(obj.data.descr);

    var objList = $('#objects-list');
    objList.empty();
    for(i=0; i<obj.data.items.length; i++) {
        objList.append('<li class="list-group-item">' +
            '<textarea class="form-control" rows="1" style="resize: none; width: 100%" id="item-' + i + '">' +
            obj.data.items[i].name + '</textarea> </li>')
    }

    var portList = $('#portals-list');
    portList.empty();

    var portals = [];

    //Nodi uscenti con text -> portali, senza text -> non si passa
    var it = obj.findLinksOutOf(null);
    while (it.next()) {
        var link = it.value;
        if(link.data.text == null)
            continue;

        var node = myDiagram.findNodeForKey(link.data.to);
        portals.push({ name: link.data.text, node: node });
    }

    //Nodi entranti con toText -> portali, senza toText -> non si passa
    it = obj.findLinksInto(null);
    while (it.next()) {
        var link = it.value;
        if(link.data.toText == null)
            continue;

        var node = myDiagram.findNodeForKey(link.data.from);
        portals.push({ name: link.data.toText, node: node });
    }

    for(i=0; i<portals.length; i++) {
        var p = portals[i];
        portList.append('<li class="list-group-item"><div class="row"><div class="col-sm-6">' +
            '<textarea class="form-control" rows="1" style="resize: none; width: 50%" id="link-'+p.node.data.key+'">'
            + p.name +'</textarea></div><div class="col-sm-4">'
            + p.node.data.name + '</div>' +
            '<div class="col-sm-2"><button type="button" class="btn btn-danger" id="chPortal-'+p.node.data.key+'">elimina</button></div></div></li>');

        $('#chPortal-'+p.node.data.key).on('click', {node: p.node}, function(ev) {

            myDiagram.model.startTransaction();

            var it = selectedObj.findLinksBetween(node);
            if(it.next()) {
                var link = it.value;
                myDiagram.model.removeLinkData(link.data);

                if(link.data.from == selectedObj.data.key)
                    link.data.text = null;
                else
                    link.data.toText = null;

                if(link.data.text != null || link.data.toText != null)
                    myDiagram.model.addLinkData(link.data);
            }
            myDiagram.model.commitTransaction();

            updateForm(selectedObj);
        });
    }
}

function disableForm() {
    document.getElementById("form").style.display = "none";
}

function enableForm() {
    document.getElementById("form").style.display = "block";
}

function getFromSpot(a) {
    if(a == "est")
        return go.Spot.RightSide;
    else if(a == "ovest")
        return go.Spot.LeftSide;
    else if(a=="nord")
        return go.Spot.TopSide;
    else if(a=="sud")
        return go.Spot.BottomSide;

    return go.Spot.AllSides;
}

function getToSpot(a) {
    if(a == "est")
        return go.Spot.RightSide;
    else if(a == "ovest")
        return go.Spot.LeftSide;
    else if(a=="nord")
        return go.Spot.TopSide;
    else if(a=="sud")
        return go.Spot.BottomSide;

    return go.Spot.AllSides;
}
