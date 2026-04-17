function getGameSize() {
  const isMobile = window.innerWidth < 600 || ('ontouchstart' in window && window.innerWidth < window.innerHeight);
  if (isMobile) {
    // Vertical: fit width, scale height proportionally
    const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
    return { width: GAME_W, height: GAME_H, scale };
  }
  // Horizontal: fit to window
  const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
  return { width: GAME_W, height: GAME_H, scale };
}

const size = getGameSize();

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: PAL.BG,
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, NameEntryScene, GameScene, GameOverScene, LeaderboardScene],
};

const game = new Phaser.Game(config);
