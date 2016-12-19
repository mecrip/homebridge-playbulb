var PlaybulbCandle = require('./lib/playbulbcandle.js');
var noble = require('noble');

var Characteristic, Service, Accessory, UUIDGen;
var REACHABILITY_TIMEOUT = 5000;
var SERVICE_TYPE = "ff02";

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
	
	this.candleAccessories = {};
	this.cachedHomebridgeAccessories = {};
	
	this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
};

PlaybulbPlatform.prototype.configureAccessory = function(homebridgeAcc) {
	var address = homebridgeAcc.context['address'];
	var candle = this.candleAccessories[address];
	if(!candle) {
		this.log.info("Removed candle " + homebridgeAcc.displayName + " on address " + address);
		this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb", [homebridgeAcc]);
		return;
	}	
	this.log.info("Persisted candle " + homebridgeAcc.displayName + " on address " + address);
	this.cachedHomebridgeAccessories[address] = homebridgeAcc;
};

//Cached accessories are all loaded now, can start scanning
PlaybulbPlatform.prototype.didFinishLaunching = function() {
	noble.on('stateChange', this.nobleStateChange.bind(this));
};

//Bluetooth state changed
PlaybulbPlatform.prototype.nobleStateChange = function(state) {
	if(state != 'poweredOn') {
		this.log.info("Stopped scanning");
		noble.stopScanning();
	}
	this.log.info("Started scanning");
	noble.startScanning([SERVICE_TYPE], false);
	noble.on('discover', this.bulbDiscovered.bind(this));
};

//Discovered a new bluetooth candle
PlaybulbPlatform.prototype.bulbDiscovered = function(bulb) {
	var address = bulb.address;
	if(address in candleAccessories){
		this.log.info("Bulb on address " + address + " already exists");
	}else{
		this.log.info("Discovered bulb on address " + address + ". Will connect.");
		var name = "Candle"+(Object.keys(this.candleAccessories).length+1);
		var candle = new PlaybulbCandle(this.log, name, address);
		this.candleAccessories[address] = candle;
		bulb.connect(function(error) {
			this.connectCandle(error, bulb);
		}.bind(this));
	}
};

//Connect to a new bluetooth candle
PlaybulbPlatform.prototype.connectCandle = function(error, bulb) {
	if(error) {
		this.log.error("Failed to connect to candle on address " + bulb.address + ": " + error);
		return;
	}
	var address = bulb.address;
	var candle = this.candleAccessories[address];
	//Check if accessory already cached
	var homebridgeAcc = this.cachedHomebridgeAccessories[address];
	if(!homebridgeAcc) {
		homebridgeAcc = new Accessory(candle.name, UUIDGen.generate(candle.name));
		homebridgeAcc.context['address'] = address;
		this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [homebridgeAcc]);
	}else{
		delete this.cachedHomebridgeAccessories[address];
	}
	
	candle.connect(bulb, homebridgeAcc);
	bulb.once('disconnect', function(error) {
		this.disconnectCandle(bulb, homebridgeAcc, error);
	}.bind(this));
	
	//TODO: Check meaning
	if(Object.keys(this.cachedHomebridgeAccessories).length > 0) {
		noble.startScanning([SERVICE_TYPE], false);
	}
};

//Disconnect from bluetooth candle
PlaybulbPlatform.prototype.disconnectCandle = function(bulb, homebridgeAcc, error) {
	var address = bulb.address;
	//TODO: Check if I should unregister here
	this.cachedHomebridgeAccessories[address] = homebridgeAcc;
	noble.startScanning([SERVICE_TYPE], false);
};

/*PlaybulbPlatform.prototype._bulbDiscovered = function(bulb){
	if(this.finished){
		var address = bulb.address;
		if(address in this.myaccessories){
			this.lastseen[address] = Date.now();
		}else{
			accessoryName = "Candle"+(Object.keys(this.myaccessories).length+1);
			uuid = UUIDGen.generate(accessoryName);

  			var acc = new Accessory(accessoryName, uuid);
  			var candle = new PlaybulbCandle(this.log, accessoryName, address, this, bulb, acc);

			this.myaccessories[address] = acc;
			this.lastseen[address] = Date.now();
			this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [this.myaccessories[address]]);
			this.log("Registered " + this.myaccessories[address].context["candle"].name + " on address " + address);
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
  	this.lastseen[accessory.context["candle"].address] = Date.now();
  	this.log("Configured address " + accessory.context["candle"].address);
}

PlaybulbPlatform.prototype.accessories = function(callback) {
	this.log("Retrieving accessories for Playbulb");
	
	var accessories = [];
	for (var id in this.myaccessories) {
		accessories.push(this.myaccessories[id]);
	}
	callback(accessories);
}; */
