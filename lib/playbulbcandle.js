var Accessory, Characteristic, Service;
var EFFECTS_TEMPLATE = "00<rgb>04000a00";
var EFFECTS_HANDLE = 0x0014;

function PlaybulbCandle(log, name, address, platform) {
	this.log = log;
	this.name = name;
	this.address = address;
	Accessory = platform.Accessory;
	Characteristic = platform.Characteristic;
	Service = platform.Service;
	//TODO: Add
	this.homebridgeAcc = null;
	this.bulb = null;
};

PlaybulbCandle.prototype.connect = function(bulb, homebridgeAcc) {
	this.log.info("Candle connected on address " + this.address); 
	this.homebridgeAcc = homebridgeAcc;
	this.homebridgeAcc.on('identify', this.identification.bind(this));
	this.homebridgeAcc.updateReachability(true);
	
	this.bulb = bulb;
	this.bulb.once('disconnect', this.disconnect.bind(this));
	
	var service = new Service.Lightbulb(this.name);
	service.getCharacteristic(Characteristic.On).on('get', this.getEffect.bind(this));
        service.getCharacteristic(Characteristic.On).on('set', this.changePower.bind(this));
	service.addCharacteristic(Characteristic.Brightness);
  	service.addCharacteristic(Characteristic.Hue);
	service.addCharacteristic(Characteristic.Saturation);
  	homebridgeAcc.addService(service);
  	
  	var infservice = homebridgeAcc.getService(Service.AccessoryInformation);
	infservice.setCharacteristic(Characteristic.Manufacturer, "Mipow");
	infservice.setCharacteristic(Characteristic.Model, "Playbulb Candle");
	infservice.setCharacteristic(Characteristic.SerialNumber, this.address);
};

PlaybulbCandle.prototype.identification = function(paired, callback) {
	this.log.info("Identify candle " + this.name);
	callback();
};

PlaybulbCandle.prototype.disconnect = function(error) {
	if(error){
		this.log.error("Disconnecting of address " + this.address + " failed: " + error);
	}
	if(this.bulb && this.homebridgeAcc){
		this.homebridgeAcc.removeAllListeners('identify');
		this.homebridgeAcc.updateReachability(false);
		this.homebridgeAcc = null;
		this.bulb = null;
		this.log.info("Candle " + this.name + " disconnected");
	}
};

PlaybulbCandle.prototype.changePower = function(value, callback){
    this.log.info("Trying to set power value to " + value);
    var rgb = "000000";
    if(value===true){
        rgb = "ff0000";
    }
    this.setRGB(rgb);
    callback(null);
};

PlaybulbCandle.prototype.setRGB = function(rgb) {
    var effect = EFFECTS_TEMPLATE.replace("<rgb>", rgb);
    var buf = Buffer.from(effect, "hex");
    this.bulb.writeHandle(EFFECTS_HANDLE, buf, true, function(error){
        this.log.info("Error while setting value on addres " + this.address + ": " + error);
    }.bind(this));
};

PlaybulbCandle.prototype.getEffect = function(callback) {
	this.log.info("Requesting the current effect");
	this.bulb.readHandle(EFFECTS_HANDLE, function(error, data) {
		if(error){
			this.log.error("Error while reading effects from address " + this.address + ": " + error);
		}
		this.log.info("Current effect value is " + data);
	}.bind(this));
	callback(null,true);
};

module.exports = PlaybulbCandle;
