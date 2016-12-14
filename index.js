//var PiperContactSensor = require('./lib/contactsensor.js');
var noble = require('noble');

var Characteristic, Service;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerPlatform("homebridge-playbulb", "Playbulb", PlaybulbPlatform, true);
};

function PlaybulbPlatform(log, config) {
	this.log = log;
	this.config = config;
	this.Service = Service;
	this.Characteristic = Characteristic;

	//this.makerkey = this.config.makerkey;
};

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	if(noble.state === "poweredOn"){
		noble.startScanning(["ff02"]);
		this.log("Noble started scanning...");
	}else{
		this.log("Noble not powered on...");
	}
	noble.stopScanning();
	this.log("Noble stopped scanning");
	
	var accessories = [];
	//for (var id in this.myaccessories) {
	//	accessories.push(this.myaccessories[id]);
	//}
	callback(accessories);
};