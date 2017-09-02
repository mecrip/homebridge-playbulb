"use strict"

var PlaybulbCandle = require('./lib/playbulbcandle.js');

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

    this.configuredAccessories={};

    for (var i=0; i<this.configuredAccessories.length;i++){
        this.log.info("configured accessory: %s,%s", this.configuredAccessories.name,this.configuredAccessories.address );
        this.configuredAccessories[this.config.bulbs[i].address]=this.config.bulbs[i];
    }

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
};

PlaybulbPlatform.prototype.configureAccessory = function(homebridgeAcc) {
    //No reconfiguration: only add them when found during startup
    //this.log.info("configureAccessory: %s", homebridgeAcc.context['address'])

    //search in configured accessories
    var acc=this.configuredAccessories[homebridgeAcc.context['address']]
    if (acc==null){
        this.log.info("configureAccessory: cached accessory %s not configured, removing", homebridgeAcc.context['address']);
        this.api.unregisterPlatformAccessories("homebridge-playbulb", "Playbulb",[homebridgeAcc]);
    }else{
        this.log.info("configureAccessory: cached accessory %s configured, keeping", homebridgeAcc.context['address']);
        acc.homebridgeAcc=homebridgeAcc;
    }
};

//Cached accessories are all loaded now, can start scanning
PlaybulbPlatform.prototype.didFinishLaunching = function() {
    //setup every accessory in configured accessory

    for (var address in this.configuredAccessories) {
        var accessory = this.configuredAccessories[address];
        if (accessory.homebridgeAcc!=null){
            //restored from cache
            this.log.info("accessory %s restored from cache", address);
        }else{
            this.log.info("create new accessory %s", address); 

            accessory.homebridgeAcc = new Accessory(accessory.name, UUIDGen.generate(accessory.address));
            accessory.homebridgeAcc.context['address'] = accessory.address;
            this.api.registerPlatformAccessories("homebridge-playbulb", "Playbulb", [accessory.homebridgeAcc]);
        }

        accessory.bulb=new PlaybulbCandle(this.log,accessory.name,address,this,accessory.homebridgeAcc);
    }
};

