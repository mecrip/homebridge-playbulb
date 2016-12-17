function PlaybulbCandle(log, name, address, platform, accessory) {
	//Store information
	this.log = log;
	this.name = name;
	this.address = address;
	this.platform = platform;
	this.accessory = accessory;
	
	//Setup the services
	var service = new this.platform.Service.Lightbulb(this.name);
    service.addCharacteristic(this.platform.Characteristic.Brightness);
  	service.addCharacteristic(this.platform.Characteristic.Hue);
    service.addCharacteristic(this.platform.Characteristic.Saturation);
  	accessory.addService(service);
  	
  	var infservice = accessory.getService(this.platform.Service.AccessoryInformation);
	infservice.setCharacteristic(this.platform.Characteristic.Manufacturer, "Mipow");
	infservice.setCharacteristic(this.platform.Characteristic.Model, "Playbulb Candle");
	infservice.setCharacteristic(this.platform.Characteristic.SerialNumber, this.address);
	accessory.reachable = true;
	
	//Link this to context of accessory
	accessory.context["candle"] = this;
};

PlaybulbCandle.prototype = {
	
};


module.exports = PlaybulbCandle;