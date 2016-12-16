var PlaybulbCandle = require('./lib/playbulbcandle.js');
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

	noble.on('discover', function(peripheral) {
		this.log("Found " + peripheral.advertisement.localName + " on address " + peripheral.address);
	}.bind(this));
	
	noble.on('stateChange', function(state) {
		if (state === 'poweredOn') {
			this.log("Powered on, noble will start scanning");
    			noble.startScanning(["ff02"], true);
    			this.log("Scanning started");
  		} else {
    			noble.stopScanning();
  		}
	}.bind(this));
	
	this._initializeAccessories();
};

PlaybulbPlatform.prototype._initializeAccessories = function() {
	this.log("Initializing playbulb accessories");
	this.myaccessories = {};
	var acc = new PlaybulbCandle(this.log, "AAA", "bbb", this);
	this.myaccessories[acc.loc] = acc;
};

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	for (var id in this.myaccessories) {
		accessories.push(this.myaccessories[id]);
	}
	callback(accessories);
};
