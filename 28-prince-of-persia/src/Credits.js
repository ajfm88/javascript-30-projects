"use strict";

PrinceJS.Credits = function (game) {
  this.tick = 0;
};

PrinceJS.Credits.prototype = {
  preload: function () {},

  create: function () {
    this.tick = 0;

    this.game.world.setBounds(0, 0, PrinceJS.SCREEN_WIDTH, PrinceJS.SCREEN_HEIGHT);
    this.game.world.alpha = 1;

    this.textBack = this.game.add.image(0, 0, "title", "marry_jaffar");
    this.textBack.alpha = 0;

    this.tween1 = this.game.add
      .tween(this.textBack)
      .to({ alpha: 1 }, 2000, Phaser.Easing.Linear.None, false, 0, 0, false);

    this.back = this.game.add.image(0, this.world.height, "title", "prince");
    this.back.anchor.setTo(0, 1);

    this.cropRect = new Phaser.Rectangle(0, 0, 0, this.back.height);
    this.tween2 = this.game.add
      .tween(this.cropRect)
      .to({ width: this.back.width }, 200, Phaser.Easing.Linear.None, false, 0, 0, false);
    this.back.crop(this.cropRect);

    this.credits = this.game.add.image(0, this.world.height, "title", "credits");
    this.credits.anchor.setTo(0, 1);

    this.cropCredits = new Phaser.Rectangle(0, 0, 0, this.credits.height);
    this.tween3 = this.game.add
      .tween(this.cropCredits)
      .to({ width: this.credits.width }, 200, Phaser.Easing.Linear.None, false, 0, 0, false);
    this.credits.crop(this.cropCredits);

    this.tween4 = this.game.add
      .tween(this.credits)
      .to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, false, 0, 0, false);
    this.tween4.onComplete.add(this.play, this);

    this.input.keyboard.onDownCallback = null;
    PrinceJS.Utils.delayed(() => {
      this.input.keyboard.onDownCallback = this.play.bind(this);
    }, 1000);
  },

  update: function () {
    switch (this.tick) {
      case 0:
        this.tween1.start();
        break;
      case 1200:
        this.tween2.start();
        break;
      case 1400:
        this.tween3.start();
        break;
      case 1600:
        this.textBack.visible = this.back.visible = false;
        this.tween4.start();
    }

    this.tick++;
    this.back.updateCrop();
    this.credits.updateCrop();

    if (PrinceJS.Utils.continueGame(this.game)) {
      this.play();
    }
  },

  play: function () {
    PrinceJS.currentLevel = 1;
    this.input.keyboard.onDownCallback = null;
    this.state.start("Game");
  }
};
