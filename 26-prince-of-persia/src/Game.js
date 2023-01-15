"use strict";

PrinceJS.Game = function (game) {
  this.kid;

  this.level;

  this.ui;
  this.currentRoom;

  this.enemies = [];
};

PrinceJS.Game.prototype = {
  preload: function () {
    this.game.load.audio("TheShadow", "assets/music/15_The_Shadow.mp3");
    this.game.load.audio("Float", "assets/music/16_Float.mp3");
    this.game.load.audio("Jaffar2", "assets/music/19_Jaffar_2.mp3");
    this.game.load.audio("JaffarDead", "assets/music/20_Jaffar_Dead.mp3");
    this.game.load.audio("HeroicDeath", "assets/music/13_Heroic_Death.mp3");

    let levelBasePath = PrinceJS.currentLevel < 90 ? "assets/maps/" : "assets/maps/custom/";
    this.load.json("level", levelBasePath + "level" + PrinceJS.currentLevel + ".json");
  },

  create: function () {
    this.game.sound.stopAll();

    this.continueTimer = -1;
    this.pressButtonToContinueTimer = -1;
    this.pressButtonToNext = false;

    if (!PrinceJS.startTime) {
      let date = new Date();
      date.setMinutes(date.getMinutes() - (60 - PrinceJS.minutes));
      PrinceJS.startTime = date;
    }

    let json = this.game.cache.getJSON("level");
    if (!json) {
      this.restartGame();
      return;
    }
    this.level = new PrinceJS.LevelBuilder(this.game, this).buildFromJSON(json);
    this.specialEvents = json.prince.specialEvents !== false;
    this.playDanger = json.prince.danger !== false;

    this.shadow = null;
    this.mouse = null;
    for (let i = 0; i < json.guards.length; i++) {
      let data = json.guards[i];
      let enemy = new PrinceJS.Enemy(
        this.game,
        this.level,
        data.location + (data.bias || 0),
        data.direction * (data.reverse || 1),
        data.room,
        data.skill,
        data.colors,
        data.type,
        i + 1
      );
      if (data.visible === false) {
        enemy.setInvisible();
      }
      if (data.active === false) {
        enemy.setInactive();
      }
      if (data.sneak === false) {
        enemy.setSneakUp(false);
      }
      enemy.onInitLife.add((fighter) => {
        this.ui.setOpponentLive(fighter);
      }, this);
      this.enemies.push(enemy);
      if (enemy.charName === "shadow") {
        this.shadow = enemy;
      }
    }
    let turn = json.prince.turn !== false;
    let direction = json.prince.direction * (json.prince.reverse || 1);
    if (turn) {
      direction = -direction;
    }

    this.kid = new PrinceJS.Kid(
      this.game,
      this.level,
      json.prince.location + (json.prince.bias || 0),
      direction,
      json.prince.room
    );
    if (typeof json.prince.sword === "boolean") {
      this.kid.hasSword = json.prince.sword;
    }
    if (turn) {
      this.kid.charX += 7;
      PrinceJS.Utils.delayed(() => {
        this.kid.action = "turn";
      }, 100);
    }
    this.kid.charX += json.prince.offset || 0;

    this.game.onPause.add(this.onPause, this);
    this.game.onResume.add(this.onResume, this);

    this.kid.onChangeRoom.add(this.changeRoom, this);
    this.kid.onDead.add(this.handleDead, this);
    this.kid.onFlipped.add(this.handleFlipped, this);
    this.kid.onNextLevel.add(this.nextLevel, this);
    this.kid.onLevelFinished.add(this.levelFinished, this);

    PrinceJS.Tile.Gate.reset();
    this.visitedRooms = {};
    this.currentRoom = json.prince.room;
    this.blockCamera = false;

    this.world.sort("z");
    this.world.alpha = 1;

    this.ui = new PrinceJS.Interface(this.game, this);
    this.ui.setPlayerLive(this.kid);
    this.setupCamera(json.prince.room, json.prince.cameraRoom);

    this.game.time.events.loop(80, this.updateWorld, this);

    this.input.keyboard.addKey(Phaser.Keyboard.R).onDown.add(this.restartGameEvent, this);
    this.input.keyboard.addKey(Phaser.Keyboard.A).onDown.add(this.restartLevelEvent, this);
    this.input.keyboard.addKey(Phaser.Keyboard.L).onDown.add(this.nextLevelEvent, this);
    this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.showRemainingMinutes, this);

    this.input.keyboard.onDownCallback = this.buttonPressed.bind(this);

    this.firstUpdate = true;
    if (PrinceJS.danger === null) {
      PrinceJS.danger = this.level.number === 1 && this.playDanger;
    }
    PrinceJS.Utils.resetFlipScreen();
    PrinceJS.Utils.updateQuery();
  },

  update: function () {
    if (PrinceJS.Utils.continueGame(this.game)) {
      this.buttonPressed();
      let pos = PrinceJS.Utils.effectivePointer(this.game);
      let size = PrinceJS.Utils.effectiveScreenSize(this.game);
      if (
        (PrinceJS.Utils.isScreenFlipped() && pos.y >= 0 && pos.y <= 0.04 * size.height) ||
        (!PrinceJS.Utils.isScreenFlipped() && pos.y >= 0.96 * size.height && pos.y <= size.height)
      ) {
        if (this.isRemainingMinutesShown() || this.isLevelShown()) {
          if (pos.x >= 0 && pos.x <= 0.2 * size.width) {
            this.previousLevel(PrinceJS.currentLevel, true);
          } else if (pos.x >= 0.8 * size.width && pos.x <= size.width) {
            this.nextLevel(PrinceJS.currentLevel, true, true);
          } else if (pos.x >= 0.4 * size.width && pos.x <= 0.6 * size.width) {
            this.restartLevel(true);
          }
        }
        if (pos.x >= 0 && pos.x <= size.width) {
          this.showRemainingMinutes();
        }
      }
      if (PrinceJS.Utils.gamepadInfoPressed(this.game)) {
        if (this.isRemainingMinutesShown() || this.isLevelShown()) {
          this.restartLevel(true);
        } else {
          this.showRemainingMinutes();
        }
      } else if (PrinceJS.Utils.gamepadPreviousPressed(this.game)) {
        this.previousLevel(PrinceJS.currentLevel, true);
      } else if (PrinceJS.Utils.gamepadNextPressed(this.game)) {
        this.nextLevel(PrinceJS.currentLevel, true, true);
      }
    }
  },

  updateWorld: function () {
    this.level.update();
    this.kid.updateActor();
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].updateActor();
    }
    if (this.mouse) {
      this.mouse.updateActor();
    }
    this.checkLevelLogic();
    this.ui.updateUI();
    this.checkTimers();
    this.firstUpdate = false;
  },

  checkLevelLogic: function () {
    if (!this.specialEvents) {
      return;
    }
    let jaffar;
    let skeleton;
    let tile;
    switch (this.level.number) {
      case 1:
        if (this.firstUpdate) {
          this.level.fireEvent(8, PrinceJS.Level.TILE_DROP_BUTTON);
          if (PrinceJS.danger) {
            PrinceJS.Utils.delayed(() => {
              this.game.sound.play("Danger");
            }, 800);
          }
        }
        break;

      case 2:
        if (this.firstUpdate) {
          for (let i = 0; i < this.enemies.length; i++) {
            let enemy = this.enemies[i];
            if (enemy && enemy.room === 24 && enemy.charBlockX === 0 && enemy.charBlockY === 1) {
              enemy.charX -= 12;
              enemy.updateBlockXY();
            }
          }
        }
        break;

      case 3:
        skeleton = this.kid.opponent && this.kid.opponent.charName === "skeleton" ? this.kid.opponent : null;
        if (skeleton) {
          if (
            this.level.exitDoorOpen &&
            this.kid.room === skeleton.room &&
            Math.abs(this.kid.opponentDistance()) < 999
          ) {
            let tile = this.level.getTileAt(skeleton.charBlockX, skeleton.charBlockY, skeleton.room);
            if (tile.element === PrinceJS.Level.TILE_SKELETON) {
              tile.removeObject();
              skeleton.setActive();
              this.game.sound.play("BonesLeapToLife");
            }
          }
          if (skeleton.room === 3 && skeleton.setCharForRoom !== skeleton.room) {
            skeleton.setCharForRoom = skeleton.room;
            PrinceJS.Utils.delayed(() => {
              if (skeleton.charFace === -1) {
                skeleton.turn();
              }
              skeleton.room = 3;
              skeleton.charX = PrinceJS.Utils.convertBlockXtoX(4);
              skeleton.charY = PrinceJS.Utils.convertBlockYtoY(1);
              skeleton.action = "stand";
              this.kid.sheathe();
            }, 100);
          }
          if (skeleton.room === 3 && skeleton.charBlockY === 1 && skeleton.charX <= 45 && !skeleton.inFallDown) {
            skeleton.charX = 55;
            skeleton.updateBlockXY();
            skeleton.startFall();
          }
          if (skeleton.room === 8 && !skeleton.defeated) {
            skeleton.defeated = true;
            this.game.sound.play("Victory");
            this.kid.sheathe();
          }
        }
        break;

      case 4:
        if (this.level.exitDoorOpen && this.kid.room === 11 && this.kid.charBlockY === 0) {
          tile = this.level.getTileAt(4, 0, 4);
          if (tile instanceof PrinceJS.Tile.Mirror) {
            tile.addObject();
            this.kid.delegate = tile;
            this.level.mirror = tile;
          }
        } else if (
          this.level.exitDoorOpen &&
          this.currentCameraRoom === 4 &&
          this.kid.charBlockY === 0 &&
          this.level.mirror &&
          !this.level.mirrorDetected
        ) {
          this.level.mirrorDetected = true;
          PrinceJS.Utils.delayed(() => {
            this.game.sound.play("Danger");
          }, 100);
        }
        tile = this.level.getTileAt(this.kid.charBlockX - this.kid.charFace, this.kid.charBlockY, this.kid.room);
        if (
          tile &&
          tile.element === PrinceJS.Level.TILE_MIRROR &&
          this.kid.action === "runjump" &&
          this.kid.faceL() &&
          !this.level.shadowOutOfMirror
        ) {
          if (this.kid.distanceToFloor() === 0) {
            this.kid.bump();
          } else {
            tile.hideReflection();
            this.shadow && this.shadow.appearOutOfMirror(tile);
            this.level.shadowOutOfMirror = true;
            this.game.sound.play("Mirror");
            this.kid.stealLife();
          }
        }
        if (this.level.mirror && this.kid.room === 4 && this.kid.charBlockX <= 3 && this.kid.charBlockY === 1) {
          tile = this.level.getTileAt(4, 0, 4);
          if (tile && tile.element === PrinceJS.Level.TILE_MIRROR) {
            tile.hideReflection();
          }
        }
        if (this.shadow && this.shadow.visible && this.shadow.charBlockY > 0) {
          this.shadow.action = "stand";
          this.shadow.setInvisible();
        }
        break;

      case 5:
        if (this.shadow) {
          tile = this.level.getTileAt(1, 0, 24);
          if (tile.state === PrinceJS.Tile.Gate.STATE_RAISING && !this.shadow.visible && this.shadow.faceR()) {
            this.shadow.visible = true;
            this.performProgram(
              [
                { i: "ACTION", p1: 2600, p2: "running" },
                { i: "ACTION", p1: 700, p2: "runstop" },
                { i: "ACTION", p1: 0, p2: "drinkpotion" },
                { i: "SOUND", p1: 0, p2: "DrinkPotionGlugGlug" },
                { i: "REM_OBJECT" },
                { i: "WAIT", p1: 1500 },
                { i: "ACTION", p1: 500, p2: "turn" },
                { i: "ACTION", p1: 3000, p2: "running" }
              ],
              this.shadow
            );
          }
          if (
            this.shadow.visible &&
            (this.currentCameraRoom === 11 ||
              (this.shadow.room === 11 && this.shadow.charBlockX === 8 && this.shadow.faceL()))
          ) {
            this.shadow.action = "stand";
            this.shadow.setInvisible();
          }
        }
        break;

      case 6:
        if (this.shadow) {
          if (this.firstUpdate) {
            this.shadow.charX += 8;
          }
          if (this.currentCameraRoom === 1) {
            if (!this.level.shadowDetected) {
              this.level.shadowDetected = true;
              this.game.sound.play("Danger");
            }
            if (this.kid.charBlockX === 6) {
              this.shadow.action = "step11";
            }
          }
        }
        if (this.currentCameraRoom === 1 && this.kid.charBlockY === 2 && this.kid.charY >= 185) {
          this.blockCamera = true;
          PrinceJS.Utils.delayed(() => {
            this.nextLevel(PrinceJS.currentLevel);
          }, 100);
        }
        break;

      case 8:
        if (this.level.exitDoorOpen && this.currentCameraRoom === 16 && this.kid.charBlockY === 0) {
          if (!this.level.waitForMouse) {
            this.level.waitForMouse = true;
            PrinceJS.Utils.delayed(() => {
              this.level.waitedForMouse = true;
            }, 12500);
          }
          if (this.level.waitedForMouse && !this.mouse) {
            this.mouse = new PrinceJS.Mouse(this.game, this.level, 16, 9, -1);
            this.performProgram(
              [
                { i: "ACTION", p1: 625, p2: "scurry" },
                { i: "ACTION", p1: 0, p2: "stop" },
                { i: "ACTION", p1: 1000, p2: "raise" },
                { i: "ACTION", p1: 0, p2: "stop" },
                { i: "TURN", p1: 0 },
                { i: "ACTION", p1: 600, p2: "scurry" },
                { i: "REM_ACTOR" }
              ],
              this.mouse
            );
          }
        }
        break;

      case 12:
        if (
          this.kid.room === 20 &&
          this.kid.charBlockY === 1 &&
          this.level.getTileAt(1, 0, 15).element === PrinceJS.Level.TILE_SWORD
        ) {
          this.level.removeObject(1, 0, 15);
        }
        if (!this.shadow) {
          this.level.leapOfFaith = true;
        } else {
          if (
            this.kid.room === 15 &&
            (this.kid.charBlockX === 5 || this.kid.charBlockX === 6) &&
            !this.shadow.visible &&
            !this.level.shadowMerge
          ) {
            this.shadow.charX = PrinceJS.Utils.convertBlockXtoX(1);
            this.shadow.charY = PrinceJS.Utils.convertBlockYtoY(1);
            this.shadow.setVisible();
            this.shadow.setActive();
            PrinceJS.Utils.delayed(() => {
              this.shadow.refracTimer = 9;
              this.shadow.opponent = this.kid;
              this.kid.opponent = this.shadow;
              this.kid.opponentSync = true;
            }, 1000);
          }
          if (
            !this.shadow.active &&
            this.kid.opponent &&
            Math.abs(this.kid.opponentDistance()) <= (this.kid.action.includes("jump") ? 15 : 7) &&
            !this.level.shadowMerge
          ) {
            this.level.shadowMerge = true;
            this.level.leapOfFaith = true;
            this.ui.resetOpponentLive();
            this.kid.addLife();
            this.kid.mergeShadowPosition();
            this.kid.showShadowOverlay();
            this.kid.flashShadowOverlay();
            PrinceJS.Utils.flashWhiteShadowMerge(this.game);
            PrinceJS.Utils.delayed(() => {
              this.game.sound.play("Prince");
            }, 2000);
          }
        }
        if (this.level.leapOfFaith && !this.level.leapOfFaithSetup && this.level.rooms[2]) {
          this.level.leapOfFaithSetup = true;
          for (let i = 0; i < 10; i++) {
            tile = this.level.getTileAt(i, 0, 2);
            if (tile && tile.element === PrinceJS.Level.TILE_SPACE) {
              tile.element = PrinceJS.Level.TILE_FLOOR;
              tile.hidden = true;
            }
            if (i >= 6) {
              tile = this.level.getTileAt(i, 0, this.level.rooms[2].links.left);
              if (tile && tile.element === PrinceJS.Level.TILE_SPACE) {
                tile.element = PrinceJS.Level.TILE_FLOOR;
                tile.hidden = true;
              }
            }
          }
        }
        if (this.currentCameraRoom === 23) {
          this.nextLevel(PrinceJS.currentLevel);
        }
        break;

      case 13:
        if (this.firstUpdate) {
          this.kid.action = "startrun";
        }
        Object.keys(this.visitedRooms).forEach((visitedRoom) => {
          if (!["16", "23"].includes(visitedRoom)) {
            return;
          }
          let tiles = [2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
          for (let i = 0; i < tiles.length; i++) {
            let tile = this.kid.level.getTileAt(tiles[i], 2, this.level.rooms[visitedRoom].links.up);
            if (tile.element === PrinceJS.Level.TILE_LOOSE_BOARD && !tile.fallStarted()) {
              tile.shake(true);
              break;
            }
          }
        });
        jaffar = this.kid.opponent && this.kid.opponent.baseCharName === "jaffar" ? this.kid.opponent : null;
        if (jaffar) {
          if (!jaffar.alive && !PrinceJS.endTime) {
            PrinceJS.endTime = new Date();
            this.showRemainingMinutes();
          }
          if (!jaffar.alive && !this.level.triggerOpenExitDoor) {
            this.level.triggerOpenExitDoor = true;
            PrinceJS.Utils.delayed(() => {
              let button = this.level.getTileAt(0, 0, 24);
              if (button.element === PrinceJS.Level.TILE_RAISE_BUTTON) {
                button.mute = true;
                button.push();
              }
            }, 7000);
          }
        }
        break;

      case 14:
        if (this.currentCameraRoom === 5) {
          this.nextLevel(PrinceJS.currentLevel);
        }
        break;
    }
  },

  fireEvent: function (event, type, stuck) {
    this.level.fireEvent(event, type, stuck);
  },

  performProgram: function (program, actor) {
    return program.reduce((promise, operation) => {
      return promise.then(() => {
        let object = operation.o || actor;
        let fn;
        switch (operation.i) {
          case "ACTION":
            fn = () => {
              object.action = operation.p2;
            };
            break;
          case "WAIT":
            fn = () => {};
            break;
          case "TURN":
            fn = () => {
              object.turn();
            };
            break;
          case "SOUND":
            fn = () => {
              this.game.sound.play(operation.p2);
            };
            break;
          case "REM_OBJECT":
            fn = () => {
              this.level.removeObject(object.charBlockX, object.charBlockY, object.room);
            };
            break;
          case "REM_ACTOR":
            fn = () => {
              object.visible = false;
              object.kill();
            };
            break;
          default:
            fn = operation.i;
            break;
        }
        return PrinceJS.Utils.perform(fn, operation.p1);
      });
    }, Promise.resolve());
  },

  checkTimers: function () {
    if (this.continueTimer > -1) {
      this.continueTimer--;
      if (this.continueTimer === 0) {
        this.continueTimer = -1;
        this.ui.showPressButtonToContinue();
        this.pressButtonToContinueTimer = 260;
      }
    }
    if (this.pressButtonToContinueTimer > -1) {
      this.pressButtonToContinueTimer--;
      if (this.pressButtonToContinueTimer === 0) {
        this.pressButtonToContinueTimer = -1;
        this.restartGame();
      }
    }
  },

  showRemainingMinutes: function (force) {
    this.ui.showRemainingMinutes(force);
  },

  isRemainingMinutesShown: function () {
    return this.ui.isRemainingMinutesShown();
  },

  isLevelShown: function () {
    return this.ui.isLevelShown();
  },

  restartGameEvent(event) {
    if (!event.ctrlKey && !event.shiftKey) {
      return;
    }
    this.restartGame();
  },

  restartLevelEvent(event) {
    if (!event.ctrlKey && !event.shiftKey) {
      return;
    }
    this.restartLevel(true);
  },

  nextLevelEvent: function (event) {
    if (!event.ctrlKey && !event.shiftKey) {
      return;
    }

    if (PrinceJS.currentLevel > 3 && PrinceJS.currentLevel < 90) {
      return;
    }

    this.nextLevel(undefined, true);
  },

  restartGame() {
    this.input.keyboard.onDownCallback = null;
    PrinceJS.Restart();
    this.state.start("Title");
  },

  restartLevel(skipped = true) {
    this.reset(true);
    PrinceJS.skipShowLevel = [13, 14].includes(PrinceJS.currentLevel) && !skipped;
  },

  levelFinished() {
    this.pressButtonToNext = true;
  },

  nextLevel: function (triggerLevel, skipped = false, keepRemainingTime = false) {
    if (triggerLevel !== undefined && triggerLevel !== PrinceJS.currentLevel) {
      return;
    }

    PrinceJS.danger = null;
    PrinceJS.currentLevel++;
    PrinceJS.currentHealth = PrinceJS.currentLevel === 13 ? this.kid.health : null;
    PrinceJS.maxHealth = this.kid.maxHealth;
    if (PrinceJS.currentLevel > 15 && PrinceJS.currentLevel < 90) {
      this.restartGame();
      return;
    }

    if (skipped && !keepRemainingTime) {
      PrinceJS.Utils.setRemainingMinutesTo15();
    }

    if (PrinceJS.currentLevel >= 100 && this.level.number === 14) {
      PrinceJS.Utils.resetRemainingMinutesTo60();
    }

    this.reset();
    PrinceJS.skipShowLevel = [13, 14].includes(PrinceJS.currentLevel) && !skipped;
  },

  previousLevel: function (triggerLevel, skipped = false) {
    if (triggerLevel !== undefined && triggerLevel !== PrinceJS.currentLevel) {
      return;
    }

    PrinceJS.danger = null;
    if (PrinceJS.currentLevel > 1) {
      PrinceJS.currentLevel--;
    }

    this.reset();
    PrinceJS.skipShowLevel = [13, 14].includes(PrinceJS.currentLevel) && !skipped;
  },

  handleDead: function () {
    this.continueTimer = 10;
  },

  handleFlipped: function () {
    this.ui.flipped();
  },

  handleChop: function (tile) {
    tile.chop(tile.room === this.currentCameraRoom);
  },

  timeUp() {
    PrinceJS.Utils.delayed(() => {
      PrinceJS.currentLevel = 16;
      this.state.start("Cutscene");
    }, 1000);
  },

  outOfRoom() {
    this.kid.die();
    this.handleDead();
  },

  buttonPressed: function () {
    if (this.pressButtonToContinueTimer > -1) {
      this.reset(true);
    }
    if (this.pressButtonToNext) {
      this.nextLevel(PrinceJS.currentLevel);
    }
  },

  reset: function (suppressCutscene) {
    this.game.sound.stopAll();

    this.continueTimer = -1;
    this.pressButtonToContinueTimer = -1;
    this.pressButtonToNext = false;

    this.enemies = [];
    if (!suppressCutscene && [2, 4, 6, 8, 9, 12, 15].indexOf(PrinceJS.currentLevel) > -1) {
      this.state.start("Cutscene");
    } else {
      this.state.start("Game");
    }
    PrinceJS.skipShowLevel = [13, 14].includes(PrinceJS.currentLevel);
  },

  onPause: function () {
    PrinceJS.Utils.updateQuery();
    this.ui.showGamePaused();
  },

  onResume: function () {
    PrinceJS.Utils.restoreQuery();
    this.showRemainingMinutes(true);
  },

  changeRoom: function (room, cameraRoom) {
    this.setupCamera(room, cameraRoom);
    if (this.currentRoom === room) {
      return;
    }
    this.currentRoom = room;
    this.kid.flee = false;
  },

  setupCamera: function (room, cameraRoom) {
    if (this.blockCamera) {
      return;
    }
    if (this.currentRoom > 0 && room <= 0) {
      this.outOfRoom();
      return;
    }
    if (cameraRoom === 0) {
      return;
    }
    room = cameraRoom || room;
    if (this.level.rooms[room]) {
      this.game.camera.x = this.level.rooms[room].x * PrinceJS.SCREEN_WIDTH * PrinceJS.SCALE_FACTOR;
      this.game.camera.y = this.level.rooms[room].y * PrinceJS.ROOM_HEIGHT * PrinceJS.SCALE_FACTOR;
      this.checkForOpponent(room);
      this.level.checkGates(room, this.currentCameraRoom);
      this.currentCameraRoom = room;
      this.visitedRooms[this.currentCameraRoom] = true;
    }
  },

  recheckCurrentRoom: function () {
    this.checkForOpponent(this.currentCameraRoom);
  },

  checkForOpponent: function (room) {
    let currentEnemy;
    // Same Room / Same BlockY
    for (let i = 0; i < this.enemies.length; i++) {
      let enemy = this.enemies[i];
      if (enemy.alive && this.kid.charBlockY === enemy.charBlockY && this.kid.opponentInSameRoom(enemy, room)) {
        currentEnemy = enemy;
        break;
      }
    }
    // Near Room / Same BlockY
    if (!currentEnemy) {
      for (let i = 0; i < this.enemies.length; i++) {
        let enemy = this.enemies[i];
        if (enemy.alive && this.kid.charBlockY === enemy.charBlockY && this.kid.opponentNearRoom(enemy, room)) {
          currentEnemy = enemy;
          break;
        }
      }
    }
    // Same Room
    if (!currentEnemy) {
      for (let i = 0; i < this.enemies.length; i++) {
        let enemy = this.enemies[i];
        if (enemy.alive && this.kid.opponentInSameRoom(enemy, room)) {
          currentEnemy = enemy;
          break;
        }
      }
    }
    // Near Room
    if (!currentEnemy) {
      for (let i = 0; i < this.enemies.length; i++) {
        let enemy = this.enemies[i];
        if (enemy.alive && this.kid.opponentNearRoom(enemy, room)) {
          currentEnemy = enemy;
          break;
        }
      }
    }
    if (currentEnemy) {
      if (currentEnemy.baseCharName === "jaffar" && currentEnemy.alive && !currentEnemy.meet) {
        this.game.sound.play("Jaffar2");
      }
      if (this.kid.opponent !== currentEnemy) {
        this.kid.opponent = currentEnemy;
        this.kid.flee = false;
      }
      currentEnemy.opponent = this.kid;
      currentEnemy.meet = true;
    }
    let opponentSameRoom = false;
    let opponentNextRoom = false;
    if (this.kid.opponent) {
      if (this.kid.opponentInSameRoom(this.kid.opponent, room)) {
        opponentSameRoom = true;
      }
      if (this.kid.opponentNextRoom(this.kid.opponent, room)) {
        opponentNextRoom = true;
      }
    }
    if (this.ui) {
      if (opponentSameRoom) {
        this.ui.setOpponentLive(this.kid.opponent);
      } else if (
        !this.kid.opponent ||
        this.kid.opponent !== this.ui.opp ||
        !this.kid.opponentOnSameLevel() ||
        !opponentNextRoom
      ) {
        this.ui.resetOpponentLive();
      }
    }
  },

  floorStartFall: function (tile) {
    this.level.floorStartFall(tile);
  },

  floorStopFall: function (tile) {
    this.level.floorStopFall(tile);
    this.kid.checkLooseFloor(tile);
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].checkLooseFloor(tile);
    }
  }
};
