// GameScene — animation patch
// These are the ONLY two methods that need to change in your existing GameScene.js
// Copy-paste these over the existing createPlayer() and update() methods.

// ─── createPlayer() ───────────────────────────────────────────────────────────
// Change: use 'player_sheet' spritesheet and start with idle_down animation

createPlayer() {
  const startRoom = this.rooms[0];
  const sx = (startRoom.x + Math.floor(startRoom.w / 2)) * TILE + TILE / 2;
  const sy = (startRoom.y + Math.floor(startRoom.h / 2)) * TILE + TILE / 2;

  this.player = this.physics.add.sprite(sx, sy, 'player_sheet', 0); // <-- was 'player'
  this.player.setCollideWorldBounds(true);
  this.player.setDepth(10);
  this.player.setSize(20, 20);
  this.physics.add.collider(this.player, this.wallGroup);

  // Track facing direction for idle state
  this._facing = 'down';

  this.player.play('idle_down'); // <-- NEW
}

// ─── update() ─────────────────────────────────────────────────────────────────
// Change: drive walk/idle animations based on velocity + direction

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

  // ── Animation state machine ─────────────────────────────────────────────────
  const moving = vx !== 0 || vy !== 0;

  if (moving) {
    // Prioritise horizontal over vertical for side-view frames
    if (vx < 0) {
      this._facing = 'left';
      this.player.setFlipX(true);
      if (this.player.anims.currentAnim?.key !== 'walk_right') {
        this.player.play('walk_right');
      }
    } else if (vx > 0) {
      this._facing = 'right';
      this.player.setFlipX(false);
      if (this.player.anims.currentAnim?.key !== 'walk_right') {
        this.player.play('walk_right');
      }
    } else if (vy < 0) {
      this._facing = 'up';
      this.player.setFlipX(false);
      if (this.player.anims.currentAnim?.key !== 'walk_up') {
        this.player.play('walk_up');
      }
    } else {
      this._facing = 'down';
      this.player.setFlipX(false);
      if (this.player.anims.currentAnim?.key !== 'walk_down') {
        this.player.play('walk_down');
      }
    }
  } else {
    // Idle — hold last facing direction
    const idleKey = `idle_${this._facing === 'left' ? 'right' : this._facing}`;
    if (this.player.anims.currentAnim?.key !== idleKey) {
      this.player.play(idleKey);
      // Keep flip state from last movement direction
      this.player.setFlipX(this._facing === 'left');
    }
  }
}
