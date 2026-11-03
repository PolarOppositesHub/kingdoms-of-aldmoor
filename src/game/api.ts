import type { AudioBus } from './audio';
import type { ContentDb, GameState, Intent, MapData, SimEvent } from '../sim/types';

export interface GameApi {
  getState: () => GameState;
  content: ContentDb;
  map: MapData;
  zones: Record<string, MapData>;
  push: (intent: Intent) => void;
  setRunning: (running: boolean) => void;
  audio: AudioBus;
}
