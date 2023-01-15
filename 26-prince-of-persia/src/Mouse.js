"use strict";

PrinceJS.Mouse = function (game, level, room, location, direction) {
  this.level = level;
  this.room = room;

  this.charBlockX = location % 10;
  this.charBlockY = Math.floor(location / 10);

  let x = PrinceJS.Utils.convertBlockXtoX(this.charBlockX);
  let y = PrinceJS.Utils.convertBlockYtoY(this.charBlockY);

  PrinceJS.Actor.call(this, game, x, y, direction, "mouse");

  this.action = "stop";

  this.updateBase();
};

PrinceJS.Mouse.prototype = Object.create(PrinceJS.Actor.prototype);
PrinceJS.Mouse.prototype.constructor = PrinceJS.Mouse;

PrinceJS.Mouse.prototype.updateActor = function () {
  this.processCommand();
  this.checkButton();
  this.updateCharPosition();
};

PrinceJS.Mouse.prototype.CMD_FRAME = function (data) {
  this.charFrame = data.p1;
  this.updateCharFrame();
  this.updateBlockXY();
  this.processing = false;
};

PrinceJS.Mouse.prototype.updateBlockXY = function () {
  let footX = this.charX + this.charFdx * this.charFace - this.charFfoot * this.charFace;
  let footY = this.charY + this.charFdy;
  this.charBlockX = PrinceJS.Utils.convertXtoBlockX(footX);
  this.charBlockY = Math.min(PrinceJS.Utils.convertYtoBlockY(footY), 2);
};

PrinceJS.Mouse.prototype.updateBase = function () {
  this.baseX = this.level.rooms[this.room].x * PrinceJS.ROOM_WIDTH;
  this.baseY = this.level.rooms[this.room].y * PrinceJS.ROOM_HEIGHT + 3;
};

PrinceJS.Mouse.prototype.checkButton = function () {
  if (!this.visible) {
    return;
  }

  let tile = this.level.getTileAt(this.charBlockX, this.charBlockY, this.room);
  if (tile) {
    switch (tile.element) {
      case PrinceJS.Level.TILE_RAISE_BUTTON:
      case PrinceJS.Level.TILE_DROP_BUTTON:
        tile.push();
        break;
    }
  }
};

PrinceJS.Mouse.prototype.turn = function () {
  this.changeFace();
  this.charX += this.charFace * 5;
};
