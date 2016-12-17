function PlaybulbCandle(log, name, address, platform, accessory) {
	//Store information
	//this.log = log;
	this.name = name;
	this.address = address;
	
	//Setup the services
	var service = new platform.Service.Lightbulb(this.name);
	service.addCharacteristic(platform.Characteristic.Brightness);
  	service.addCharacteristic(platform.Characteristic.Hue);
	service.addCharacteristic(platform.Characteristic.Saturation);
  	accessory.addService(service);
  	
  	var infservice = accessory.getService(platform.Service.AccessoryInformation);
	infservice.setCharacteristic(platform.Characteristic.Manufacturer, "Mipow");
	infservice.setCharacteristic(platform.Characteristic.Model, "Playbulb Candle");
	infservice.setCharacteristic(platform.Characteristic.SerialNumber, this.address);
	accessory.reachable = true;
	
	//Link this to context of accessory
	accessory.context["candle"] = this;
};

PlaybulbCandle.prototype = {
	
};


module.exports = PlaybulbCandle;
