var map = new L.Map('map', {zoom : 2, center: [43.555073, 2.580898]});

var ratios = {};

var ratiosScale = chroma.scale(['blue', '#eee', 'red']).domain([0,0.35]);

var styleByRatios = function(feature){

	var style = {
		fillOpacity : 1,
		opacity : 1,
		color : '#000',
		weight: 0.5
	}

	col = ratiosScale(parseFloat(ratios[feature.id]));

	style.fillColor = col;

	return style;
}

d3.json('geography/countries.geo.json', function(error, json) {

	if(error) { return console.warn(error); }

	console.log(json);

	d3.csv('datasets/ratios_alpha3.csv', function(d) {

		for(var row of d) {
			//console.log(row);
			ratios[row['country_alpha3']] = row['rejection_rate'];

		}

		console.log(ratios);

L.geoJson(json,
			{ style : styleByRatios })
		.addTo(map);

		//console.log(ratios);

	});

});
