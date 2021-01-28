
class Bus{
	constructor(lineName, busStop, busTimes) {
		this.lineName = lineName;
		this.busStop = busStop;
		this.busTimes = busTimes
	}

	showTestData() {

		return  "Bus " + this.lineName + " arrives at stop " + this.busStop + " at theses times : " + this.busTimes; 
	};
}
module.exports = Bus;

