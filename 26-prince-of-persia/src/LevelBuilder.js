"use strict";

PrinceJS.LevelBuilder = function (game, delegate) {
  this.game = game;
  this.delegate = delegate;

  this.height;
  this.width;
  this.type;

  this.layout = [];

  this.wallColor = ["#D8A858", "#E0A45C", "#E0A860", "#D8A054", "#E0A45C", "#D8A458", "#E0A858", "#D8A860"];
  this.wallPattern = [];

  this.seed;

  this.level;
};

PrinceJS.LevelBuilder.prototype = {
  buildFromJSON: function (json) {
    this.width = json.size.width;
    this.height = json.size.height;
    this.type = json.type;

    this.game.world.setBounds(0, 0, PrinceJS.WORLD_WIDTH * this.width, PrinceJS.WORLD_HEIGHT * this.height);

    this.level = new PrinceJS.Level(this.game, json.number, json.name, this.type);
    this.level.delegate = this.delegate;
    this.startRoomId = json.prince.room;
    this.startLocation = json.prince.location + (json.prince.bias || 0);

    let y, x, id, tile;
    for (y = 0; y < this.height; y++) {
      this.layout[y] = [];

      for (x = 0; x < this.width; x++) {
        let index = y * this.width + x;
        id = json.room[index].id;

        this.layout[y][x] = id;

        if (id !== -1) {
          if (this.type === PrinceJS.Level.TYPE_PALACE) {
            this.generateWallPattern(id);
          }

          this.level.rooms[id] = {};
          this.level.rooms[id].x = x;
          this.level.rooms[id].y = y;
          this.level.rooms[id].links = {};
          this.level.rooms[id].tiles = json.room[index].tile;
        }
      }
    }

    for (y = this.height - 1; y >= 0; y--) {
      for (x = 0; x < this.width; x++) {
        id = this.layout[y][x];

        if (id === -1) {
          continue;
        }

        this.level.rooms[id].links.left = this.getRoomId(x - 1, y);
        this.level.rooms[id].links.right = this.getRoomId(x + 1, y);
        this.level.rooms[id].links.up = this.getRoomId(x, y - 1);
        this.level.rooms[id].links.down = this.getRoomId(x, y + 1);

        if (this.level.rooms[id].links.left <= 0) {
          for (let jj = 2; jj >= 0; jj--) {
            tile = new PrinceJS.Tile.Base(this.game, PrinceJS.Level.TILE_WALL, 0, this.type);
            tile.back.frameName = tile.key + "_wall_0";
            this.level.addTile(-1, jj, id, tile);
          }
        }

        this.buildRoom(id, this.startRoomId, this.startLocation);

        if (this.level.rooms[id].links.up <= 0) {
          for (let ii = 0; ii < 10; ii++) {
            tile = new PrinceJS.Tile.Base(this.game, PrinceJS.Level.TILE_FLOOR, 0, this.type);
            this.level.addTile(ii, -1, id, tile);
          }
        }
      }
    }

    this.level.events = json.events;

    return this.level;
  },

  buildRoom: function (id, startId, startLocation) {
    for (let y = 2; y >= 0; y--) {
      for (let x = 0; x < 10; x++) {
        let tile = this.buildTile(x, y, id, startId, startLocation);
        this.level.addTile(x, y, id, tile);
      }
    }
  },

  buildTile: function (x, y, id, startId, startLocation) {
    let tileNumber = y * 10 + x;
    let t = this.level.rooms[id].tiles[tileNumber];

    let tile, tileChild, tileSeed, wallType, open;
    switch (t.element) {
      case PrinceJS.Level.TILE_WALL:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);

        tileSeed = tileNumber + id;
        wallType = "";

        if (this.getTileAt(x - 1, y, id) === PrinceJS.Level.TILE_WALL) {
          wallType = "W";
        } else {
          wallType = "S";
        }

        wallType += "W";

        if (this.getTileAt(x + 1, y, id) === PrinceJS.Level.TILE_WALL) {
          wallType += "W";
        } else {
          wallType += "S";
        }

        if (this.type === PrinceJS.Level.TYPE_DUNGEON) {
          tile.front.frameName = wallType + "_" + tileSeed;
        } else {
          let bmd = this.game.make.bitmapData(60, 79);

          bmd.rect(0, 16, 32, 20, this.wallColor[this.wallPattern[id][y * 44 + x]]);
          bmd.rect(0, 36, 16, 21, this.wallColor[this.wallPattern[id][y * 44 + 11 + x]]);
          bmd.rect(16, 36, 16, 21, this.wallColor[this.wallPattern[id][y * 44 + 11 + x + 1]]);
          bmd.rect(0, 57, 8, 19, this.wallColor[this.wallPattern[id][y * 44 + 2 * 11 + x]]);
          bmd.rect(8, 57, 24, 19, this.wallColor[this.wallPattern[id][y * 44 + 2 * 11 + x + 1]]);
          bmd.rect(0, 76, 32, 3, this.wallColor[this.wallPattern[id][y * 44 + 3 * 11 + x]]);
          bmd.add(tile.front);

          tileChild = this.game.make.sprite(0, 16, tile.key, "W_" + tileSeed);
          tile.front.addChild(tileChild);
        }

        if (wallType.charAt(2) === "S") {
          tile.back.frameName = tile.key + "_wall_" + t.modifier;
        }
        break;

      case PrinceJS.Level.TILE_SPACE:
      case PrinceJS.Level.TILE_FLOOR:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);
        tileChild = this.game.make.sprite(0, 0, tile.key, tile.key + "_" + t.element + "_" + t.modifier);
        tile.back.addChild(tileChild);
        break;

      case PrinceJS.Level.TILE_STUCK_BUTTON:
      case PrinceJS.Level.TILE_RAISE_BUTTON:
      case PrinceJS.Level.TILE_DROP_BUTTON:
        tile = new PrinceJS.Tile.Button(this.game, t.element, t.modifier, this.type);
        tile.onPushed.add(this.delegate.fireEvent, this.delegate);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_TORCH:
      case PrinceJS.Level.TILE_TORCH_WITH_DEBRIS:
        tile = new PrinceJS.Tile.Torch(this.game, t.element, t.modifier, this.type);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_POTION:
        tile = new PrinceJS.Tile.Potion(this.game, t.modifier, this.type);
        if (tile.isSpecial) {
          const specialTile = this.getTileObjectAt(0, 0, 8);
          if (specialTile) {
            tile.specialModifier = specialTile.modifier;
            tile.onDrank.add(this.delegate.fireEvent, this.delegate);
          }
        }
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_SWORD:
        tile = new PrinceJS.Tile.Sword(this.game, t.modifier, this.type);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_EXIT_RIGHT:
        open = id === startId && Math.abs(tileNumber - startLocation) <= 1;
        tile = new PrinceJS.Tile.ExitDoor(this.game, t.modifier, this.type, open);
        this.level.addTrob(tile);
        if (open) {
          PrinceJS.Utils.delayed(() => {
            tile.drop();
          }, 200);
        }
        break;

      case PrinceJS.Level.TILE_CHOPPER:
        tile = new PrinceJS.Tile.Chopper(this.game, t.modifier, this.type);
        tile.onChopped.add(this.level.activateChopper, this.level);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_SPIKES:
        tile = new PrinceJS.Tile.Spikes(this.game, t.modifier, this.type);
        if (t.modifier === 0) {
          this.level.addTrob(tile);
        }
        break;

      case PrinceJS.Level.TILE_LOOSE_BOARD:
        tile = new PrinceJS.Tile.Loose(this.game, t.modifier, this.type);
        tile.onStartFalling.add(this.delegate.floorStartFall, this.delegate);
        tile.onStopFalling.add(this.delegate.floorStopFall, this.delegate);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_SKELETON:
        tile = new PrinceJS.Tile.Skeleton(this.game, t.modifier, this.type);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_MIRROR:
        tile = new PrinceJS.Tile.Mirror(this.game, t.modifier, this.type);
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_GATE:
        tile = new PrinceJS.Tile.Gate(this.game, t.modifier, this.type);
        if (t.mute === false) {
          tile.setCanMute(false);
        }
        this.level.addTrob(tile);
        break;

      case PrinceJS.Level.TILE_TAPESTRY:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);
        if (this.type === PrinceJS.Level.TYPE_PALACE && t.modifier > 0) {
          tile.back.frameName = tile.key + "_" + t.element + "_" + t.modifier;
          tile.front.frameName = tile.back.frameName + "_fg";
        }
        break;

      case PrinceJS.Level.TILE_TAPESTRY_TOP:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);
        if (this.type === PrinceJS.Level.TYPE_PALACE && t.modifier > 0) {
          tile.back.frameName = tile.key + "_" + t.element + "_" + t.modifier;
          tile.front.frameName = tile.back.frameName + "_fg";

          if (this.getTileAt(x - 1, y, id) === PrinceJS.Level.TILE_LATTICE_SUPPORT) {
            tileChild = this.game.make.sprite(
              0,
              0,
              tile.key,
              tile.key + "_" + PrinceJS.Level.TILE_SMALL_LATTICE + "_fg"
            );
            tile.back.addChild(tileChild);
          }
        }
        break;

      case PrinceJS.Level.TILE_BALCONY_RIGHT:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);
        if (this.type === PrinceJS.Level.TYPE_PALACE) {
          tileChild = this.game.make.sprite(0, -4, tile.key, tile.key + "_balcony");
          tile.back.addChild(tileChild);
        }
        break;

      default:
        tile = new PrinceJS.Tile.Base(this.game, t.element, t.modifier, this.type);
        if (t.element === PrinceJS.Level.TILE_BOTTOM_BIG_PILLAR) {
          if (this.getTileAt(x, y - 1, id) !== PrinceJS.Level.TILE_TOP_BIG_PILLAR) {
            tile.front.frameName += "_low";
            tile.back.frameName += "_low";
          }
        }
        break;
    }

    return tile;
  },

  getTileObjectAt: function (x, y, id) {
    let room = this.level.rooms[id];

    if (x < 0) {
      id = this.getRoomId(room.x - 1, room.y);
      x += 10;
    }
    if (x > 9) {
      id = this.getRoomId(room.x + 1, room.y);
      x -= 10;
    }
    if (y < 0) {
      room = this.getRoomId(room.x, room.y - 1);
      y += 3;
    }
    if (y > 2) {
      room = this.getRoomId(room.x, room.y + 1);
      y -= 3;
    }

    if (id === -1) {
      return null;
    }

    return this.level.rooms[id].tiles[x + y * 10];
  },

  getTileAt: function (x, y, id) {
    let tile = this.getTileObjectAt(x, y, id);
    if (!tile) {
      return PrinceJS.Level.TILE_WALL;
    }
    return tile.element;
  },

  getRoomId: function (x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }

    return this.layout[y][x];
  },

  generateWallPattern: function (room) {
    this.wallPattern[room] = [];
    this.seed = room;

    this.prandom(1);

    let color;

    for (let row = 0; row < 3; row++) {
      for (let subrow = 0; subrow < 4; subrow++) {
        let colorBase = subrow % 2 ? 0 : 4;
        let prevColor = -1;

        for (let col = 0; col <= 10; ++col) {
          do {
            color = colorBase + this.prandom(3);
          } while (color === prevColor);

          this.wallPattern[room][44 * row + 11 * subrow + col] = color;
          prevColor = color;
        }
      }
    }
  },

  prandom: function (max) {
    this.seed = ((this.seed * 214013 + 2531011) & 0xffffffff) >>> 0;
    return (this.seed >>> 16) % (max + 1);
  }
};

PrinceJS.LevelBuilder.prototype.constructor = PrinceJS.LevelBuilder;
