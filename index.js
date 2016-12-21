var PlaybulbCandle = require('./lib/playbulbcandle.js');
var noble = require('noble');

var Characteristic, Service, Accessory, UUIDGen;
var DEFAULT_SERVICE_TYPE = "ff02";
var DEFAULT_NAME = "Candle ";

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

    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;

    this.candleAccessories = {};

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
};

PlaybulbPlatform.prototype.configureAccessory = function(homebridgeAcc) {
    //No reconfiguration: only add them when found during startup
    this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb", [homebridgeAcc]);
};

//Cached accessories are all loaded now, can start scanning
PlaybulbPlatform.prototype.didFinishLaunching = function() {
    noble.on('stateChange', this.nobleStateChange.bind(this));
};

//Bluetooth state changed
PlaybulbPlatform.prototype.nobleStateChange = function(state) {
    if(state !== 'poweredOn') {
        this.log.info("Stopped scanning");
        noble.stopScanning();
    }
    this.initiateScanning();
};

PlaybulbPlatform.prototype.initiateScanning = function(error) {
    if(noble.state === "poweredOn"){
        this.log.info("Scanning will be (re)started");
        var type = DEFAULT_SERVICE_TYPE;
        if(this.config.servicetype !== undefined){
            type = this.config.servicetype;
        }
        noble.startScanning([type], false);
        noble.on('discover', this.bulbDiscovered.bind(this));
    }
};

//Discovered a new bluetooth candle
PlaybulbPlatform.prototype.bulbDiscovered = function(bulb) {
    var address = bulb.address;
    if(address in this.candleAccessories){
        this.log.info("Bulb on address " + address + " already exists");
    }else{
        this.log.info("Discovered bulb on address " + address + ". Will connect.");
        var defName = DEFAULT_NAME;
        if(this.config.defaultname !== undefined){
            defName = this.config.defaultname;
        }
        var name = defName+(Object.keys(this.candleAccessories).length+1);
        var candle = new PlaybulbCandle(this.log, name, address, this);
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

    var homebridgeAcc = new Accessory(candle.name, UUIDGen.generate(candle.name));
    homebridgeAcc.context['address'] = address;
    this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [homebridgeAcc]);

    candle.connect(bulb, homebridgeAcc);
    bulb.once('disconnect', function(error) {
        this.disconnectCandle(bulb, homebridgeAcc, error);
    }.bind(this));
    this.initiateScanning();
};

//Disconnect from bluetooth candle
PlaybulbPlatform.prototype.disconnectCandle = function(bulb, homebridgeAcc, error) {
    this.log.info("PlaybulbPlatform: disconnectCandle");
    var address = bulb.address;
    delete this.candleAccessories[address];
    this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb", [homebridgeAcc]);
};
