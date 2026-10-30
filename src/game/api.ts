import type { AudioBus } from './audio';
import type { ContentDb, GameState, Intent, MapData, SimEvent } from '../sim/types';

export interface GameApi {
  getState: () => GameState;
  content: ContentDb;
  map: MapData;
  push: (intent: Intent) => void;
  setRunning: (running: boolean) => void;
  audio: AudioBus;
}
