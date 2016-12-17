function PlaybulbCandle(log, name, address, platform, device, accessory) {
	//Store information
	//this.log = log;
	this.name = name;
	this.address = address;
	this.rgb = "ffffff";
	this.device = device;
	
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

PlaybulbCandle.prototype.getPower = function(callback) {

};

PlaybulbCandle.prototype.setPower = function(value, callback) {

};

PlaybulbCandle.prototype.getHue = function(callback) {

};

PlaybulbCandle.prototype.setHue = function(value, callback) {

};

PlaybulbCandle.prototype.getSaturation = function(callback) {

};

PlaybulbCandle.prototype.setSaturation = function(value, callback) {

};

PlaybulbCandle.prototype.getBrightness = function(callback) {

};

PlaybulbCandle.prototype.setBrightness = function(value, callback) {

};


module.exports = PlaybulbCandle;
