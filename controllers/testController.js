const Bus = require('../models/Bus');

exports.getBussesForPostcode = (req, res) => {
	console.log(req.params.postcode)
	regexPostcodeCheck(req.params.postcode, res)
};

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//let allMessages = []
let allBusses = []

function regexPostcodeCheck(userPostcode, res) {
	//allMessages = []
	allBusses = []
	const regex = /^([a-z]{1,2}\d[a-z\d]?\d[a-z]{2}|GIR ?0A{2})$/g
	if (userPostcode.match(regex) == null) {
		res.render('errorDisplay', {
			ErrorMessage: 'Invalid postcode: Please input your postcode with no spaces and lowercase (e.g. DE45 1BB would be inputted as de451bb)',
		});
	}
	else {
		postcodeValidationFunction(userPostcode, res)
	}
}

let postcodeValidationFunction = (userPostcode, res) => {
	const postcodeValidationRequest = new XMLHttpRequest();
	const postcodeValidationURL = `http://api.postcodes.io/postcodes/${userPostcode}/validate`
	postcodeValidationRequest.responseType = 'json';
	postcodeValidationRequest.open('GET', postcodeValidationURL);
	postcodeValidationRequest.onreadystatechange = () => {
		if (postcodeValidationRequest.readyState === 4) {
			let postcodeValidation = JSON.parse(postcodeValidationRequest.responseText);
			if (!postcodeValidation.result) {
				res.render('errorDisplay', {
					ErrorMessage: 'The postcode you entered doesn\'t exsist'
				});
			}
			else {
				postcodeGeoLoc(userPostcode, res)
			}
		}
	}
	postcodeValidationRequest.send();
}

let postcodeGeoLoc = (userPostcode, res) => {
	const postcodeGeoLocRequest = new XMLHttpRequest();
	const postcodeGeoLocURL = `http://api.postcodes.io/postcodes/${userPostcode}`
	postcodeGeoLocRequest.responseType = 'json';
	postcodeGeoLocRequest.open('GET', postcodeGeoLocURL);
	postcodeGeoLocRequest.onreadystatechange = () => {
		if (postcodeGeoLocRequest.readyState === 4) {
			let postcodeGeoLoc = JSON.parse(postcodeGeoLocRequest.responseText);
			let postcodeLong = postcodeGeoLoc.result.longitude;
			let postcodeLat = postcodeGeoLoc.result.latitude;

			twoClosestBusStop(postcodeLat, postcodeLong, res);
		}
	}
	postcodeGeoLocRequest.send();
}

let twoClosestBusStop = (postcodeLat, postcodeLong, res) => {
	const nearStopRequest = new XMLHttpRequest();
	const nearStopsURL = `http://transportapi.com/v3/uk/places.json?app_id=429d2986&app_key=31d8fbe68ead7b9abe6ea4720cbc9441&lat=${postcodeLat}&lon=${postcodeLong}&type=bus_stop`
	nearStopRequest.responseType = 'json';
	nearStopRequest.open('GET', nearStopsURL);
	nearStopRequest.onreadystatechange = () => {
		if (nearStopRequest.readyState === 4) {
			let nearStops = JSON.parse(nearStopRequest.responseText);
			if (nearStops.member.length === 0) {
				
				res.render('errorDisplay', {
					ErrorMessage: 'There are no bus stops close by.'
				});
			}
			else {
				console.log(nearStops.member.length)
				let arrayOfStops
				if (nearStops.member.length < 3) {
					arrayOfStops = nearStops.member;
				}
				else {
					arrayOfStops = nearStops.member.slice(0, 2);
				}
				console.log(arrayOfStops.length)
				BusTimesForOneStop(arrayOfStops, res);
			}
		}
	}
	nearStopRequest.send();
}


let BusTimesForOneStop = (arrayOfStops, res) => {
	let firstStop = arrayOfStops.pop()
	let busStopCode = firstStop.atcocode
	let busStopName = firstStop.name
	const busTimeRequest = new XMLHttpRequest();
	const busTimeUrl = `https://transportapi.com/v3/uk/bus/stop/${busStopCode}/live.json?app_id=429d2986&app_key=31d8fbe68ead7b9abe6ea4720cbc9441&group=route&nextbuses=yes`
	busTimeRequest.responseType = 'json';
	busTimeRequest.open('GET', busTimeUrl);
	busTimeRequest.onreadystatechange = () => {
		if (busTimeRequest.readyState === 4) {
			let busTimeResponse = JSON.parse(busTimeRequest.responseText);
			let presentBusLines = Object.getOwnPropertyNames(busTimeResponse.departures); //this is an array of string

			if (presentBusLines.length == 0 || presentBusLines[0] == null) {
                   
                res.render('errorDisplay', {
					ErrorMessage: `At ${busStopName} there are no schedulded departures.`
				});  
				
			}

			let nextDepartures = []
			for (let i = 0; i < presentBusLines.length; i++) {
				let lineDepartures = busTimeResponse.departures[presentBusLines[i]]
				for (let j = 0; j < lineDepartures.length; j++) {
					nextDepartures.push(lineDepartures[j].expected_departure_time)
				}

				if (nextDepartures[0] == null || nextDepartures.length == 0) 
					res.render('errorDisplay',{
						ErrorMessage: `There is no expected departure for this bus line: ${presentBusLines[i]}.`
					})
					
				else {
					allBusses.push(new Bus(presentBusLines[i], busStopName, nextDepartures))
				}
			}
			if (arrayOfStops.length === 0) {
				res.render('busDisplay', {
					allBussesAndTimes: allBusses
				});
			} else {
				BusTimesForOneStop(arrayOfStops, res)
			}
		}
	}
	busTimeRequest.send();
}








