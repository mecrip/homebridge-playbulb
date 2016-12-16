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
	this.myaccessories = {};
	this.lastseen = {};

	noble.on('discover', function(peripheral) {
		this._bulbDiscovered(peripheral);
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
};

PlaybulbPlatform.prototype._bulbDiscovered = function(bulb){
	var address = bulb.address;
	if(address in this.myaccessories){
		this.lastseen[address] = Date.now();
	}else{
		this.myaccessories[address] = new PlaybulbCandle(this.log, "Candle"+Object.keys(this.myaccessories).length, address, this);
		this.lastseen[address] = Date.now();
		this.log("Registered " + this.myaccessories[address].name + " on address " + address);
	}
}

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	for (var id in this.myaccessories) {
		accessories.push(this.myaccessories[id]);
	}
	callback(accessories);
};
