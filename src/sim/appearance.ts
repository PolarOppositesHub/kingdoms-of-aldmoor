import type { ContentDb, GameState, ItemDef } from './types';

export type GearLayer = 'chest' | 'legs' | 'feet' | 'hands' | 'head' | 'weapon';

export interface GearVisual {
  layer: GearLayer;
  row: string;
}

const LAYER_ORDER: GearLayer[] = ['chest', 'legs', 'feet', 'hands', 'head', 'weapon'];

export function raceScale(content: ContentDb, raceId: string): number {
  return content.roster.races.find((race) => race.id === raceId)?.scale ?? 1;
}

function materialRow(prefix: string, item: ItemDef): string {
  const material = item.armorType === 'scale' ? 'chain' : item.armorType;
  if (material === 'plate' || material === 'chain' || material === 'leather' || material === 'cloth') {
    return `${prefix}_${material}`;
  }
  return `${prefix}_leather`;
}

export function gearVisual(item: ItemDef | undefined, sex: 'male' | 'female'): GearVisual | null {
  if (!item) return null;
  if (item.look) {
    const layer: GearLayer = item.look.startsWith('weapon')
      ? 'weapon'
      : item.look.startsWith('helm') || item.look.startsWith('wolf_helm')
        ? 'head'
        : item.look.startsWith('hands')
          ? 'hands'
          : item.look.startsWith('legs')
            ? 'legs'
            : item.look.startsWith('feet')
              ? 'feet'
              : 'chest';
    return { layer, row: item.look };
  }
  if (item.slot === 'primary') {
    if (item.grip === 'fist' || item.id === 'hand_wraps') return { layer: 'hands', row: 'hands_wrap' };
    if (item.grip === 'blade') return { layer: 'weapon', row: 'weapon_blade' };
    if (item.grip === 'staff') return { layer: 'weapon', row: 'weapon_staff' };
    return { layer: 'weapon', row: 'weapon_axe' };
  }
  if (item.slot === 'head') {
    if (item.id === 'wolf_helm') return { layer: 'head', row: sex === 'female' ? 'wolf_helm_f' : 'wolf_helm_m' };
    if (item.armorType === 'plate') return { layer: 'head', row: 'helm_plate' };
    if (item.armorType === 'chain') return { layer: 'head', row: 'helm_coif' };
    return { layer: 'head', row: 'helm_cap' };
  }
  if (item.slot === 'chest') return { layer: 'chest', row: materialRow('chest', item) };
  if (item.slot === 'legs') return { layer: 'legs', row: materialRow('legs', item) };
  if (item.slot === 'feet') return { layer: 'feet', row: item.armorType === 'cloth' ? 'feet_shoe' : 'feet_boot' };
  if (item.slot === 'hands') return { layer: 'hands', row: 'hands_glove' };
  return null;
}

/** Worn pieces, back to front. Hand-wraps replace gloves and hide the weapon. */
export function playerVisuals(state: GameState, content: ContentDb): GearVisual[] {
  const found = new Map<GearLayer, string>();
  const slots = ['chest', 'legs', 'feet', 'hands', 'head', 'primary'] as const;
  for (const slot of slots) {
    const id = state.equipment[slot];
    const visual = gearVisual(id ? content.items[id] : undefined, state.sex);
    if (!visual) continue;
    found.set(visual.layer, visual.row);
  }
  if (found.get('hands') === 'hands_wrap') found.delete('weapon');
  return LAYER_ORDER.filter((layer) => found.has(layer)).map((layer) => ({ layer, row: found.get(layer)! }));
}
