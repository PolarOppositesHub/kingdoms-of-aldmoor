import type { GameState, SimEvent } from './types';

export type Emit = (event: SimEvent) => void;

export function collect(state: GameState, run: (emit: Emit) => void): SimEvent[] {
  const events: SimEvent[] = [];
  const emit: Emit = (event) => {
    events.push(event);
    if (event.type === 'log') {
      state.log.push(event.text);
      if (state.log.length > 40) state.log.shift();
    }
  };
  run(emit);
  state.events = events;
  return events;
}
