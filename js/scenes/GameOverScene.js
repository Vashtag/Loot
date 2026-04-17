class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) {
    this.playerName = data.playerName || 'Looter';
    this.score = data.score || 0;
    this.items = data.items || [];
    this.rank = this.saveScore();
  }

  saveScore() {
    const key = 'loot_leaderboard';
    let board = JSON.parse(localStorage.getItem(key) || '[]');
    board.push({ name: this.playerName, score: this.score, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    localStorage.setItem(key, JSON.stringify(board));
    return board.findIndex(e => e.name === this.playerName && e.score === this.score) + 1;
  }

  create() {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x0d0d1e);

    // Title
    const titleTxt = this.score > 0 ? 'LOOT SECURED!' : 'TIME\'S UP!';
    this.add.text(cx, 50, titleTxt, {
      fontSize: '38px', fill: '#ffaa00', stroke: '#7a4f00', strokeThickness: 5,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Rank badge
    if (this.rank <= 5) {
      const rankColor = this.rank === 1 ? '#ffaa00' : this.rank <= 3 ? '#4488ff' : '#7ec850';
      this.add.text(cx, 100, `#${this.rank} on the Leaderboard!`, {
        fontSize: '16px', fill: rankColor, fontFamily: 'Courier New'
      }).setOrigin(0.5);
    }

    // Score panel
    const panelY = cy - 30;
    this.add.rectangle(cx, panelY, 440, 200, 0x2d2d44, 0.95).setStrokeStyle(2, 0x7ec850);
    this.add.text(cx, panelY - 80, `${this.playerName}'s Haul`, {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.add.text(cx, panelY - 50, `Final Score: ${this.score}`, {
      fontSize: '24px', fill: '#ffaa00', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Item summary
    const counts = {};
    for (const item of this.items) {
      counts[item.rarity] = (counts[item.rarity] || 0) + 1;
    }
    let yOff = panelY - 15;
    const rarityOrder = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];
    for (const r of rarityOrder) {
      if (!counts[r]) continue;
      const tier = RARITY[r];
      const col = '#' + tier.color.toString(16).padStart(6, '0');
      this.add.text(cx - 100, yOff, `${tier.name}`, {
        fontSize: '13px', fill: col, fontFamily: 'Courier New'
      }).setOrigin(0, 0.5);
      this.add.text(cx + 80, yOff, `x${counts[r]}`, {
        fontSize: '13px', fill: '#ffffff', fontFamily: 'Courier New'
      }).setOrigin(0, 0.5);
      yOff += 22;
    }
    if (this.items.length === 0) {
      this.add.text(cx, panelY + 10, 'No loot collected... try again!', {
        fontSize: '14px', fill: '#666688', fontFamily: 'Courier New'
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = cy + 120;
    this.makeButton(cx - 110, btnY, 'PLAY AGAIN', 0x4a8f20, 0x7ec850, () => {
      this.scene.start('NameEntry');
    });
    this.makeButton(cx + 110, btnY, 'LEADERBOARD', 0x1a3a6e, 0x4488ff, () => {
      this.scene.start('Leaderboard', { fromGame: true });
    });
  }

  makeButton(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 190, 44, bg).setStrokeStyle(2, border);
    this.add.text(x, y, label, {
      fontSize: '14px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', cb);
  }
}
