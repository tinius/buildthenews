var map = new L.Map('map', {zoom : 2, center: [43.555073, 2.580898]});

mapboxAccessToken = "pk.eyJ1IjoidGluaXVzIiwiYSI6ImNpbHo3M2t3ZzAwaGZ2bW01dGZsZDdpcjYifQ.nHUtnjssR_9U0c059vGYlA";

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken,
{
	id: 'mapbox.light',
})
	.addTo(map);

var dataDict = {};

var rScale = chroma.scale(['blue', '#eee', 'red']).domain([0,0.35]);
var aScale = chroma.scale(['blue', '#eee', 'red']).domain([0,0.05]);
var gScale = chroma.scale(['red', '#eee', 'blue']).domain([15,325]);

var aLayer = null;
var rLayer = null;

var styleByRejections = function(feature){

	var style = {
		fillOpacity : 0.4,
		opacity : 0.3,
		color : '#000',
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
		fillOpacity : 0.4,
		opacity : 0.3,
		color : '#000',
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

		var gdpList = getGdpList(100);

		for(var item of gdpList){
			var tr = document.createElement('tr');
			tr.innerHTML = '<td>' + item.countryName + '</td>';
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
 		.addTo(map);

		var baseMaps = {"Rejection Rates" : rLayer, "Application Numbers" : aLayer};

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
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = (props ? '<h4>' + props.properties.name + '</h4>'
        : 'Click on a location');
};

info.addTo(map);

function onEachFeature(feature, layer) {
    //bind click
    layer.on('click', function (e) {
			info.update(feature)
			//zoomToFeature(e)
		});
      // e = event
			layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
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
