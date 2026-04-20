// BootScene.js — Stardew Valley-style sprites (16×16 → scaled 2× to 32×32)
// Drop-in replacement for the existing BootScene.js
// Adds: walk animations for player (down / up / right / left)

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    this.makeFloorTile();
    this.makeWallTile();
    this.makeChestTile();
    this.makeChestOpenTile();
    this.makePlayerSheet();   // replaces makePlayerSprite()
    this.makeHazardTile();
    this.makeParticle();
    this.setupAnimations();   // NEW — register walk anims after sheet is built
    this.scene.start('NameEntry');
  }

  // ─── HELPER ──────────────────────────────────────────────────────────────────
  // Draw one 16→32 scaled "pixel" on graphics object g
  // x, y are in the 16×16 design grid (0-15); color is a CSS hex string
  _p(g, x, y, color, w = 1, h = 1) {
    g.fillStyle(parseInt(color.replace('#', ''), 16), 1);
    g.fillRect(x * 2, y * 2, w * 2, h * 2);
  }

  // ─── FLOOR ───────────────────────────────────────────────────────────────────
  makeFloorTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const p = this._p.bind(this, g);

    // Base grass
    g.fillStyle(0x7ec850, 1); g.fillRect(0, 0, 32, 32);

    // Right + bottom edge shadow
    g.fillStyle(0x5ea030, 1); g.fillRect(30, 0, 2, 32);
    g.fillStyle(0x5ea030, 1); g.fillRect(0, 30, 30, 2);

    // Dark texture dots (undergrowth)
    [[2,2],[11,3],[5,6],[14,8],[1,10],[8,12],[13,5],[6,14],[3,9]].forEach(([x,y]) => p(x,y,'#4a8a1a'));

    // Light highlight dots (dew)
    [[7,1],[0,6],[12,11],[4,15],[9,4]].forEach(([x,y]) => p(x,y,'#a0e060'));

    // Tiny grass blade details
    p(4, 3, '#3a7010', 1, 2);
    p(12, 9, '#3a7010', 1, 2);
    p(7, 13, '#3a7010', 1, 2);

    g.generateTexture('floor', 32, 32);
    g.destroy();
  }

  // ─── WALL ────────────────────────────────────────────────────────────────────
  makeWallTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Base stone
    g.fillStyle(0x8a7040, 1); g.fillRect(0, 0, 32, 32);

    const brick = (bx, by, bw, bh) => {
      g.fillStyle(0xb09060, 1); g.fillRect(bx*2, by*2, bw*2, bh*2);
      g.fillStyle(0xc8b090, 1); g.fillRect(bx*2, by*2, bw*2, 2);   // top highlight
      g.fillStyle(0xc8b090, 1); g.fillRect(bx*2, by*2, 2, bh*2);   // left highlight
      g.fillStyle(0x504020, 1); g.fillRect((bx+bw-1)*2, (by+bh-1)*2, 2, 2); // corner shadow
    };

    brick(1,1,6,3); brick(9,1,6,3);
    g.fillStyle(0x504020,1); g.fillRect(0, 8, 32, 2);               // mortar

    brick(0,5,4,3); brick(5,5,5,3); brick(11,5,5,3);
    g.fillStyle(0x504020,1);
    g.fillRect(8,10,2,6); g.fillRect(20,10,2,6);
    g.fillRect(0,16,32,2);                                           // mortar

    brick(1,9,6,3); brick(9,9,6,3);
    g.fillStyle(0x504020,1); g.fillRect(0,24,32,2);                  // mortar

    brick(0,13,4,3); brick(5,13,5,3); brick(11,13,4,3);
    g.fillStyle(0x504020,1);
    g.fillRect(8,26,2,6); g.fillRect(20,26,2,6);

    g.generateTexture('wall', 32, 32);
    g.destroy();
  }

  // ─── CHEST (closed) ──────────────────────────────────────────────────────────
  makeChestTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const p = this._p.bind(this, g);

    p(3,9,'#c87830',10,7);                        // wood body
    p(3,4,'#e09840',10,6);                        // lid
    p(3,4,'#f0b860',10,1); p(3,4,'#f0b860',1,6); // lid highlights
    p(3,10,'#d4a810',10,2);                       // gold band
    p(3,10,'#f0c830',10,1);                       // band shine
    p(7,8,'#ffe050',4,4);                         // lock gold
    p(8,10,'#c8b820',2,2);                        // keyhole shadow
    p(3,15,'#6a4010',10,1);                       // bottom shadow
    p(2,4,'#6a4010',1,12); p(13,4,'#6a4010',1,12); // side outlines

    g.generateTexture('chest', 32, 32);
    g.destroy();
  }

  // ─── CHEST (open) ────────────────────────────────────────────────────────────
  makeChestOpenTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const p = this._p.bind(this, g);

    p(3,10,'#c87830',10,6);                       // body
    p(3,3,'#e09840',10,5);                        // lid tilted back
    p(3,3,'#f0b860',10,1);                        // lid shine
    p(4,10,'#1a0800',8,5);                        // dark interior
    p(5,11,'#d4a810',2,1); p(9,13,'#d4a810',2,1); p(7,12,'#ffe050',1,1); // glints
    p(3,9,'#d4a810',10,2);                        // band
    p(3,15,'#6a4010',10,1);
    p(2,3,'#6a4010',1,13); p(13,3,'#6a4010',1,13);

    g.generateTexture('chest_open', 32, 32);
    g.destroy();
  }

  // ─── HAZARD (forest thorns) ──────────────────────────────────────────────────
  makeHazardTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const p = this._p.bind(this, g);

    p(0,11,'#2a4010',16,5);                       // ground base
    p(7,2,'#2a5010',2,14); p(2,7,'#2a5010',12,2); // vine stems
    p(4,5,'#3a6818',2,2); p(10,5,'#3a6818',2,2);  // branches
    p(4,9,'#3a6818',2,2); p(10,9,'#3a6818',2,2);

    // Thorns + red tips
    p(1,6,'#88aa20',3,2);  p(1,5,'#ff4422',1,1);
    p(0,9,'#88aa20',3,2);  p(0,8,'#ff4422',1,1);
    p(12,6,'#88aa20',3,2); p(14,5,'#ff4422',1,1);
    p(13,9,'#88aa20',3,2); p(15,8,'#ff4422',1,1);
    p(5,0,'#88aa20',2,3);  p(5,0,'#ff4422',1,1);
    p(9,0,'#88aa20',2,3);  p(10,0,'#ff4422',1,1);
    p(3,3,'#88aa20',2,2);  p(3,2,'#ff4422',1,1);
    p(11,3,'#88aa20',2,2); p(12,2,'#ff4422',1,1);

    // Leaves
    p(5,5,'#4a8a20',2,1); p(9,9,'#4a8a20',2,1);

    g.generateTexture('hazard', 32, 32);
    g.destroy();
  }

  // ─── PLAYER SPRITE SHEET ─────────────────────────────────────────────────────
  // Layout: 4 frames wide × 3 directions tall = 128×96 px
  //   Row 0 (frames  0-3): walk down
  //   Row 1 (frames  4-7): walk up
  //   Row 2 (frames 8-11): walk right  (flip sprite for left in GameScene)
  makePlayerSheet() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    ['down', 'up', 'right'].forEach((dir, row) => {
      for (let f = 0; f < 4; f++) {
        this._drawPlayerFrame(g, f * 16, row * 16, dir, f);
      }
    });

    g.generateTexture('player_sheet', 128, 96);

    // Register frame data so Phaser animations can reference them by index
    const tex = this.textures.get('player_sheet');
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        tex.add(row * 4 + col, 0, col * 32, row * 32, 32, 32);
      }
    }

    g.destroy();
  }

  _drawPlayerFrame(g, ox, oy, dir, frame) {
    // ox, oy are in 16-unit grid coords (will be ×2 for actual pixels)
    const p = (x, y, color, w = 1, h = 1) => {
      g.fillStyle(parseInt(color.replace('#', ''), 16), 1);
      g.fillRect((ox + x) * 2, (oy + y) * 2, w * 2, h * 2);
    };

    const HAIRD = '#6b3210'; const HAIR = '#924518'; const HAIRL = '#c07030';
    const SHIRTD= '#2a6ab5'; const SHIRT= '#5090d8'; const SHIRTL= '#82b8f0';
    const SKIN  = '#f5c89a'; const SKIND= '#dfa87a';
    const PANTS = '#604838'; const SHOE = '#281800';
    const BAG   = '#d89030'; const BAGD = '#a86020';
    const EYE   = '#201808'; const MOUTH= '#c06050';

    if (dir === 'down' || dir === 'up') {
      const isUp = dir === 'up';

      // Hair
      p(3,1,HAIR,8,1); p(2,2,HAIRD,1,3); p(11,2,HAIRD,1,3);
      p(3,2,HAIR,6,1); p(9,2,HAIRL,1,1);
      p(3,3,HAIRL,3,1); p(6,3,HAIR,4,1);

      if (isUp) {
        p(3,4,HAIR,8,2); p(2,3,HAIRD,1,3); p(11,3,HAIRD,1,3);
        p(3,5,SKIND,8,3); // nape of neck
      } else {
        // Face
        p(3,4,SKIN,8,5); p(2,5,SKIN,1,3); p(11,5,SKIN,1,3);
        // Eyes
        p(4,5,EYE,2,2); p(8,5,EYE,2,2);
        p(4,5,'#ffffff',1,1); p(8,5,'#ffffff',1,1); // shine
        // Nose + mouth
        p(7,7,SKIND,1,1);
        p(5,8,MOUTH,4,1);
      }

      // Shirt
      p(3,9,SHIRT,8,1); p(2,10,SHIRT,10,3);
      p(1,11,SHIRTD,1,2); p(12,11,SHIRTD,1,2); p(2,10,SHIRTL,1,1);

      // Bag (front-facing only)
      if (!isUp) {
        p(11,10,BAG,3,4); p(11,14,BAGD,3,1); p(14,10,BAGD,1,4);
      }

      // Legs — animated
      const legPose = (frame === 0 || frame === 2) ? 'neutral' : frame === 1 ? 'lstep' : 'rstep';
      if (legPose === 'neutral') {
        p(3,13,PANTS,3,2); p(8,13,PANTS,3,2);
        p(3,15,SHOE,3,1);  p(8,15,SHOE,3,1);
      } else if (legPose === 'lstep') {
        p(3,13,PANTS,3,2); p(3,15,SHOE,3,1);   // left leg forward
        p(8,13,PANTS,3,1); p(8,14,SHOE,3,1);   // right leg back
      } else {
        p(8,13,PANTS,3,2); p(8,15,SHOE,3,1);   // right leg forward
        p(3,13,PANTS,3,1); p(3,14,SHOE,3,1);   // left leg back
      }

    } else {
      // Side view (right-facing; flip X in GameScene for left)
      p(5,1,HAIR,7,1); p(4,2,HAIR,8,2);
      p(4,2,HAIRD,1,2); p(10,2,HAIRL,2,1);

      // Face
      p(4,4,SKIN,8,5); p(4,4,HAIRD,1,5); p(11,4,SKIND,1,5);
      p(6,5,EYE,2,2);  p(6,5,'#ffffff',1,1);
      p(7,8,MOUTH,3,1); p(4,6,SKIND,1,2); // ear

      // Shirt
      p(4,9,SHIRT,8,4); p(3,10,SHIRTD,1,3); p(12,10,SHIRTL,1,3);
      p(4,9,SHIRTL,1,1);

      // Bag on back
      p(2,10,BAG,3,4); p(2,14,BAGD,3,1);

      // Legs — animated
      const stepPose = (frame === 0 || frame === 2) ? 'neutral' : frame === 1 ? 'fwd' : 'bwd';
      if (stepPose === 'neutral') {
        p(4,13,PANTS,5,2); p(4,15,SHOE,5,1);
      } else if (stepPose === 'fwd') {
        p(5,13,PANTS,5,2); p(5,15,SHOE,6,1);
        p(4,13,PANTS,1,2); p(4,15,SHOE,2,1);
      } else {
        p(4,13,PANTS,5,2); p(4,15,SHOE,5,1);
        p(6,13,PANTS,4,1); p(6,14,SHOE,4,1);
      }
    }
  }

  // ─── PARTICLE ────────────────────────────────────────────────────────────────
  makeParticle() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle', 6, 6);
    g.destroy();
  }

  // ─── ANIMATIONS ──────────────────────────────────────────────────────────────
  setupAnimations() {
    const frames = (start, end) =>
      Array.from({ length: end - start + 1 }, (_, i) => ({ key: 'player_sheet', frame: start + i }));

    this.anims.create({ key: 'walk_down',  frames: frames(0, 3),  frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_up',    frames: frames(4, 7),  frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_right', frames: frames(8, 11), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'idle_down',  frames: frames(0, 0),  frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'idle_up',    frames: frames(4, 4),  frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'idle_right', frames: frames(8, 8),  frameRate: 1, repeat: -1 });
  }
}
