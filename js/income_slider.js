var slider_position = document.getElementById("income_slider")
var threshold_text = document.getElementById("threshold_text")

var slider_max = 120000

var data

var width = 100+"%"
var height = 360

var svg = d3.select("#people_vis")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("viewbox", "0 0 100 100")

var y_coord = 0
var x_coord = -1

for (var i = 0; i < 100; i++) {
	var person = svg.append("g")
					.attr("class", "person")
	person.append("circle")
		.attr("r", 4.4)
		.attr("cx", 24.7)
		.attr("cy", 9)
		.attr("class", "head")
	person.append("path")
		.attr("d", "M25.6,41.2c-0.6,0-1.3,0.1-1.9,0.1c0.1,7.4,0.1,14.7,0.2,22.1c-0.2,1.1-1.2,1.9-2.4,1.9\
		c-1.1,0-2.4-0.8-2.4-1.9c0-13.4,0-26.8,0-40.1c0,0-1,0.1-1,0.1c0,4.8,0,9.6,0,14.4c-1,0.9-1.3,1.6-2.1,1.5c-1.1,0-2.2-1.2-2-2.6\
		c-0.5-8.5-0.5-14.9,0-17.4c0.2-1.1,0.6-2,1.3-2.7c1-0.8,2.2-0.8,2.8-0.8c2.3,0.1,4.6,0.3,7,0.3h-0.5c2.3,0,4.6-0.2,7-0.3\
		c0.6,0,1.9,0,2.8,0.9c0.7,0.6,1.1,1.5,1.3,2.6c0.5,2.5,0.5,8.9,0,17.4c0.2,1.4-0.6,2.6-1.8,2.6c-0.8,0-1.9-0.6-1.9-1.5\
		c0-4.8,0-9.6,0-14.4c-1,0-1-0.1-2-0.1c0,13.4,0,26.8,0,40.1c0,1.1-1.1,1.9-2.2,1.9c-1.1,0-2-0.8-2.3-1.9c0.1-7.4,0.2-14.7,0.2-22.1\
		c-0.6,0-1.3-0.1-1.9-0.1")
		.attr("class", "body")
	if ((i % 20 === 0) && (i != 0)) {
		y_coord +=1
		x_coord = -1
	}
	x_coord += 1
	person.attr("transform", "translate(" + x_coord * 25 + "," + y_coord * 65 + ")")
}

//get data
d3.csv("income_percentile_points.csv")
	.row(function(d) { 
		return(d)
	})
    .get(function(error, rows) { 
    	data = rows
    	setTimeout(update_percentage(18600), 3000)
    });




// update the value - listener in HTML
function update_percentage(income_percentile) {
  // adjust the text on the range slider
  for(var i = 0; i < data.length; i++) {
  	if (parseInt(income_percentile) <= parseInt(data[i].income2014)) {
  		if (income_percentile == 0) {
  			d3.select("#income_percentile").text("0%")
  			console.log(123)
  		}
  		else {
  			d3.select("#income_percentile").text(data[i].PercentilePoint + "%");
  		}
  		d3.select("#income_slider").property("value", income_percentile);
  		d3.select("#money_amount").text("£" + numberWithCommas(slider_position.value));
		people_pictogram(data[i].PercentilePoint); 	
  		break;
  	}
  }
  show_thresholds(income_percentile)
}

//thousands separator
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function people_pictogram(percentage) {
	var person = document.getElementsByClassName("person")
	for (var i = 0; i < 100; i++) {
		if (person[i] != undefined) {
			if ((i < percentage) && (slider_position.value != 0)) {
				for (var j = 0; j < person[i].childNodes.length; j++) {
					person[i].childNodes[j].style.fill = "#014636" //cannot afford
				}
			}
			else {
				for (var j = 0; j < person[i].childNodes.length; j++) {
					person[i].childNodes[j].style.fill = "lightblue"; //cannot afford
				}
			}
		}
	}
}

// 
function show_thresholds(slider_value) {

	if (slider_value <= 18600) {
		threshold_text.style.opacity = 0
		threshold_text.innerHTML ="£18,600 - Salary threshold for a spouse"
		threshold_text.style.opacity = 1
	}
	else if (slider_value <= 22400) {
		threshold_text.style.opacity = 0
		threshold_text.innerHTML = "£22,400 - Salary threshold for a spouse and one child"
		threshold_text.style.opacity = 1
	}
	else if (slider_value <= 24800) {
		threshold_text.style.opacity = 0
		threshold_text.innerHTML = "£24,800 - Salary threshold for a spouse and two children"
		threshold_text.style.opacity = 1
	}
	else {
		threshold_text.innerHTML = ""
		threshold_text.style.opacity = 0
	}
}


//set slider max
slider_position.max = slider_max;

//set initial slider position


