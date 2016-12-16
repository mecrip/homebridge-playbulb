var PlaybulbCandle = require('./lib/playbulbcandle.js');
var noble = require('noble');

var Characteristic, Service, Accessory, UUIDGen;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Accessory = homebridge.platformAccessoryl
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
		accessoryName = "Candle"+Object.keys(this.myaccessories).length;
		uuid = UUIDGen.generate(accessoryName);

  		var acc = new Accessory(accessoryName, uuid);
		acc.log = this.log;
		acc.name = "Candle"+Object.keys(this.myaccessories).length;
		acc.address = address;
		acc.platform = this;
		//Setup the service
		acc.service = new acc.platform.Service.Lightbulb(acc.name);
		acc.service.addCharacteristic(acc.platform.Characteristic.Brightness);
  		acc.service.addCharacteristic(acc.platform.Characteristic.Hue);
  		acc.service.addCharacteristic(acc.platform.Characteristic.Saturation);
  	
  		acc.infservice = new acc.platform.Service.AccessoryInformation();
		acc.infservice.setCharacteristic(acc.platform.Characteristic.Manufacturer, "Mipow");
		acc.infservice.setCharacteristic(acc.platform.Characteristic.Model, "Playbulb Candle");
		acc.infservice.setCharacteristic(acc.platform.Characteristic.SerialNumber, acc.address);
		this.myaccessories[address] = acc;//new PlaybulbCandle(this.log, "Candle"+Object.keys(this.myaccessories).length, address, this);
		this.lastseen[address] = Date.now();
		this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [this.myaccessories[address]]);
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
