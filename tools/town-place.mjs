import { dropFolk } from './town-fill.mjs';
import { TOWN_FOLK } from './town-folk.mjs';

export function placeTownFolk(maker, g, solid, town) {
  const folk = TOWN_FOLK.filter((person) => person.town === town && person.town !== 'tavern').map((person) => ({
    id: person.id,
    sprite: person.sprite,
    x: person.x,
    y: person.y,
    ambient: true,
  }));
  if (folk.length < 4) throw new Error(`${town} has ${folk.length} wanderers`);
  dropFolk(maker, g, solid, folk);
}
