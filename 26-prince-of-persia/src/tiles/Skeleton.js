"use strict";

PrinceJS.Tile.Skeleton = function (game, modifier, type) {
  PrinceJS.Tile.Base.call(this, game, PrinceJS.Level.TILE_SKELETON, modifier, type);
};

PrinceJS.Tile.Skeleton.prototype = Object.create(PrinceJS.Tile.Base.prototype);
PrinceJS.Tile.Skeleton.prototype.constructor = PrinceJS.Tile.Skeleton;

PrinceJS.Tile.Skeleton.prototype.update = function () {};

PrinceJS.Tile.Skeleton.prototype.removeObject = function () {
  this.element = PrinceJS.Level.TILE_FLOOR;
  this.modifier = 0;

  this.front.frameName = this.key + "_" + this.element + "_fg";
  this.back.frameName = this.key + "_" + this.element;
  let tileChild = this.game.make.sprite(0, 0, this.key, this.key + "_" + this.element + "_" + this.modifier);
  this.back.addChild(tileChild);
};
