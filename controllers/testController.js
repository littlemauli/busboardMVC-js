const Test = require('../models/Test');
const Message = require('../models/Message');

exports.getTestData = (req, res) => {
	let data = [
		new Test('Test name', 12),
		new Test('Second name', 13)
	];
	res.render('testView', {
		data: data,
	});
};

exports.getSecondTestData = (req, res) => {
	let data = [
		new Test('other name', 15),
		new Test('other second name', 16)
	];
	res.render('testView', {
		data: data,
	});
};

exports.getBussesForPostcode = (req, res) => {
	//console.log(req);
	console.log(req.params.postcode)
	regexPostcodeCheck(req.params.postcode, res)
};


var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let allMessages = []

function regexPostcodeCheck(userPostcode, res) {
	//console.log('Please input your postcode with no spaces and lowercase. (e.g. DE45 1BB would be inputted as de451bb)');
	//var userPostcode = ''
	allMessages = []
	const regex = /^([a-z]{1,2}\d[a-z\d]?\d[a-z]{2}|GIR ?0A{2})$/g
	if (userPostcode.match(regex) == null) {
		res.render('busDisplay', {
			postCodeStuff: ['Invalid postcode: Please input your postcode with no spaces and lowercase (e.g. DE45 1BB would be inputted as de451bb)'],
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
				res.render('busDisplay', {
					postCodeStuff: ['The postcode you entered doesn\'t exsist']
				});
				//regexPostcodeCheck();
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


			allMessages.push(`Latitude ${postcodeLat} and Longitude ${postcodeLong} of ${userPostcode}`)

			//console.log(postcodeLat + ' and ' + postcodeLong);

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


			let firstStop = ''

			let firstStopName = ''


			if (nearStops.member.length === 0) {
				allMessages.push('There are no bus stops close by.')
				res.render('busDisplay', {
					postCodeStuff: allMessages
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

			//console.log(presentBusLines)//this might be useful to see

			if (presentBusLines.length == 0 || presentBusLines[0] == null) {

				allMessages.push(`At ${busStopName} there are no schedulded departures.`)
			}
			let nextDepartures = []
			for (let i = 0; i < presentBusLines.length; i++) {
				let lineDepartures = busTimeResponse.departures[presentBusLines[i]]


				for (let j = 0; j < lineDepartures.length; j++) {
					nextDepartures.push(lineDepartures[j].expected_departure_time)
					//console.log(nextDepartures)
				}

				if (nextDepartures[0] == null || nextDepartures.length == 0) {
					allMessages.push(`There is no expected departure for this bus line: ${presentBusLines[i]}.`)
				}

				else {
					allMessages.push(`The next departures times for line ${presentBusLines[i]} at ${busStopName} are ${nextDepartures}.`)

				}

			}
			if (arrayOfStops.length === 0) {
				res.render('busDisplay', {
					postCodeStuff: allMessages
				});
			} else {
				BusTimesForOneStop(arrayOfStops, res)
			}
		}
	}


	busTimeRequest.send();

}








