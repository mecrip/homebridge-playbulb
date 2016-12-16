function PlaybulbCandle(log, address) {
	this.log = log;
	this.address = address;
	this._initialize(log, config, platform);
	//Setup the service
	this.service = new this.platform.Service.LightBulb("Test");
	this.service.addCharacteristic(this.platform.Characteristic.Brightness);
  	this.service.addCharacteristic(this.platform.Characteristic.Hue);
  	this.service.addCharacteristic(this.platform.Characteristic.Saturation);
};

PlaybulbCandle.prototype = {
	getServices: function() {
		var services = [];
		services.push(this.service);
		return services;
	}
};

module.exports = PlaybulbCandle