var $ =require('jquery');
window.$ = window.jQuery = require('jquery');
require('bootstrap');
require('bootstrap-drawer');
require('bootstrap-slider');
require('bootstrap-toggle');


/*var Knob = require('knob');
var maxAnchorRadius = new Knob({
      label: 'Max Radius',
      value: 50,
      min: 0, 
	   max: 200,
	stopper: false,
      width: 100
    });
$('#anchorPopupMaxRadiusDiv').prepend(maxAnchorRadius);
*/

var ol = require('openlayers');
var addBaseLayers = require('./lib/addBaseLayers.js');
var addChartLayers = require('./lib/addLayers.js');
var drawFeatures = require('./lib/drawFeatures.js');
//var displayFeatureInfo = require('./lib/displayFeatureInfo.js');

var menuControl = require('./lib/menuControl.js');
var anchor = require('./lib/anchorControl.js');

var wsServer = require('./lib/signalk.js');
var simplify = require('./lib/simplify-js.js');


var view= new ol.View({
	center: ol.proj.transform([65, 50], 'EPSG:4326', 'EPSG:3857'),
	zoom: 3
})

var mousePositionControl = new ol.control.MousePosition({
	coordinateFormat: ol.coordinate.createStringXY(4),
	projection: 'EPSG:4326',
	// comment the following two lines to have the mouse position
	// be placed within the map.
	//className: 'custom-mouse-position',
	//target: document.getElementById('mouse-position'),
	undefinedHTML: '&nbsp;'
});

var map = new ol.Map({
	interactions: ol.interaction.defaults().extend([new ol.interaction.DragRotateAndZoom()]),
	target: 'map',
	layers: [],
	view: view,
	controls: ol.control.defaults({
		attributionOptions: {
			collapsible: true
		}
	}).extend([ mousePositionControl,  new menuControl.DrawControl(), new menuControl.AnchorControl(),  new menuControl.ChartControl(), ]) 
});

//add our layers
addBaseLayers(map);
addChartLayers(map);

var vesselPosition = require('./lib/vesselPosition.js');
wsServer.addSocketListener(vesselPosition);
wsServer.addSocketListener(anchor);
var vesselOverlay = vesselPosition.getVesselOverlay(map);

function dispatch(delta) {
	//do nothing
}
function connect(){
	var sub = '{"context":"vessels.self","subscribe":[{"path":"navigation.position.*"}]}';
	var sub1 = '{"context":"vessels.self","subscribe":[{"path":"navigation.anchor.*"}]}';
	var sub2 = '{"context":"vessels.self","subscribe":[{"path":"navigation.courseOverGround*"}]}';
	var sub3 = '{"context":"vessels.self","subscribe":[{"path":"navigation.speedOverGround"}]}';
	wsServer.send(sub);
	wsServer.send(sub1);
	wsServer.send(sub2);
	wsServer.send(sub3);
	drawFeatures.setup( map);
	$("#anchorPopupOn").change(anchor.anchorWatchToggle(map));
	
	$("#drawPopupAction").on('change',function(e){
			drawFeatures.toggleAction(map, e.target.value)
	});
	$("#drawPopupGeom").on('change',function(e){
		drawFeatures.setGeomType(map, e.target.value);
	});

	$("#drawPopupSave").on('click', function() {
		drawFeatures.saveData();
	});

}

wsServer.connectDelta(window.location.host, dispatch, connect);


// clear map when user clicks on 'Delete all features'
$("#delete").click(function() {
	drawFeatures.clearMap();
});

