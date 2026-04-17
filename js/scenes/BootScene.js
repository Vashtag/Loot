class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // Generate all textures programmatically (no external assets needed)
    this.makeFloorTile();
    this.makeWallTile();
    this.makeChestTile();
    this.makeChestOpenTile();
    this.makePlayerSprite();
    this.makeHazardTile();
    this.makeParticle();
    this.scene.start('NameEntry');
  }

  makeFloorTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PAL.FLOOR_LIGHT);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(PAL.FLOOR_DARK);
    g.fillRect(0, TILE - 2, TILE, 2);
    g.fillRect(TILE - 2, 0, 2, TILE);
    // small pixel detail
    g.fillStyle(0x5a9e2f, 0.4);
    g.fillRect(4, 4, 2, 2);
    g.fillRect(18, 20, 2, 2);
    g.generateTexture('floor', TILE, TILE);
    g.destroy();
  }

  makeWallTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PAL.WALL);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(PAL.WALL_TOP);
    g.fillRect(2, 2, TILE - 4, 8);
    g.fillRect(2, 14, TILE - 4, 8);
    // mortar lines
    g.fillStyle(0x5a4010, 0.6);
    g.fillRect(0, 12, TILE, 2);
    g.fillRect(TILE / 2, 0, 2, 12);
    g.generateTexture('wall', TILE, TILE);
    g.destroy();
  }

  makeChestTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // chest body
    g.fillStyle(PAL.CHEST_WOOD);
    g.fillRect(4, 8, TILE - 8, TILE - 12);
    // lid
    g.fillStyle(0xd4a857);
    g.fillRect(4, 4, TILE - 8, 10);
    // metal band
    g.fillStyle(PAL.CHEST_BAND);
    g.fillRect(4, 14, TILE - 8, 3);
    // lock
    g.fillStyle(0xffe066);
    g.fillRect(TILE / 2 - 3, 12, 6, 6);
    // shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(4, TILE - 8, TILE - 8, 3);
    g.generateTexture('chest', TILE, TILE);
    g.destroy();
  }

  makeChestOpenTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PAL.CHEST_WOOD);
    g.fillRect(4, 10, TILE - 8, TILE - 14);
    // open lid (tilted back)
    g.fillStyle(0xd4a857);
    g.fillRect(4, 2, TILE - 8, 6);
    // dark interior
    g.fillStyle(0x1a0a00);
    g.fillRect(6, 10, TILE - 12, TILE - 18);
    g.fillStyle(PAL.CHEST_BAND);
    g.fillRect(4, 9, TILE - 8, 3);
    g.generateTexture('chest_open', TILE, TILE);
    g.destroy();
  }

  makePlayerSprite() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // body
    g.fillStyle(0x3a7bd5);
    g.fillRect(10, 14, 12, 14);
    // head
    g.fillStyle(0xf5c89a);
    g.fillRect(9, 6, 14, 12);
    // hair
    g.fillStyle(0x8b4513);
    g.fillRect(9, 4, 14, 5);
    // eyes
    g.fillStyle(0x222222);
    g.fillRect(12, 11, 3, 3);
    g.fillRect(18, 11, 3, 3);
    // bag
    g.fillStyle(0xc8a050);
    g.fillRect(20, 15, 6, 8);
    g.generateTexture('player', TILE, TILE);
    g.destroy();
  }

  makeHazardTile() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // spike base
    g.fillStyle(0x444444);
    g.fillRect(0, TILE - 8, TILE, 8);
    // spikes
    g.fillStyle(0xcccccc);
    for (let i = 0; i < 4; i++) {
      const x = 2 + i * 8;
      g.fillTriangle(x, TILE - 8, x + 6, TILE - 8, x + 3, 4);
    }
    // danger tint
    g.fillStyle(0xff3333, 0.15);
    g.fillRect(0, 0, TILE, TILE);
    g.generateTexture('hazard', TILE, TILE);
    g.destroy();
  }

  makeParticle() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle', 6, 6);
    g.destroy();
  }
}
