import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { cardSchema, trackSchema } from './content/schema.mjs';

export const collections = {
  cards: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/cards' }),
    schema: cardSchema,
  }),
  tracks: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './src/content/tracks' }),
    schema: trackSchema,
  }),
};
