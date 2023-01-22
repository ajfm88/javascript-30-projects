"use strict";

PrinceJS.Tile.Mirror = function (game, modifier, type) {
  PrinceJS.Tile.Base.call(this, game, PrinceJS.Level.TILE_FLOOR, modifier, type);

  if (this.type === PrinceJS.Level.TYPE_PALACE) {
    this.mirrorBack = this.game.make.sprite(3, -3, this.key, this.key + "_" + this.element + "_mirror");
    this.mirrorBack.visible = false;
    this.back.addChild(this.mirrorBack);
    this.mirrorFront = this.game.make.sprite(3, -3, this.key, this.key + "_" + this.element + "_fg_mirror");
    this.mirrorFront.visible = false;
    this.front.addChild(this.mirrorFront);

    this.reflectionGroup = this.game.add.group();
    this.reflectionGroup.scale.x *= -1;
    this.reflection = this.game.make.sprite(0, 0, "kid", "kid-1");
    this.reflection.anchor.setTo(0, 1);
    this.reflection.visible = false;
    this.reflectionGroup.addChild(this.reflection);
    this.reflectionGroup.visible = false;
    this.back.addChild(this.reflectionGroup);

    this.reflectionCover = this.game.make.sprite(-103, -5, this.key, this.key + "_" + this.element + "_mirror_cover");
    this.reflectionCover.visible = false;
    this.back.addChild(this.reflectionCover);
  }
};

PrinceJS.Tile.Mirror.prototype = Object.create(PrinceJS.Tile.Base.prototype);
PrinceJS.Tile.Mirror.prototype.constructor = PrinceJS.Tile.Mirror;

PrinceJS.Tile.Mirror.prototype.update = function () {};

PrinceJS.Tile.Mirror.prototype.addObject = function () {
  if (this.element !== PrinceJS.Level.TILE_FLOOR) {
    return;
  }
  this.element = PrinceJS.Level.TILE_MIRROR;
  this.mirrorBack.visible = true;
  this.mirrorFront.visible = true;
  this.reflectionGroup.visible = true;
  this.reflectionCover.visible = true;
};

PrinceJS.Tile.Mirror.prototype.toggleMask = function () {
  if (this.element === PrinceJS.Level.TILE_FLOOR) {
    PrinceJS.Tile.Base.prototype.toggleMask.call(this, ...arguments);
  }
};

PrinceJS.Tile.Mirror.prototype.syncFrame = function (actor) {
  if (this.reflection) {
    this.reflection.frameName = actor.frameName;
    this.reflection.x = actor.x - this.x - 55;
    this.reflection.x = Math.max(this.reflection.x, actor.faceL() ? -25 : -10);
    this.reflection.y = actor.y - this.y;
    this.reflection.visible = this.reflection.x > -40 && this.reflection.x < 20;
  }
};

PrinceJS.Tile.Mirror.prototype.syncFace = function (actor) {
  if (this.reflection) {
    this.reflection.charFace = actor.charFace;
    this.reflection.scale.x = actor.scale.x;
  }
};

PrinceJS.Tile.Mirror.prototype.hideReflection = function () {
  if (this.reflection) {
    this.reflection.visible = false;
    this.reflection = null;
  }
};
