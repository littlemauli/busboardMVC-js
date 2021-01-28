class Test{
	constructor(lineName, busStop, busTimes) {
		this.lineName = lineName;
		this.busStop = busStop;
		this.busTimes = busTimes
	}

	showTestData() {
		return  "Bus " + this.lineName + " arrives at this stop " + this.busStop + " at theses times : " + this.busTimes; 
	};

	editName(newName) {
		this.name = newName
	}
};

//module.exports = Test;
