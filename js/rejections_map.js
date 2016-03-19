var map = new L.Map('map', {zoom : 2, center: [43.555073, 2.580898]});

var dataDict = {};

var rScale = chroma.scale(['blue', '#eee', 'red']).domain([0,0.35]);
var aScale = chroma.scale(['blue', '#eee', 'yellow']).domain([0,0.05]);

var aLayer = null;
var rLayer = null;

var styleByRejections = function(feature){

	var style = {
		fillOpacity : 1,
		opacity : 1,
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
		fillOpacity : 1,
		opacity : 1,
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

queue()
	.defer(d3.json, 'geography/countries.geo.json')
	.defer(d3.csv, 'datasets/ratios_alpha3.csv')
	.defer(d3.csv, 'datasets/population_2014.csv')
	.await(function(error, geojson, ratiosData, populationData){

		for(var row of ratiosData) {
			dataDict[row['country_alpha3']] =
			{
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
				console.log(ratio);
			}
			if(ratio > max){ max = ratio; }
		}

		console.log(max);


		console.log(dataDict);

		aLayer = L.geoJson(geojson,
 			{ style : styleByApplications })
 		.addTo(map);
 		rLayer = L.geoJson(geojson,
 			{ style : styleByRejections })
 		.addTo(map);

		var baseMaps = {"Rejects" : rLayer, "Applications" : aLayer};

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
