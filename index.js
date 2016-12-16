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
	noble.on('stateChange', function(state) {
		if (state === 'poweredOn') {
			this.log("Powered on, noble will start scanning");
    		noble.startScanning([], true);
    		this.log("Scanning started");
  		} else {
    		noble.stopScanning();
  		}
	});
};

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	//for (var id in this.myaccessories) {
	//	accessories.push(this.myaccessories[id]);
	//}
	callback(accessories);
};