var Accessory, Characteristic, Service;
var LIGHT_EFFECTS_TEMPLATE = "ff<rgb>04000000";
var RAINBOW_EFFECT="00ff00ff0300ff00";
var OFF_EFFECT="0000000001000000";

var DEFAULT_PLACEHOLDER = "<rgb>";
var DEFAULT_EFFECTS_HANDLE = 0x0017;
var DEFAULT_BATTERY_HANDLE = 0x0022;
var DEFAULT_COLOR = "ff9f40";

var FX_ID_OFF="ff";
var FX_ID_RAINBOW="03";
var FX_ID_LIGHT="04";

/* status report:
when off:f
position (8,2)=ff
hex.substring(8,10)==='ff'

when rainbow:
0000000003000000
hex.substring(8,10)==='03'

when candle:
0000000004000000
hex.substring(8,10)==='05'

*/


function PlaybulbCandle(log, bulb_config, address, platform) {
    this.log = log;
    this.config=bulb_config;
    this.address = address;
    
    this.effects_template = LIGHT_EFFECTS_TEMPLATE;
    this.placeholder = DEFAULT_PLACEHOLDER; 
    this.effects_handle = DEFAULT_EFFECTS_HANDLE;
    this.battery_handle = DEFAULT_BATTERY_HANDLE;
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

    this.BatteryLevel=100;
    this.BatteryService=null;
    this.updateService=null;
    
};

PlaybulbCandle.prototype.registerEvents = function()
{
    this.LampService.getCharacteristic(Characteristic.On).on('get', this.getPower.bind(this));
    this.LampService.getCharacteristic(Characteristic.On).on('set', this.setPower.bind(this));
    this.LampService.getCharacteristic(Characteristic.Brightness).on('get', this.getBrightness.bind(this));
    this.LampService.getCharacteristic(Characteristic.Brightness).on('set', this.setBrightness.bind(this));
    this.LampService.getCharacteristic(Characteristic.Hue).on('get', this.getHue.bind(this));
    this.LampService.getCharacteristic(Characteristic.Hue).on('set', this.setHue.bind(this));
    this.LampService.getCharacteristic(Characteristic.Saturation).on('get', this.getSaturation.bind(this));
    this.LampService.getCharacteristic(Characteristic.Saturation).on('set', this.setSaturation.bind(this));
    
    this.BatteryService.getCharacteristic(Characteristic.BatteryLevel).on('get', this.getBatteryLevel.bind(this));
    this.BatteryService.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => { callback(false,Characteristic.ChargingState.NOT_CHARGEABLE )} );
    this.BatteryService.getCharacteristic(Characteristic.StatusLowBattery).on('get',(callback) => { 
        if(this.BatteryLevel<25)
            callback(false,Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
        else
            callback(false,Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
    });
    this.BatteryService.setCharacteristic(Characteristic.Name, "Battery");
    
    this.SwitchService.setCharacteristic(Characteristic.Name,this.config.rainbowname);
    this.SwitchService.getCharacteristic(Characteristic.On).on('get', this.getRainbowOn.bind(this));
    this.SwitchService.getCharacteristic(Characteristic.On).on('set', this.setRainbowOn.bind(this));
}

PlaybulbCandle.prototype.connect = function(bulb, homebridgeAcc) {
    this.log.info("Candle connected on address " + this.address); 
    this.homebridgeAcc = homebridgeAcc;
    this.homebridgeAcc.on('identify', this.identification.bind(this));
    this.homebridgeAcc.updateReachability(true);

    this.bulb = bulb;
    this.bulb.once('disconnect', this.disconnect.bind(this));

    this.LampService=homebridgeAcc.getService(Service.Lightbulb);
    if (this.LampService==null){
        this.LampService=new Service.Lightbulb(this.config.name,"Light");
        homebridgeAcc.addService(this.LampService);
        
        this.LampService.addCharacteristic(Characteristic.Brightness);
        this.LampService.addCharacteristic(Characteristic.Hue);
        this.LampService.addCharacteristic(Characteristic.Saturation);
    }
    
    this.BatteryService=homebridgeAcc.getService(Service.BatteryService);
    if (this.BatteryService==null){
        this.BatteryService = new Service.BatteryService(this.config.name,"Battery");
        homebridgeAcc.addService(this.BatteryService);
    }
        
    this.SwitchService= homebridgeAcc.getService(Service.Switch);
    if (this.SwitchService==null){
        this.SwitchService = new Service.Switch(this.config.name,"Rainbow");
        homebridgeAcc.addService(this.SwitchService);
    }
    
    var infservice = homebridgeAcc.getService(Service.AccessoryInformation);
    infservice.setCharacteristic(Characteristic.Manufacturer, "Mipow");
    infservice.setCharacteristic(Characteristic.Model, "Playbulb Candle");
    infservice.setCharacteristic(Characteristic.SerialNumber, this.address);
    
    this.registerEvents();

    //Set default off
    //this.setPower(false, function(error){});
    
};

PlaybulbCandle.prototype.identification = function(paired, callback) {
    this.log.info("Identify candle " + this.config.name);
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
        this.log.info("Candle " + this.config.name + " disconnected");
    }
};

PlaybulbCandle.prototype.getBatteryLevel = function(callback)
{
    var self=this;
    this.bulb.readHandle(this.battery_handle, function(error,data)
     {
        if(error)
            callback(error,null);
        else{
            var i=data.toString("hex");
            self.BatteryLevel = parseInt(i.substring(0,2),16);
            self.log.info("Battery read: %s, %s, %d",error,i,self.BatteryLevel); 
            self.BatteryService.updateCharacteristic(Characteristic.StatusLowBattery,0);
            callback(false,self.BatteryLevel);
        }
    });
}

PlaybulbCandle.prototype.getRainbowOn = function(callback){
    this.getEffect(function(error,effect){
            var power=false;
        
            if (!error)
                 if(effect.substring(8,10)===FX_ID_RAINBOW)
                        power=true;
                            
            this.log.info("getRainbowOn: %s, %s ",effect,power);    
        
            callback(error, power);
        }.bind(this));
};

PlaybulbCandle.prototype.setRainbowOn = function(value, callback){
    if (value){
        this.LampService.updateCharacteristic(Characteristic.On,0);
        this.setEffect(RAINBOW_EFFECT,callback);
    }
    else
        this.setEffect(OFF_EFFECT,callback);
};


PlaybulbCandle.prototype.getPower = function(callback){
        this.getEffect(function(error,effect){
            var power=false;
            if (!error)
                 if(effect.substring(8,10)===FX_ID_LIGHT)
                        power=true;
            
             this.log.info("getPower: %s, %s ",effect,power); 
                            
            callback(error, power);
        }.bind(this));
};

PlaybulbCandle.prototype.setPower = function(value, callback){
   if (value){
        this.SwitchService.updateCharacteristic(Characteristic.On,0);
        
        var rgb = this._hsvToRgb(this.hue, this.saturation, this.value);
        hex = this._rgbToHex(rgb.R, rgb.G, rgb.B);
        
        this.setEffectColor(hex, callback);
   }
    else
        this.setEffect(OFF_EFFECT,callback);
};

PlaybulbCandle.prototype.getHue = function(callback){
    this.getEffectColor(function(error,color){
        if (!error){
            var rgb = this._hexToRgb(color);
            var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
            //this.log.info("Hue is set to " + hsv.H);
        }
        callback(error, hsv.H);
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
    this.getEffectColor(function(error,color){
        if (!error){
            var rgb = this._hexToRgb(color);
            var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
            //this.log.info("Saturation is set to " + hsv.S);
        }
        callback(error, hsv.S);
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
    this.getEffectColor(function(error,color){
        if (!error){
            var rgb = this._hexToRgb(color);
            var hsv = this._rgbToHsv(rgb.R, rgb.G, rgb.B);
            //this.log.info("Brightness is set to " + hsv.V);
        }
        callback(error, hsv.V);
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

PlaybulbCandle.prototype.setEffectColor = function(rgb, callback) {
    var effect=OFF_EFFECT;
    
    if(rgb.toString()!=='000000')
        effect= this.effects_template.replace(this.placeholder, rgb);
    
    this.setEffect(effect,callback);
};

PlaybulbCandle.prototype.getEffect = function(callback) {
    var sdata="";
    this.bulb.readHandle(this.effects_handle, function(error, data) {
        if(error)
            this.log.error("getEffect: Error while reading effects from address " + this.address + ": " + error);
        else {
            sdata=data.toString("hex");
            //this.log.info("getEffect: %s", sdata);
        }
        callback(error,sdata);
    }.bind(this));
};

PlaybulbCandle.prototype.setEffect = function(effect, callback) {
    this.log.info("setEffect: %s",effect);
    
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
    
    this.getEffect(function(error,effect){
        if(!error){
            var sdata=effect.toString("hex");    
            var color = this.effectToColor(sdata);
            
            //this.log.info("getEffectColor: %s, %s", sdata,color);
        }
        callback(error,color);    
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
