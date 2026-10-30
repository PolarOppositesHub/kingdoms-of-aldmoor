import Phaser from 'phaser';
import { WorldScene } from './WorldScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#d5e2ec',
    pixelArt: true,
    antialias: false,
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: Math.max(2, parent.clientWidth),
      height: Math.max(2, parent.clientHeight),
    },
    fps: { target: 60 },
    input: { activePointers: 2 },
    audio: { noAudio: true },
    scene: [WorldScene],
  });
}
