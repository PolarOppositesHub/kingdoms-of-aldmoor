/// <reference types="vite/client" />

declare module '*town-folk.mjs' {
  export const TOWN_FOLK: {
    id: string;
    name: string;
    title: string;
    race: string;
    sprite: string;
    talk: string;
    barks: string[];
    town: string;
  }[];
}
