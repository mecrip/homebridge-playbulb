function PlaybulbCandle(log, name, address, platform) {
	this.log = log;
	this.name = name;
	this.address = address;
	this.platform = platform;
	//Setup the service
	this.service = new this.platform.Service.Lightbulb(this.name);
	this.service.addCharacteristic(this.platform.Characteristic.Brightness);
  	this.service.addCharacteristic(this.platform.Characteristic.Hue);
  	this.service.addCharacteristic(this.platform.Characteristic.Saturation);
  	
  	this.infservice = new this.platform.Service.AccessoryInformation();
	this.infservice.setCharacteristic(this.platform.Characteristic.Manufacturer, "Mipow");
	this.infservice.setCharacteristic(this.platform.Characteristic.Model, "Playbulb Candle");
	this.infservice.setCharacteristic(this.platform.Characteristic.SerialNumber, this.address);
};

PlaybulbCandle.prototype = {
	getServices: function() {
		var services = [];
		services.push(this.infservice);
		services.push(this.service);
		return services;
	}
};

module.exports = PlaybulbCandle;