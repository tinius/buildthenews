var spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1JZmLBDirvdMloJC8R-F8mvbQeyi9rzrcY9xx24ux-6E/pubhtml'

Tabletop.init({
	key: "1JZmLBDirvdMloJC8R-F8mvbQeyi9rzrcY9xx24ux-6E",
    callback: loadAssets,
    simpleSheet: true
	});


function loadAssets(data, tabletop) {

    console.log(data);

    for(var row of data){
    	insertP(row.assets);
    }

}

function insertP(text) {
	var p = document.createElement('p')
	p.className += ' story';
	p.innerHTML = text;

	document.querySelector('body').appendChild(p);

	return p;

}


var map = new L.Map('map', {zoom : 2, center: [43.555073, 2.580898]});

map.getPanes().tilePane.style.zIndex=650;
map.getPanes().tilePane.style.pointerEvents = 'none';

var GOOD_COLOUR = 'lightblue';
var BAD_COLOUR = '#014636';
var NO_DATA_COLOUR = '#eee';

//map.getPane('labels').style.zIndex = 650;
//map.getPane('labels').style.pointerEvents = 'none';

var collapseTable = function(){

}

mapboxAccessToken = "pk.eyJ1IjoidGluaXVzIiwiYSI6ImNpbHo3M2t3ZzAwaGZ2bW01dGZsZDdpcjYifQ.nHUtnjssR_9U0c059vGYlA";

// L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken,
// {
// 	id: 'mapbox.light',
// 	noWrap : 'true'
// })
// 	.addTo(map);

var labelsLayer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',{
  attribution : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  noWrap : 'true',
  pane : 'labels'
})

labelsLayer.addTo(map);

var dataDict = {};

var rDomain = [0, 0.35];
var aDomain = [0, 0.05];
var gDomain = [15, 325];

var rScale = chroma.scale([GOOD_COLOUR, BAD_COLOUR]).domain(rDomain);
var aScale = chroma.scale([GOOD_COLOUR, BAD_COLOUR]).domain(aDomain);
var gScale = chroma.scale([GOOD_COLOUR, BAD_COLOUR]).domain(gDomain);

var aLayer = null;
var rLayer = null;

var legendObj = {
	rightLabel : 'few',
	leftLabel : 'many'
};


var prettify = function(percentage){
	return (percentage*100).toFixed(2);
}

var styleByRejections = function(feature){

	var style = {
		fillOpacity : 1,
		opacity : 1,
		fillColor : NO_DATA_COLOUR,
		color : NO_DATA_COLOUR,
		weight: 0.5
	}

	dataObj = dataDict[feature.id];

	if(dataObj !== undefined){
		style.fillColor = rScale(dataObj.rejectionRate);
	}

	return style;
}

var styleByApplications = function(feature){

	var style = {
		fillOpacity : 1,
		opacity : 1,
		color : NO_DATA_COLOUR,
		weight: 0.5
	}

	dataObj = dataDict[feature.id];
	if(dataObj !== undefined){
		if(dataObj.applications >= 200){
			var appRate = dataObj.applications/dataObj.population*1000;
			console.log(appRate);
			style.fillColor = aScale(appRate);
		}
	}

	return style;

}

var getGdpList = function(minApplications){

	var l = [];

	for(var cc in dataDict){
		if(dataDict[cc].applications > minApplications){
			l.push(dataDict[cc])
		}
	}

	l.sort(function(a, b){
		return b.rejectionRate - a.rejectionRate;
	});

	return l;
}

queue()
	.defer(d3.json, 'geography/countries.geo.json')
	.defer(d3.csv, 'datasets/ratios_alpha3.csv')
	.defer(d3.csv, 'datasets/population_2014.csv')
	.defer(d3.csv, 'GNI_per_capita.csv')
	.await(function(error, geojson, ratiosData, populationData, gdpData){

		for(var row of ratiosData) {

			dataDict[row['country_alpha3']] =
			{
				countryName : row['country_name'],
				rejectionRate : parseFloat(row['rejection_rate']),
				rejections : parseInt(row['rejections']),
				applications : parseInt(row['applications'])

			}
		}

		for(var row of populationData) {

			if(dataDict[row['Country Code']] !== undefined){
				dataDict[row['Country Code']]['population'] = parseInt(row['Value']);
			}
		}

		var max = 0;
		for(var cc in dataDict){
			if(dataDict[cc]['applications'] !== undefined && dataDict[cc]['population'] !== undefined && dataDict[cc]['applications'] >= 200) {
				var ratio = dataDict[cc].applications/dataDict[cc].population*1000;
				//console.log(ratio);
			}
			if(ratio > max){ max = ratio; }
		}

		for(var row of gdpData){
			if(dataDict[row['Country_Code']] !== undefined){
				if(row['GNI_per_capita'] !== ''){
					dataDict[row['Country_Code']]['gdpPerCapita'] = parseFloat(row['GNI_per_capita']);
				}
			}
		}

		var gdpList = getGdpList(200);

		for(var item of gdpList){
			var tr = document.createElement('tr');
			tr.innerHTML = '<td>' + item.countryName + '</td><td>' + prettify(item.rejectionRate) + '</td><td>'
			+ item.gdpPerCapita + '</td>';
			document.querySelector('#gdp_list').appendChild(tr);
			if(item.gdpPerCapita !== undefined){
				tr.style['background-color'] = gScale(Math.sqrt(item.gdpPerCapita));
			}
		}

		aLayer = L.geoJson(geojson,
 			{ style : styleByApplications,
			 	onEachFeature : onEachFeature,
				noWrap : true
			})
 		.addTo(map);
 		rLayer = L.geoJson(geojson,
 			{ style : styleByRejections,
			onEachFeature : onEachFeature,
			noWrap : true
			})

		var baseMaps = {"Visa rejection rates" : rLayer, "Visa application rates" : aLayer};

		var x = L.control.layers(baseMaps).addTo(map);

	});

// d3.json('geography/countries.geo.json', function(error, json) {

// 	if(error) { return console.warn(error); }

// 	console.log(json);

// 	d3.csv('datasets/ratios_alpha3.csv', function(d) {


// 		console.log(ratios);

// 		L.geoJson(json,
// 			{ style : styleByRatios })
// 		.addTo(map);

// 		//console.log(ratios);

// 	});


var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.buildDiv();
    return this._div;
};

info.buildDiv = function(){

	var hCountry = '<h4 id="country_h">Tap on a country</h4>';
	this._div.innerHTML = hCountry;

    var appSpan = document.createElement('span');
	appSpan.id = 'app_span';
	this._div.appendChild(appSpan);
	var rejSpan = document.createElement('span');
	rejSpan.id = 'rej_span';
	this._div.appendChild(rejSpan);
	var rateSpan = document.createElement('span');
	rateSpan.id = 'rate_span';
	this._div.appendChild(rateSpan);

	var hLegend = '<h4>Legend</h4>';
	this._div.innerHTML += hLegend;


    var gradient = document.createElement('div');
    gradient.className += ' gradient';

    var leftLabel = document.createElement('span');
    leftLabel.innerHTML = legendObj.leftLabel;
    this._div.appendChild(leftLabel);

    for(var i = rDomain[0]; i <= rDomain[1]; i += (rDomain[1]-rDomain[0])/100){
    	var s = document.createElement('span');
    	s.className += ' gradient_block';
    	s.style['background-color'] = rScale(i);
    	gradient.appendChild(s);
    }
    this._div.appendChild(gradient); 

    var rightLabel = document.createElement('span');
    rightLabel.innerHTML = legendObj.rightLabel;
    this._div.appendChild(rightLabel);

}

// method that we will use to update the control based on feature properties passed
info.update = function (feature) {

	console.log(feature);

	document.querySelector('#country_h').innerHTML = dataDict[feature.id].countryName;

	var hCountry = '<h4>' + feature.properties.name + '</h4>';
    console.log(dataDict[feature.id]);

	document.querySelector('#app_span').innerHTML = dataDict[feature.id].applications;
	document.querySelector('#rej_span').innerHTML = dataDict[feature.id].rejections;
	document.querySelector('#rate_span').innerHTML = dataDict[feature.id].rejectionRate;
};

info.addTo(map);

function onEachFeature(feature, layer) {
    //bind click
    layer.on('click', function (e) {
			info.update(feature)
		});
};

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
};

function resetHighlight(e) {
	aLayer.resetStyle(e.target);
    rLayer.resetStyle(e.target);
};

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
};

