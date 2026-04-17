class NameEntryScene extends Phaser.Scene {
  constructor() { super('NameEntry'); }

  create() {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x1a1a2e);

    // Decorative chests
    this.add.image(cx - 200, cy + 80, 'chest').setScale(2.5).setAlpha(0.3);
    this.add.image(cx + 200, cy + 80, 'chest').setScale(2.5).setAlpha(0.3);

    // Title
    this.add.text(cx, cy - 140, 'LOOT & SCATTER', {
      fontSize: '42px', fill: '#ffaa00', stroke: '#7a4f00', strokeThickness: 6,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 95, 'Collect rare loot before time runs out!', {
      fontSize: '14px', fill: '#7ec850', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Panel
    const panel = this.add.rectangle(cx, cy + 10, 380, 200, 0x2d2d44, 0.95);
    panel.setStrokeStyle(2, 0x7ec850);

    this.add.text(cx, cy - 55, 'Enter Your Name', {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Name display box
    this.nameBox = this.add.rectangle(cx, cy, 300, 44, 0x1a1a2e);
    this.nameBox.setStrokeStyle(2, 0xffaa00);

    this.playerName = '';
    this.nameText = this.add.text(cx, cy, '_', {
      fontSize: '22px', fill: '#ffaa00', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Start button
    this.startBtn = this.add.rectangle(cx, cy + 65, 200, 40, 0x4a8f20);
    this.startBtn.setStrokeStyle(2, 0x7ec850);
    this.startBtnText = this.add.text(cx, cy + 65, 'START LOOTING', {
      fontSize: '16px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    this.startBtn.setInteractive({ useHandCursor: true });
    this.startBtn.on('pointerover', () => this.startBtn.setFillStyle(0x5db030));
    this.startBtn.on('pointerout', () => this.startBtn.setFillStyle(0x4a8f20));
    this.startBtn.on('pointerdown', () => this.startGame());

    // Leaderboard button
    const lbBtn = this.add.rectangle(cx, cy + 120, 160, 36, 0x2d2d44);
    lbBtn.setStrokeStyle(2, 0x4488ff);
    this.add.text(cx, cy + 120, 'LEADERBOARD', {
      fontSize: '14px', fill: '#4488ff', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    lbBtn.setInteractive({ useHandCursor: true });
    lbBtn.on('pointerdown', () => this.scene.start('Leaderboard'));

    // Keyboard input
    this.input.keyboard.on('keydown', (event) => {
      if (event.keyCode === 13) { this.startGame(); return; }
      if (event.keyCode === 8) {
        this.playerName = this.playerName.slice(0, -1);
      } else if (event.key.length === 1 && this.playerName.length < 12) {
        const c = event.key;
        if (/^[a-zA-Z0-9 _-]$/.test(c)) this.playerName += c;
      }
      this.updateNameDisplay();
    });

    // Blink cursor
    this.blinkTimer = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        this._showCursor = !this._showCursor;
        this.updateNameDisplay();
      }
    });

    // Instructions
    this.add.text(cx, GAME_H - 30, 'Arrow Keys / WASD to move  •  5 minute runs  •  Avoid hazards!', {
      fontSize: '11px', fill: '#555577', fontFamily: 'Courier New'
    }).setOrigin(0.5);
  }

  updateNameDisplay() {
    const cursor = this._showCursor ? '|' : ' ';
    this.nameText.setText(this.playerName + cursor);
  }

  startGame() {
    const name = this.playerName.trim() || 'Looter';
    this.scene.start('Game', { playerName: name });
  }
}
