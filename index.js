"use strict";

var Service, Characteristic;

const gpio = require('rpi-gpio')
const converter = require('color-convert');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-gpio-rgb-ledstrip', 'SmartLedStrip', SmartLedStripAccessory);
}

function SmartLedStripAccessory(log, config) {
  this.log      = log;
  this.name     = config['name'];

  this.rPin     = config['rPin'];
  this.gPin     = config['gPin'];
  this.bPin     = config['bPin'];

  if (!this.rPin) throw new Error("You must provide a config value for redPin.");
  if (!this.gPin) throw new Error("You must provide a config value for greenPin.");
  if (!this.bPin) throw new Error("You must provide a config value for bluePin.");

  gpio.setMode('mode_bcm');
  gpio.setup(this.rPin, gpio.DIR_OUT, setupCallback);
  gpio.setup(this.gPin, gpio.DIR_OUT, setupCallback);
  gpio.setup(this.bPin, gpio.DIR_OUT, setupCallback);
}

function setupCallback(err) {
  if (err) throw err;
}

SmartLedStripAccessory.prototype = {

  getServices : function(){

    let informationService = new Service.AccessoryInformation();

    informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Manfredi Pistone')
    .setCharacteristic(Characteristic.Model, 'Homebridge RGB LedStrip')
    .setCharacteristic(Characteristic.SerialNumber, '16-26-36');

    let smartLedStripService = new Service.Lightbulb(this.name);

    smartLedStripService
        .getCharacteristic(Characteristic.On)
        .on('change',this.toggleState.bind(this));

    smartLedStripService
        .addCharacteristic(new Characteristic.Brightness())
        .on('change',this.toggleState.bind(this));

    smartLedStripService
        .addCharacteristic(new Characteristic.Hue())
        .on('change',this.toggleState.bind(this));

    smartLedStripService
        .addCharacteristic(new Characteristic.Saturation())
        .on('change',this.toggleState.bind(this));

    this.informationService = informationService;
    this.smartLedStripService = smartLedStripService;

    this.log('Homebridge RGB LedStrip Initialized');

    return [informationService, smartLedStripService];
  },

  isOn : function() {
      return this.smartLedStripService.getCharacteristic(Characteristic.On).value;
  },

  getBrightness : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Brightness).value;
  },

  getHue : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Hue).value;
  },

  getSaturation : function(){
    return this.smartLedStripService.getCharacteristic(Characteristic.Saturation).value;
  },

  toggleState : function()
  {
      if(!this.isOn())
      {
          this.updateRGB(0,0,0);
          return;
      }

      var brightness = this.getBrightness();
      if(brightness!=0){
          var rgb = converter.hsv.rgb([this.getHue(), this.getSaturation(), brightness]);
          this.updateRGB(rgb[0], rgb[1], rgb[2]);
      }else{
          this.updateRGB(0,0,0);
      }
  },

  updateRGB : function(red, green, blue)
  {
      this.log("Setting rgb values to: Red: "+red + " Green: "+green+ " Blue: "+blue);
      gpio.write(this.rPin, red, function(err) { if (err) throw err; });
      gpio.write(this.gPin, green, function(err) { if (err) throw err; });
      gpio.write(this.bPin, blue, function(err) { if (err) throw err; });
  }

}
