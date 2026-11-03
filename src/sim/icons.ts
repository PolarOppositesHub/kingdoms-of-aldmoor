/** Sheet key for an item picture. The id is the key; unknown ids have no picture. */
export function itemIconKey(itemId: string, frames: Readonly<Record<string, unknown>>): string | null {
  if (!itemId) return null;
  return Object.prototype.hasOwnProperty.call(frames, itemId) ? itemId : null;
}
