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
    //service.getCharacteristic(Characteristic.On).on('get', this.getEffect.bind(this));
    service.getCharacteristic(Characteristic.On).on('set', this.changePower.bind(this));
    service.addCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this));
    service.addCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this));
    service.addCharacteristic(Characteristic.Saturation).on('get', this.getSaturation.bind(this));
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
    if(value===1 || value===true){
        rgb = "ff0000";
    }
    this.setEffect(rgb);
    callback(null);
};

PlaybulbCandle.prototype.getHue = function(callback){
    this.getEffect(function(effect){
        //TODO: Extract color
        var rgb = this.HexToRGB(effect);
        var hsv = this.RGBToHSV(rgb.R, rgb.G, rgb.B);
        this.console.log("Hue is set to " + hsv.H);
        callback(null, hsv.H);
    }.bind(this));
};

PlaybulbCandle.prototype.getSaturation = function(callback){
    this.getEffect(function(effect){
        //TODO: Extract color
        var rgb = this.HexToRGB(effect);
        var hsv = this.RGBToHSV(rgb.R, rgb.G, rgb.B);
        this.console.log("Saturation is set to " + hsv.S);
        callback(null, hsv.S);
    }.bind(this));
};

PlaybulbCandle.prototype.getBrightness = function(callback){
    this.getEffect(function(effect){
        //TODO: Extract color
        var rgb = this.HexToRGB(effect);
        var hsv = this.RGBToHSV(rgb.R, rgb.G, rgb.B);
        this.console.log("Brightness is set to " + hsv.V);
        callback(null, hsv.V);
    }.bind(this));
};

PlaybulbCandle.prototype.setEffect = function(rgb) {
    var effect = EFFECTS_TEMPLATE.replace("<rgb>", rgb);
    var buf = new Buffer(effect, "hex");//Buffer.from(effect, "hex");
    this.bulb.writeHandle(EFFECTS_HANDLE, buf, true, function(error){
    if(error){
        this.log.info("Error while setting value on addres " + this.address + ": " + error);
    }
    this.log.info("Effect set to " + rgb + " on address " + this.address);
    }.bind(this));
};

PlaybulbCandle.prototype.getEffect = function(callback) {
    this.log.info("Requesting the current effect");
    this.bulb.readHandle(EFFECTS_HANDLE, function(error, data) {
        if(error){
            this.log.error("Error while reading effects from address " + this.address + ": " + error);
        }
        this.log.info("Current effect value is " + data.toString("hex"));
        //callback(null, data.toString("hex"));
        callback(null, "123456");
    }.bind(this));
};

PlaybulbCandle.prototype.HexToRGB = function(hex){
	console.log("Hex input is " + hex);
	var r = parseInt(hex.substring(0,2),16);
	var g = parseInt(hex.substring(2,4),16);
	var b = parseInt(hex.substring(4,6),16);
	console.log("R: " + r + ", G: " + g + ", B: " + b);
	return {R:r, G:g, B:b};
};

PlaybulbCandle.prototype.RGBToHSV = function(r, g, b){
	var rt = r/255.0;
	var gt = g/255.0;
	var bt = b/255.0;
	cmax = Math.max(rt, gt, bt);
	cmin = Math.min(rt, gt, bt);
	delta = cmax - cmin;
	var h = 0;
	if(delta !== 0){
		if(cmax === rt){
			h=60.0*(((gt-bt)/delta)%6);
		}else if(cmax === gt){
			h=60.0*(((bt-rt)/delta)+2);
		}else{
			h=60.0*(((rt-gt)/delta)+4);
		}
	}
	var s = 0;
	if(cmax !== 0){
		s=(delta/cmax)*100.0;
	}
	var v = cmax*100.0;
	console.log("H: " + h + ", S: " + s + ", V: " + v);
	return {H:h, S:s, V:v};
};

module.exports = PlaybulbCandle;
