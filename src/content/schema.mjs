// The card schema, shared by Astro's content collection and scripts/lint-licences.mjs.
import { z } from 'zod';

/** No NonCommercial, no NoDerivatives, no ShareAlike. Ever. */
export const ALLOWED_LICENCES = /** @type {const} */ ([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'CC0',
  'CC BY 4.0',
  'CC BY 2.5',
  'Public domain',
  'Own work',
]);

/** Content from these hosts is never adapted, traced or cited. */
export const BANNED_HOSTS = [
  'bytebytego.com',
  'github.com/ByteByteGoHq',
  'roadmap.sh',
  'github.com/kamranahmedse/developer-roadmap',
  'visualgo.net',
  'ocw.mit.edu',
  'cs50.harvard.edu',
];

export const TRACKS = /** @type {const} */ (['dsa', 'sysdesign', 'ds']);

const Source = z.object({
  name: z.string(),
  url: z.url(),
  licence: z.enum(ALLOWED_LICENCES),
  note: z.string().optional(),
});

const Flashcard = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('qa'), q: z.string().min(8), a: z.string().min(1) }),
  z.object({ kind: z.literal('cloze'), text: z.string().regex(/\{\{[^}]+\}\}/) }),
]);

const BigORow = z.object({
  op: z.string(),
  best: z.string().optional(),
  avg: z.string(),
  worst: z.string().optional(),
  note: z.string().optional(),
});

const QuizItem = z
  .object({
    q: z.string().min(8),
    options: z.array(z.string().min(1)).min(3).max(4),
    answer: z.number().int().min(0).max(3),
    why: z.string().min(10).max(400),
  })
  .refine((x) => x.answer < x.options.length, { message: 'answer index out of range' });

const Scene = z.object({
  title: z.string().max(60).optional(),
  text: z.string().min(20).max(420),
});

export const cardSchema = z
  .object({
    title: z.string().max(40),
    track: z.enum(TRACKS),
    tags: z.array(z.string()).min(1).max(6),
    difficulty: z.number().int().min(1).max(3),
    minutes: z.number().int().min(1).max(6),
    tldr: z.string().max(200),
    analogy: z.string().max(260).optional(),
    diagram: z.string(),
    story: z.array(Scene).min(2).max(8),
    keyIdeas: z.array(z.string().min(10).max(280)).min(3).max(6),
    quiz: z.array(QuizItem).min(2).max(5),
    bigO: z.array(BigORow).optional(),
    bigOTitle: z.string().optional(),
    related: z.array(z.string()).max(4).default([]),
    prereqs: z.array(z.string()).default([]),
    flashcards: z.array(Flashcard).min(2),
    sources: z.array(Source).default([]),
    original: z.boolean().default(false),
    special: z.boolean().default(false),
    griddle: z.string().optional(),
  })
  .refine((c) => c.original || c.sources.length > 0, { message: 'sources required unless original: true' });

export const trackSchema = z.object({
  name: z.string(),
  subtitle: z.string(),
  blurb: z.string(),
  order: z.array(z.string()),
});
