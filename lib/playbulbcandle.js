var Accessory, Characteristic, Service;
var DEFAULT_EFFECTS_TEMPLATE = "ff<rgb>05000000";
var RAINBOW_EFFECT="000000000300ff00";
var OFF_EFFECT="0000000005000000";
var DEFAULT_PLACEHOLDER = "<rgb>";
var DEFAULT_EFFECTS_HANDLE = 0x0017;
var DEFAULT_COLOR = "ff9f40";

function PlaybulbCandle(log, name, address, platform) {
    this.log = log;
    this.name = name;
    this.address = address;
    
    this.effects_template = DEFAULT_EFFECTS_TEMPLATE;
    this.placeholder = DEFAULT_PLACEHOLDER; 
    this.effects_handle = DEFAULT_EFFECTS_HANDLE;
    var hex = DEFAULT_COLOR;
    
    var rgb = this._hexToRgb(hex);
    var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
    this.hue = hsv.H;
    this.saturation = hsv.S;
    this.value = hsv.V;
    
    Accessory = platform.Accessory;
    Characteristic = platform.Characteristic;
    Service = platform.Service;
    
    this.LampService=null;
    this.SwitchService=null;
    this.homebridgeAcc = null;
    this.bulb = null;
    this.isRainbowOn=false;
};

PlaybulbCandle.prototype.connect = function(bulb, homebridgeAcc) {
    this.log.info("Candle connected on address " + this.address); 
    this.homebridgeAcc = homebridgeAcc;
    this.homebridgeAcc.on('identify', this.identification.bind(this));
    this.homebridgeAcc.updateReachability(true);

    this.bulb = bulb;
    this.bulb.once('disconnect', this.disconnect.bind(this));

    var service = new Service.Lightbulb(this.name,"Light");
    service.getCharacteristic(Characteristic.On).on('get', this.getPower.bind(this));
    service.getCharacteristic(Characteristic.On).on('set', this.setPower.bind(this));
    service.addCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this));
    service.getCharacteristic(Characteristic.Brightness).on('set', this.setBrightness.bind(this));
    service.addCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this));
    service.getCharacteristic(Characteristic.Hue).on('set', this.setHue.bind(this));
    service.addCharacteristic(Characteristic.Saturation).on('get', this.getSaturation.bind(this));
    service.getCharacteristic(Characteristic.Saturation).on('set', this.setSaturation.bind(this));
    homebridgeAcc.addService(service);
    this.LampService= service;

    var infservice = homebridgeAcc.getService(Service.AccessoryInformation);
    infservice.setCharacteristic(Characteristic.Manufacturer, "Mipow");
    infservice.setCharacteristic(Characteristic.Model, "Playbulb Candle");
    infservice.setCharacteristic(Characteristic.SerialNumber, this.address);
    
    var switchService = new Service.Switch(this.name,"Rainbow");
    switchService.getCharacteristic(Characteristic.On).on('get', this.getRainbowOn.bind(this));
    switchService.getCharacteristic(Characteristic.On).on('set', this.setRainbowOn.bind(this));
    switchService.setCharacteristic(Characteristic.Name,"Rainbow Mode");
    homebridgeAcc.addService(switchService);
    this.SwitchService=switchService;
    
    //Set default off
    this.setPower(false, function(error){});
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

PlaybulbCandle.prototype.getRainbowOn = function(callback){
    //this.log.info("getRaibowOn: %s",this.isRainbowOn)
    callback(null, this.isRainbowOn);
};

PlaybulbCandle.prototype.setRainbowOn = function(value, callback){
    this.isRainbowOn=value;
    //this.log.info("setRaibowOn: %s",this.isRainbowOn)
    
    if (this.isRainbowOn){
        this.LampService.updateCharacteristic(Characteristic.On,0);
        this.setRainbowColor(callback);
    }
    else
        this.setEffectColor("000000",callback);
};


PlaybulbCandle.prototype.getPower = function(callback){
    if (this.isRainbowOn)
        callback(null,false);
    else
        this.getEffectColor(function(color){
            var power = color !== "000000";
            //this.log.info("Power is set to " + power);
            callback(null, power);
        }.bind(this));
};

PlaybulbCandle.prototype.setPower = function(value, callback){
    var hex = "000000";
    
    if(value===1 || value===true){
        var rgb = this._hsvToRgb(this.hue, this.saturation, this.value);
        hex = this._rgbToHex(rgb.R, rgb.G, rgb.B);
        
        this.SwitchService.updateCharacteristic(Characteristic.On,0);
    }
    this.setEffectColor(hex, callback);
};

PlaybulbCandle.prototype.getHue = function(callback){
    this.getEffectColor(function(color){
        var rgb = this._hexToRgb(color);
        var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
        //this.log.info("Hue is set to " + hsv.H);
        callback(null, hsv.H);
    }.bind(this));
};

PlaybulbCandle.prototype.setHue = function(value, callback){
    var rgb = this._hsvToRgb(value, this.saturation, this.value);
    var hex = this._rgbToHex(rgb.R, rgb.G, rgb.B);
    this.setEffectColor(hex, function(error){
        if(!error){
            this.hue = value;
        }
        callback(error);
    }.bind(this));
};

PlaybulbCandle.prototype.getSaturation = function(callback){
    this.getEffectColor(function(color){
        var rgb = this._hexToRgb(color);
        var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
        //this.log.info("Saturation is set to " + hsv.S);
        callback(null, hsv.S);
    }.bind(this));
};

PlaybulbCandle.prototype.setSaturation = function(value, callback){
    var rgb = this._hsvToRgb(this.hue, value, this.value);
    var hex = this._rgbToHex(rgb.R, rgb.G, rgb.B);
    this.setEffectColor(hex, function(error){
        if(!error){
            this.saturation = value;
        }
        callback(error);
    }.bind(this));
};

PlaybulbCandle.prototype.getBrightness = function(callback){
    this.getEffectColor(function(color){
        var rgb = this._hexToRgb(color);
        var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
        //this.log.info("Brightness is set to " + hsv.V);
        callback(null, hsv.V);
    }.bind(this));
};

PlaybulbCandle.prototype.setBrightness = function(value, callback){
    var rgb = this._hsvToRgb(this.hue, this.saturation, value);
    var hex = this._rgbToHex(rgb.R, rgb.G, rgb.B);
    this.setEffectColor(hex, function(error){
        if(!error){
            this.value = value;
        }
        callback(error);
    }.bind(this));
};

PlaybulbCandle.prototype.setRainbowColor = function(callback) {
    var effect=RAINBOW_EFFECT;
    
    var buf = new Buffer(effect, "hex");
    this.bulb.writeHandle(this.effects_handle, buf, true, function(error){
        if(error){
            this.log.info("Error while setting value on addres " + this.address + ": " + error);
        }
        callback(error);
    }.bind(this));
};


PlaybulbCandle.prototype.setEffectColor = function(rgb, callback) {
    var effect=OFF_EFFECT;
    
    if(rgb.toString()!=='000000')
        effect= this.effects_template.replace(this.placeholder, rgb);
    
    //this.log.info("setEffectColor: %s",effect);
    
    var buf = new Buffer(effect, "hex");
    this.bulb.writeHandle(this.effects_handle, buf, true, function(error){
        if(error){
            this.log.info("Error while setting value on addres " + this.address + ": " + error);
        }
        callback(error);
    }.bind(this));
};

PlaybulbCandle.prototype.effectToColor = function(effect) {
    var pos = this.effects_template.indexOf(this.placeholder);
    return effect.substring(pos,pos+6);
};

PlaybulbCandle.prototype.getEffectColor = function(callback) {
    this.bulb.readHandle(this.effects_handle, function(error, data) {
        if(error){
            this.log.error("Error while reading effects from address " + this.address + ": " + error);
        }
        var color = this.effectToColor(data.toString("hex"));
        //Always store last powered on color
        if(color !== "000000"){
            this.color = color;
        }
        callback(color);
    }.bind(this));
};

PlaybulbCandle.prototype._hexToRgb = function(hex){
	var r = parseInt(hex.substring(0,2),16);
	var g = parseInt(hex.substring(2,4),16);
	var b = parseInt(hex.substring(4,6),16);
	return {R:r, G:g, B:b};
};

PlaybulbCandle.prototype._rgbToHex = function(r, g, b){
    var rt = (+r).toString(16);
    rt = rt.length === 1 ? '0' + rt : rt;
    var gt = (+g).toString(16);
    gt = gt.length === 1 ? '0' + gt : gt;
    var bt = (+b).toString(16);
    bt = bt.length === 1 ? '0' + bt : bt;
    var hex = rt + gt + bt;
    return hex;
};

PlaybulbCandle.prototype._hsvToRgb = function(h, s, v){
    var c = (v/100.0)*(s/100.0);
    var x = c *(1.0-Math.abs(((h/60.0)%2)-1));
    var m = (v/100.0) - c;
    var rt = c;
    var gt = 0.0;
    var bt = x;
    if(h >= 0.0 && h < 60.0){
        rt = c;
        gt = x;
        bt = 0.0;
    }else if(h >= 60.0 && h < 120.0){
        rt = x;
        gt = c;
        bt = 0.0;
    }else if(h >= 120.0 && h < 180.0){
        rt = 0.0;
        gt = c;
        bt = x;
    }else if(h >= 180.0 && h < 240.0){
        rt = 0.0;
        gt = x;
        bt = c;
    }else if(h >= 240.0 && h < 300.0){
        rt = x;
        gt = 0.0;
        bt = c;
    }
    var r = Math.round((rt+m)*255.0);
    var g = Math.round((gt+m)*255.0);
    var b = Math.round((bt+m)*255.0);
    return {R:r, G:g, B:b};
};

PlaybulbCandle.prototype._rgbToHsv = function(r, g, b){
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
	return {H:h, S:s, V:v};
};

module.exports = PlaybulbCandle;
