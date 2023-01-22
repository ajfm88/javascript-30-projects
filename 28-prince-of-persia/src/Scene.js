"use strict";

PrinceJS.Scene = function (game) {
  this.game = game;

  this.back = this.game.add.group();
  this.back.z = 10;

  this.front = this.game.add.group();
  this.front.z = 30;

  this.trobs = [];

  this.flash = false;
  this.tick = 0;

  this._build();
};

PrinceJS.Scene.prototype = {
  _build: function () {
    this.game.add.image(0, 0, "cutscene", "room", this.back);
    this.game.add.image(0, 142, "cutscene", "room_bed", this.back);

    let torchPos = [
      { x: 53, y: 81 },
      { x: 171, y: 81 }
    ];
    let i;
    for (i = 0; i < torchPos.length; i++) {
      let torch = new PrinceJS.Tile.Torch(this.game, PrinceJS.Level.TILE_TORCH, 0, PrinceJS.Level.TYPE_PALACE);
      torch.x = torchPos[i].x;
      torch.y = torchPos[i].y;
      torch.back.frameName = "palace_0";
      this.addObject(torch);
    }

    let starPos = [
      { x: 20, y: 97 },
      { x: 16, y: 104 },
      { x: 23, y: 110 },
      { x: 17, y: 116 },
      { x: 24, y: 120 },
      { x: 18, y: 128 }
    ];
    for (i = 0; i < starPos.length; i++) {
      let star = new PrinceJS.Tile.Star(this.game, starPos[i].x, starPos[i].y);
      this.addObject(star);
    }

    this.game.add.image(59, 120, "cutscene", "room_pillar", this.front);
    this.game.add.image(240, 120, "cutscene", "room_pillar", this.front);
  },

  addTrob: function (trob) {
    this.trobs.push(trob);
  },

  update: function () {
    let i = this.trobs.length;

    while (i--) {
      this.trobs[i].update();
    }

    if (this.flash) {
      if (this.tick === 7) {
        this.flash = false;
        return;
      }

      if (this.tick % 2) {
        this.game.stage.backgroundColor = "#FFFFFF";
      } else {
        this.game.stage.backgroundColor = "#000000";
      }
      this.tick++;
    }
  },

  effect: function () {
    this.flash = true;
  },

  addObject: function (object) {
    this.back.add(object.back);
    this.addTrob(object);
  }
};

PrinceJS.Scene.prototype.constructor = PrinceJS.Scene;
