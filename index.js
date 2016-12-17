var PlaybulbCandle = require('./lib/playbulbcandle.js');
var noble = require('noble');

var Characteristic, Service, Accessory, UUIDGen;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Accessory = homebridge.platformAccessory;
	UUIDGen = homebridge.hap.uuid;

	homebridge.registerPlatform("homebridge-playbulb", "Playbulb", PlaybulbPlatform, true);
};

function PlaybulbPlatform(log, config, api) {
	this.log = log;
	this.config = config;
	this.api = api;
	this.Service = Service;
	this.Characteristic = Characteristic;
	this.myaccessories = {};
	this.lastseen = {};
	this.finished = false;

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
	
	this.api.on('didFinishLaunching', function() {
        	this.log("DidFinishLaunching");
        	this.finished = true;
    	}.bind(this));
};

PlaybulbPlatform.prototype._bulbDiscovered = function(bulb){
	if(this.finished){
		var address = bulb.address;
		if(address in this.myaccessories){
			this.lastseen[address] = Date.now();
		}else{
			accessoryName = "Candle"+Object.keys(this.myaccessories).length;
			uuid = UUIDGen.generate(accessoryName);

  			var acc = new Accessory(accessoryName, uuid);
  			var candle = new PlaybulbCandle(this.log, accessoryName, address, this, acc);

			this.myaccessories[address] = acc;
			this.lastseen[address] = Date.now();
			this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [this.myaccessories[address]]);
			this.log("Registered " + this.myaccessories[address].name + " on address " + address);
		}
	}
}

PlaybulbPlatform.prototype.configureAccessory = function(accessory) {
	//accessory.reachable = true;

  	//this.myaccessories[accessory.address] = accessory;
  	//this.log("Configured address " + accessory.address);
	this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb", [accessory]);
}

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	for (var id in this.myaccessories) {
		accessories.push(this.myaccessories[id]);
	}
	callback(accessories);
};
