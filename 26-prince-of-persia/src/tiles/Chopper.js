"use strict";

PrinceJS.Tile.Chopper = function (game, modifier, type) {
  PrinceJS.Tile.Base.call(this, game, PrinceJS.Level.TILE_CHOPPER, modifier, type);

  this.tileChildBack = this.game.make.sprite(0, 0, this.key, this.key + "_chopper_5");
  this.back.addChild(this.tileChildBack);

  this.tileChildFront = this.game.make.sprite(0, 0, this.key, this.key + "_chopper_5_fg");
  this.front.addChild(this.tileChildFront);

  this.blood = this.game.make.sprite(12, 41, "general", "chopper-blood_4");
  this.blood.visible = false;
  this.tileChildFront.addChild(this.blood);

  this.step = 0;

  this.onChopped = new Phaser.Signal();

  this.active = false;
  this.sound = false;
};

PrinceJS.Tile.Chopper.prototype = Object.create(PrinceJS.Tile.Base.prototype);
PrinceJS.Tile.Chopper.prototype.constructor = PrinceJS.Tile.Chopper;

PrinceJS.Tile.Chopper.prototype.update = function () {
  if (this.active) {
    this.step++;
    if (this.step > 14) {
      this.step = 0;
      this.active = false;
    } else {
      if (this.step < 6) {
        this.tileChildBack.frameName = this.key + "_chopper_" + this.step;
        this.tileChildFront.frameName = this.key + "_chopper_" + this.step + "_fg";
        this.blood.frameName = "chopper-blood_" + this.step;

        if (this.step === 3) {
          this.onChopped.dispatch(this.roomX, this.roomY, this.room);
          if (this.sound) {
            this.game.sound.play("SlicerBladesClash");
          }
        }
      }
    }
  }
};

PrinceJS.Tile.Chopper.prototype.chop = function (sound) {
  this.active = true;
  this.sound = sound;
};

PrinceJS.Tile.Chopper.prototype.showBlood = function () {
  this.blood.visible = true;
};
