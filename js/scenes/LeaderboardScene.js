class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  init(data) {
    this.fromGame = data && data.fromGame;
  }

  create() {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x0d0d1e);

    // Decorative chests
    this.add.image(80, cy, 'chest').setScale(3).setAlpha(0.15);
    this.add.image(GAME_W - 80, cy, 'chest').setScale(3).setAlpha(0.15);

    this.add.text(cx, 50, 'LEADERBOARD', {
      fontSize: '36px', fill: '#ffaa00', stroke: '#7a4f00', strokeThickness: 5,
      fontFamily: 'Courier New'
    }).setOrigin(0.5);

    this.add.text(cx, 90, 'Top 5 Looters', {
      fontSize: '14px', fill: '#7ec850', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    const board = JSON.parse(localStorage.getItem('loot_leaderboard') || '[]');

    const panelH = 280;
    this.add.rectangle(cx, cy + 20, 480, panelH, 0x2d2d44, 0.95).setStrokeStyle(2, 0x7ec850);

    // Header
    const hY = cy - panelH / 2 + 24;
    this.add.text(cx - 200, hY, 'RANK', { fontSize: '12px', fill: '#888899', fontFamily: 'Courier New' });
    this.add.text(cx - 130, hY, 'NAME', { fontSize: '12px', fill: '#888899', fontFamily: 'Courier New' });
    this.add.text(cx + 60, hY, 'SCORE', { fontSize: '12px', fill: '#888899', fontFamily: 'Courier New' });
    this.add.text(cx + 140, hY, 'DATE', { fontSize: '12px', fill: '#888899', fontFamily: 'Courier New' });
    this.add.rectangle(cx, hY + 16, 440, 1, 0x555566);

    const medals = ['👑', '🥈', '🥉', '4.', '5.'];
    const rowColors = ['#ffaa00', '#cccccc', '#cd7f32', '#aaaaaa', '#888899'];

    if (board.length === 0) {
      this.add.text(cx, cy + 20, 'No scores yet!\nBe the first to loot!', {
        fontSize: '18px', fill: '#555577', fontFamily: 'Courier New', align: 'center'
      }).setOrigin(0.5);
    } else {
      board.forEach((entry, i) => {
        const rowY = hY + 44 + i * 44;
        const col = rowColors[i];
        // Row highlight for top
        if (i === 0) {
          this.add.rectangle(cx, rowY, 440, 36, 0x3a2a00, 0.6);
        }
        this.add.text(cx - 200, rowY, medals[i], {
          fontSize: '16px', fill: col, fontFamily: 'Courier New'
        }).setOrigin(0, 0.5);
        this.add.text(cx - 130, rowY, entry.name.slice(0, 12).toUpperCase(), {
          fontSize: '16px', fill: col, fontFamily: 'Courier New'
        }).setOrigin(0, 0.5);
        this.add.text(cx + 60, rowY, String(entry.score), {
          fontSize: '16px', fill: col, fontFamily: 'Courier New'
        }).setOrigin(0, 0.5);
        this.add.text(cx + 140, rowY, entry.date || '', {
          fontSize: '12px', fill: '#666688', fontFamily: 'Courier New'
        }).setOrigin(0, 0.5);
      });
    }

    // Buttons
    const backLabel = this.fromGame ? 'PLAY AGAIN' : 'BACK';
    this.makeButton(cx, GAME_H - 55, backLabel, 0x4a8f20, 0x7ec850, () => {
      this.scene.start('NameEntry');
    });

    // Clear scores button (small, subtle)
    const clearBtn = this.add.text(GAME_W - 16, GAME_H - 16, 'clear scores', {
      fontSize: '10px', fill: '#333355', fontFamily: 'Courier New'
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => clearBtn.setColor('#ff4444'));
    clearBtn.on('pointerout', () => clearBtn.setColor('#333355'));
    clearBtn.on('pointerdown', () => {
      localStorage.removeItem('loot_leaderboard');
      this.scene.restart();
    });
  }

  makeButton(x, y, label, bg, border, cb) {
    const btn = this.add.rectangle(x, y, 220, 44, bg).setStrokeStyle(2, border);
    this.add.text(x, y, label, {
      fontSize: '16px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', cb);
  }
}
