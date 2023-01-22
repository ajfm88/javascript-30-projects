"use strict";

PrinceJS.Tile.Potion = function (game, modifier, type) {
  this.specialModifier = modifier;
  this.isSpecial = modifier >= PrinceJS.Level.POTION_SPECIAL;
  modifier = Math.max(1, Math.min(5, modifier));
  PrinceJS.Tile.Base.call(this, game, PrinceJS.Level.TILE_POTION, modifier, type);

  let yy = 53;
  if (modifier > 1 && modifier < 5) {
    yy -= 4;
  }

  this.onDrank = new Phaser.Signal();

  this.tileChild = this.game.make.sprite(25, yy, "general");
  this.front.frameName += "_" + modifier;
  this.front.addChild(this.tileChild);

  this.step = this.game.rnd.between(0, 6);

  this.color = PrinceJS.Tile.Potion.bubbleColors[modifier - 1];
};

PrinceJS.Tile.Potion.frames = Phaser.Animation.generateFrameNames("bubble_", 1, 7, "", 1);
PrinceJS.Tile.Potion.bubbleColors = ["red", "red", "green", "green", "blue"];

PrinceJS.Tile.Potion.prototype = Object.create(PrinceJS.Tile.Base.prototype);
PrinceJS.Tile.Potion.prototype.constructor = PrinceJS.Tile.Potion;

PrinceJS.Tile.Potion.prototype.update = function () {
  this.tileChild.frameName = PrinceJS.Tile.Potion.frames[this.step] + "_" + this.color;
  this.step = (this.step + 1) % PrinceJS.Tile.Potion.frames.length;
};

PrinceJS.Tile.Potion.prototype.removeObject = function () {
  this.tileChild.destroy();
  this.element = PrinceJS.Level.TILE_FLOOR;
  this.modifier = 0;

  this.front.frameName = this.key + "_" + this.element + "_fg";
  this.back.frameName = this.key + "_" + this.element;
  let tileChild = this.game.make.sprite(0, 0, this.key, this.key + "_" + this.element + "_" + this.modifier);
  this.back.addChild(tileChild);
  if (this.decoration) {
    this.decoration.destroy();
    this.decoration = undefined;
  }
  if (this.isSpecial) {
    PrinceJS.Utils.delayed(() => {
      this.onDrank.dispatch(this.specialModifier, PrinceJS.Level.TILE_RAISE_BUTTON);
    }, 1000);
  }
};
