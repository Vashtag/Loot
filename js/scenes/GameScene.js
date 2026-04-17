class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.playerName = data.playerName || 'Looter';
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.collectedItems = [];
    this.hazardTimer = 0;
    this.dangerLevel = 0; // 0-4, increases every minute
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
    // Particle emitter for loot pop
    this.particles = this.add.particles(0, 0, 'particle', {
      speed: { min: 80, max: 180 },
      scale: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 8,
      emitting: false,
    });
    this.particles.setDepth(20);
  }

  // ── MAP GENERATION ──────────────────────────────────────────────────────────

  generateMap() {
    const map = Array.from({ length: ROWS }, () => Array(COLS).fill(TILE_TYPE.WALL));

    // Rooms using BSP-lite: carve random rectangles
    const rooms = [];
    const attempts = 60;
    for (let i = 0; i < attempts; i++) {
      const rw = Phaser.Math.Between(4, 9);
      const rh = Phaser.Math.Between(3, 7);
      const rx = Phaser.Math.Between(1, COLS - rw - 1);
      const ry = Phaser.Math.Between(1, ROWS - rh - 1);
      if (!this.roomsOverlap(rooms, rx, ry, rw, rh)) {
        rooms.push({ x: rx, y: ry, w: rw, h: rh });
        this.carveRoom(map, rx, ry, rw, rh);
      }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      const ax = Math.floor(a.x + a.w / 2);
      const ay = Math.floor(a.y + a.h / 2);
      const bx = Math.floor(b.x + b.w / 2);
      const by = Math.floor(b.y + b.h / 2);
      this.carveCorridor(map, ax, ay, bx, by);
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
    while (x !== x2) {
      map[y][x] = TILE_TYPE.FLOOR;
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      map[y][x] = TILE_TYPE.FLOOR;
      y += y < y2 ? 1 : -1;
    }
  }

  renderMap() {
    this.wallGroup = this.physics.add.staticGroup();
    this.floorTiles = [];

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

    this.player = this.physics.add.sprite(sx, sy, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(20, 20);
    this.physics.add.collider(this.player, this.wallGroup);
  }

  // ── CHESTS ──────────────────────────────────────────────────────────────────

  createChests() {
    this.chests = this.physics.add.staticGroup();
    this.chestData = new Map();

    // Place 1-3 chests per room (skip start room)
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const count = Phaser.Math.Between(1, 3);
      for (let c = 0; c < count; c++) {
        const cx = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
        const cy = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);
        if (this.map[cy][cx] !== TILE_TYPE.FLOOR) continue;
        const px = cx * TILE + TILE / 2;
        const py = cy * TILE + TILE / 2;
        const chest = this.chests.create(px, py, 'chest');
        chest.setDepth(5);
        chest.refreshBody();
        chest.setInteractive();
        const item = this.rollLoot();
        this.chestData.set(chest, { item, opened: false });
      }
    }

    this.physics.add.overlap(this.player, this.chests, this.tryOpenChest, null, this);
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

  tryOpenChest(player, chest) {
    const data = this.chestData.get(chest);
    if (!data || data.opened) return;
    data.opened = true;
    chest.setTexture('chest_open');
    chest.refreshBody();

    const item = data.item;
    const tier = RARITY[item.rarity];
    this.score += tier.score;
    this.collectedItems.push(item);

    // Particle burst in rarity color
    this.particles.setPosition(chest.x, chest.y);
    this.particles.setParticleTint(tier.color);
    this.particles.explode(12);

    // Floating text
    this.showFloatingText(chest.x, chest.y - 20, `+${tier.score} ${item.name}`, tier.color);
    this.updateScoreUI();
  }

  showFloatingText(x, y, msg, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const txt = this.add.text(x, y, msg, {
      fontSize: '13px', fill: hex, stroke: '#000000', strokeThickness: 3,
      fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy()
    });
  }

  // ── HAZARDS ─────────────────────────────────────────────────────────────────

  createHazards() {
    this.hazardGroup = this.physics.add.staticGroup();
    this.hazardSprites = [];
    // Initial sparse hazards (danger level 0)
    this.spawnHazardBatch(3);
    this.physics.add.overlap(this.player, this.hazardGroup, this.hitHazard, null, this);
  }

  spawnHazardBatch(count) {
    for (let i = 0; i < count; i++) {
      // Pick a random floor tile not in start room
      let attempts = 0;
      while (attempts++ < 100) {
        const col = Phaser.Math.Between(1, COLS - 2);
        const row = Phaser.Math.Between(1, ROWS - 2);
        if (this.map[row][col] !== TILE_TYPE.FLOOR) continue;
        // Not too close to player
        const px = this.player.x / TILE;
        const py = this.player.y / TILE;
        if (Math.abs(col - px) < 5 && Math.abs(row - py) < 5) continue;
        const hx = col * TILE + TILE / 2;
        const hy = row * TILE + TILE / 2;
        const h = this.hazardGroup.create(hx, hy, 'hazard');
        h.setDepth(3);
        h.refreshBody();
        this.hazardSprites.push(h);
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
    // Flash red
    this.cameras.main.flash(300, 255, 0, 0, false);
    // Knockback
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

    // Mobile virtual joystick (simple touch)
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
    // Main countdown
    this.gameTimer = this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        this.timeLeft--;
        this.updateTimerUI();

        // Escalate danger every 60s
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
    const extra = 2 + this.dangerLevel * 2;
    this.spawnHazardBatch(extra);
    this.showFloatingText(GAME_W / 2, GAME_H / 2 - 60,
      `⚠ Danger Level ${this.dangerLevel}!`, 0xff6600);
    // Shake camera slightly
    this.cameras.main.shake(400, 0.006);
  }

  // ── UI ───────────────────────────────────────────────────────────────────────

  createUI() {
    const pad = 8;
    const barH = 48;

    // Top bar background
    this.add.rectangle(GAME_W / 2, barH / 2, GAME_W, barH, 0x0d0d1e, 0.88).setDepth(50);
    this.add.rectangle(GAME_W / 2, barH, GAME_W, 2, 0x7ec850, 1).setDepth(50);

    // Player name
    this.add.text(pad + 4, pad, this.playerName.toUpperCase(), {
      fontSize: '14px', fill: '#7ec850', fontFamily: 'Courier New'
    }).setDepth(51);

    // Score label
    this.scoreLbl = this.add.text(GAME_W / 2, pad, 'SCORE: 0', {
      fontSize: '16px', fill: '#ffaa00', fontFamily: 'Courier New'
    }).setOrigin(0.5, 0).setDepth(51);

    // Timer
    this.timerLbl = this.add.text(GAME_W - pad - 4, pad, '5:00', {
      fontSize: '16px', fill: '#ffffff', fontFamily: 'Courier New'
    }).setOrigin(1, 0).setDepth(51);

    // Danger label
    this.dangerLbl = this.add.text(GAME_W / 2, barH + 6, '', {
      fontSize: '11px', fill: '#ff6600', fontFamily: 'Courier New'
    }).setOrigin(0.5, 0).setDepth(51);
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

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707; vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Flip sprite based on direction
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);
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
