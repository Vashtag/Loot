class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.playerName = data.playerName || 'Looter';
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.collectedItems = [];
    this.dangerLevel = 0;
  }

  create() {
    this.map = this.generateMap();
    this.renderMap();
    this.createPlayer();
    this.createChests();
    this.createHazards();
    this.createUI();
    this.setupInput();
    this.setupTimers();
  }

  // ── MAP GENERATION ──────────────────────────────────────────────────────────

  generateMap() {
    const map = Array.from({ length: ROWS }, () => Array(COLS).fill(TILE_TYPE.WALL));
    const rooms = [];
    for (let i = 0; i < 60; i++) {
      const rw = Phaser.Math.Between(4, 9);
      const rh = Phaser.Math.Between(3, 7);
      const rx = Phaser.Math.Between(1, COLS - rw - 1);
      const ry = Phaser.Math.Between(1, ROWS - rh - 1);
      if (!this.roomsOverlap(rooms, rx, ry, rw, rh)) {
        rooms.push({ x: rx, y: ry, w: rw, h: rh });
        this.carveRoom(map, rx, ry, rw, rh);
      }
    }
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1], b = rooms[i];
      this.carveCorridor(map,
        Math.floor(a.x + a.w / 2), Math.floor(a.y + a.h / 2),
        Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h / 2));
    }
    this.rooms = rooms;
    return map;
  }

  roomsOverlap(rooms, rx, ry, rw, rh) {
    for (const r of rooms) {
      if (rx < r.x + r.w + 1 && rx + rw + 1 > r.x &&
          ry < r.y + r.h + 1 && ry + rh + 1 > r.y) return true;
    }
    return false;
  }

  carveRoom(map, rx, ry, rw, rh) {
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++)
        map[y][x] = TILE_TYPE.FLOOR;
  }

  carveCorridor(map, x1, y1, x2, y2) {
    let x = x1, y = y1;
    while (x !== x2) { map[y][x] = TILE_TYPE.FLOOR; x += x < x2 ? 1 : -1; }
    while (y !== y2) { map[y][x] = TILE_TYPE.FLOOR; y += y < y2 ? 1 : -1; }
  }

  renderMap() {
    this.wallGroup = this.physics.add.staticGroup();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * TILE + TILE / 2;
        const y = row * TILE + TILE / 2;
        if (this.map[row][col] === TILE_TYPE.WALL) {
          const wall = this.wallGroup.create(x, y, 'wall');
          wall.setImmovable(true);
          wall.refreshBody();
        } else {
          this.add.image(x, y, 'floor').setDepth(0);
        }
      }
    }
  }

  // ── PLAYER ──────────────────────────────────────────────────────────────────

  createPlayer() {
    const startRoom = this.rooms[0];
    const sx = (startRoom.x + Math.floor(startRoom.w / 2)) * TILE + TILE / 2;
    const sy = (startRoom.y + Math.floor(startRoom.h / 2)) * TILE + TILE / 2;
    this.player = this.physics.add.sprite(sx, sy, 'player_sheet', 0);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(20, 20);
    this.physics.add.collider(this.player, this.wallGroup);
    this._facing = 'down';
    this.player.play('idle_down');
  }

  // ── CHESTS ──────────────────────────────────────────────────────────────────

  createChests() {
    // Plain static group — no overlap callback, we use proximity in update()
    this.chestGroup = this.physics.add.staticGroup();
    this.chestList = []; // [{sprite, item, opened}]

    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = Phaser.Math.Between(1, 3);
      for (let c = 0; c < count; c++) {
        const col = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
        const row = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);
        if (this.map[row][col] !== TILE_TYPE.FLOOR) continue;
        const px = col * TILE + TILE / 2;
        const py = row * TILE + TILE / 2;
        const sprite = this.chestGroup.create(px, py, 'chest');
        sprite.setDepth(5);
        sprite.refreshBody();
        this.chestList.push({ sprite, item: this.rollLoot(), opened: false });
      }
    }
    // Chests are solid — player walks up to them, can't walk through
    this.physics.add.collider(this.player, this.chestGroup);
  }

  rollLoot() {
    const roll = Math.random();
    let cumulative = 0;
    for (const [key, tier] of Object.entries(RARITY)) {
      cumulative += tier.chance;
      if (roll <= cumulative) {
        const pool = LOOT_ITEMS.filter(i => i.rarity === key);
        return pool[Phaser.Math.Between(0, pool.length - 1)];
      }
    }
    return LOOT_ITEMS[0];
  }

  tryOpenChest(entry) {
    if (entry.opened) return;
    entry.opened = true;
    entry.sprite.setTexture('chest_open');
    entry.sprite.refreshBody();

    const tier = RARITY[entry.item.rarity];
    this.score += tier.score;
    this.collectedItems.push(entry.item);

    this.showLootSparkle(entry.sprite.x, entry.sprite.y, tier.color);
    this.showFloatingText(entry.sprite.x, entry.sprite.y - 20,
      `+${tier.score} ${entry.item.name}`, tier.color);
    this.updateScoreUI();
  }

  // Tween-based sparkle — no Phaser particle API needed
  showLootSparkle(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const dist = 24 + Math.random() * 20;
      const dot = this.add.rectangle(x, y, 6, 6, color).setDepth(20);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 500 + Math.random() * 200,
        onComplete: () => dot.destroy(),
      });
    }
  }

  showFloatingText(x, y, msg, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const txt = this.add.text(x, y, msg, {
      fontSize: '13px', fill: hex, stroke: '#000000', strokeThickness: 3,
      fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  // ── HAZARDS ─────────────────────────────────────────────────────────────────

  createHazards() {
    this.hazardGroup = this.physics.add.staticGroup();
    this.spawnHazardBatch(3);
    this.physics.add.overlap(this.player, this.hazardGroup, this.hitHazard, null, this);
  }

  spawnHazardBatch(count) {
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts++ < 100) {
        const col = Phaser.Math.Between(1, COLS - 2);
        const row = Phaser.Math.Between(1, ROWS - 2);
        if (this.map[row][col] !== TILE_TYPE.FLOOR) continue;
        const px = this.player.x / TILE;
        const py = this.player.y / TILE;
        if (Math.abs(col - px) < 5 && Math.abs(row - py) < 5) continue;
        const h = this.hazardGroup.create(col * TILE + TILE / 2, row * TILE + TILE / 2, 'hazard');
        h.setDepth(3);
        h.refreshBody();
        break;
      }
    }
  }

  hitHazard(player, hazard) {
    if (this._hitCooldown) return;
    this._hitCooldown = true;
    const penalty = 50 * (1 + this.dangerLevel);
    this.score = Math.max(0, this.score - penalty);
    this.showFloatingText(player.x, player.y - 20, `-${penalty} OUCH!`, 0xff3333);
    this.updateScoreUI();
    this.cameras.main.flash(300, 255, 0, 0);
    const angle = Phaser.Math.Angle.Between(hazard.x, hazard.y, player.x, player.y);
    this.player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    this.time.delayedCall(800, () => { this._hitCooldown = false; });
  }

  // ── INPUT ────────────────────────────────────────────────────────────────────

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this._touch = { active: false, sx: 0, sy: 0, dx: 0, dy: 0 };
    this.input.on('pointerdown', (p) => {
      this._touch.active = true;
      this._touch.sx = p.x; this._touch.sy = p.y;
    });
    this.input.on('pointermove', (p) => {
      if (!this._touch.active) return;
      this._touch.dx = p.x - this._touch.sx;
      this._touch.dy = p.y - this._touch.sy;
    });
    this.input.on('pointerup', () => {
      this._touch.active = false;
      this._touch.dx = 0; this._touch.dy = 0;
    });
  }

  // ── TIMERS ───────────────────────────────────────────────────────────────────

  setupTimers() {
    this.gameTimer = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        this.timeLeft--;
        this.updateTimerUI();
        const newDanger = Math.floor((GAME_DURATION - this.timeLeft) / 60);
        if (newDanger > this.dangerLevel) {
          this.dangerLevel = newDanger;
          this.escalateDanger();
        }
        if (this.timeLeft <= 0) this.endGame();
      }
    });
  }

  escalateDanger() {
    this.spawnHazardBatch(2 + this.dangerLevel * 2);
    this.showFloatingText(GAME_W / 2, GAME_H / 2 - 60,
      `⚠ Danger Level ${this.dangerLevel}!`, 0xff6600);
    this.cameras.main.shake(400, 0.006);
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  createUI() {
    const pad = 8;
    const barH = 48;
    this.add.rectangle(GAME_W / 2, barH / 2, GAME_W, barH, 0x0d0d1e, 0.88).setDepth(50);
    this.add.rectangle(GAME_W / 2, barH, GAME_W, 2, 0x7ec850, 1).setDepth(50);
    this.add.text(pad + 4, pad, this.playerName.toUpperCase(), {
      fontSize: '14px', fill: '#7ec850', fontFamily: 'Courier New'
    }).setDepth(51);
    this.scoreLbl = this.add.text(GAME_W / 2, pad, 'SCORE: 0', {
      fontSize: '16px', fill: '#ffaa00', fontFamily: 'Courier New'
    }).setOrigin(0.5, 0).setDepth(51);
    this.timerLbl = this.add.text(GAME_W - pad - 4, pad, '5:00', {
      fontSize: '16px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(1, 0).setDepth(51);

    // Loot hint at bottom
    this.add.text(GAME_W / 2, GAME_H - 10, 'Walk up to chests to loot them!', {
      fontSize: '11px', fill: '#556644', fontFamily: 'Courier New'
    }).setOrigin(0.5, 1).setDepth(51);

    // Proximity hint (shows when near a chest)
    this.hintLbl = this.add.text(GAME_W / 2, GAME_H - 28, '', {
      fontSize: '13px', fill: '#ffaa00', stroke: '#000000', strokeThickness: 3,
      fontFamily: 'Courier New'
    }).setOrigin(0.5, 1).setDepth(52);
  }

  updateScoreUI() {
    this.scoreLbl.setText(`SCORE: ${this.score}`);
  }

  updateTimerUI() {
    const m = Math.floor(this.timeLeft / 60);
    const s = String(this.timeLeft % 60).padStart(2, '0');
    this.timerLbl.setText(`${m}:${s}`);
    if (this.timeLeft <= 60) this.timerLbl.setColor('#ff4444');
    else if (this.timeLeft <= 120) this.timerLbl.setColor('#ffaa00');
  }

  // ── UPDATE LOOP ──────────────────────────────────────────────────────────────

  update() {
    const speed = 160;
    let vx = 0, vy = 0;

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (up || down || left || right) {
      if (up)    vy = -speed;
      if (down)  vy =  speed;
      if (left)  vx = -speed;
      if (right) vx =  speed;
    } else if (this._touch.active) {
      const mag = Math.sqrt(this._touch.dx ** 2 + this._touch.dy ** 2);
      if (mag > 10) {
        vx = (this._touch.dx / mag) * speed;
        vy = (this._touch.dy / mag) * speed;
      }
    }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.player.setVelocity(vx, vy);

    // ── Animation state machine ───────────────────────────────────────────────
    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      if (vx < 0) {
        this._facing = 'left';
        this.player.setFlipX(true);
        if (this.player.anims.currentAnim?.key !== 'walk_right') this.player.play('walk_right');
      } else if (vx > 0) {
        this._facing = 'right';
        this.player.setFlipX(false);
        if (this.player.anims.currentAnim?.key !== 'walk_right') this.player.play('walk_right');
      } else if (vy < 0) {
        this._facing = 'up';
        this.player.setFlipX(false);
        if (this.player.anims.currentAnim?.key !== 'walk_up') this.player.play('walk_up');
      } else {
        this._facing = 'down';
        this.player.setFlipX(false);
        if (this.player.anims.currentAnim?.key !== 'walk_down') this.player.play('walk_down');
      }
    } else {
      const idleKey = `idle_${this._facing === 'left' ? 'right' : this._facing}`;
      if (this.player.anims.currentAnim?.key !== idleKey) {
        this.player.play(idleKey);
        this.player.setFlipX(this._facing === 'left');
      }
    }

    // ── Proximity-based chest looting ─────────────────────────────────────────
    const lootDist = TILE * 1.4;
    let nearChest = false;
    for (const entry of this.chestList) {
      if (entry.opened) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, entry.sprite.x, entry.sprite.y);
      if (dist < lootDist) {
        nearChest = true;
        this.tryOpenChest(entry);
      }
    }
    this.hintLbl.setText(nearChest ? '✦ Looting...' : '');
  }

  // ── END GAME ─────────────────────────────────────────────────────────────────

  endGame() {
    this.gameTimer.remove();
    this.player.setVelocity(0, 0);
    this.scene.start('GameOver', {
      playerName: this.playerName,
      score: this.score,
      items: this.collectedItems,
    });
  }
}
