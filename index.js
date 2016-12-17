var PlaybulbCandle = require('./lib/playbulbcandle.js');
var noble = require('noble');

var Characteristic, Service, Accessory, UUIDGen;
var REACHABILITY_TIMEOUT = 10000;

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

	setInterval(function() {
		for (var address in this.myaccessories) {
			if (this.myaccessories[address].reachable && this.lastseen[address] < (Date.now() - REACHABILITY_TIMEOUT)) {
      				var candle = this.myaccessories[address].context["candle"];
				this.log("Candle " + candle.name + " no longer reachable");
				this.myaccessories[address].reachable = false;
				this.myaccessories[address].updateReachability(false);
			}	
		}
	}.bind(this), REACHABILITY_TIMEOUT);
	
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
			if(!this.myaccessories[address].reachable){
				this.log("Candle " + this.myaccessories[address].context["candle"].name + " is reachable again");
				this.myaccessories[address].reachable = true;
				this.myaccessories[address].updateReachability(true);
			}
		}else{
			accessoryName = "Candle"+Object.keys(this.myaccessories).length;
			uuid = UUIDGen.generate(accessoryName);

  			var acc = new Accessory(accessoryName, uuid);
  			var candle = new PlaybulbCandle(this.log, accessoryName, address, this, acc);

			this.myaccessories[address] = acc;
			this.lastseen[address] = Date.now();
			this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [this.myaccessories[address]]);
			this.log("Registered " + this.myaccessories[address]["candle"].name + " on address " + address);
		}
	}
}

PlaybulbPlatform.prototype.updateAccessoriesReachability = function() {
  this.log("Update playbulb reachability");
  for (var index in this.myaccessories) {
    var accessory = this.myaccessories[index];
    accessory.updateReachability(accessory.reachable);
  }
}

PlaybulbPlatform.prototype.configureAccessory = function(accessory) {
	accessory.reachable = false;

  	this.myaccessories[accessory.context["candle"].address] = accessory;
  	this.log("Configured address " + accessory.context["candle"].address);
	//this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb", [accessory]);
}

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	for (var id in this.myaccessories) {
		accessories.push(this.myaccessories[id]);
	}
	callback(accessories);
};
