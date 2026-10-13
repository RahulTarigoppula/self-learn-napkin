import { sha1 } from './sha1';

/** The separator is part of the contract. Changing it orphans every learner's review history.
 *  The question text is used RAW: no lower-casing, no trimming. For a cloze card the "question"
 *  is the raw cloze text including the {{…}} braces. */
export const deckId = (slug: string, question: string): string => sha1(`${slug}|${question}`);

/** A learner-made cloze from the highlighter. */
export const highlightId = (slug: string, sentence: string): string => `hl-${sha1(`${slug}|${sentence}`)}`;

/** sha1 of the sorted id list. When it changes, the client re-seeds its card table. */
export const contentHash = (ids: readonly string[]): string => sha1([...ids].sort().join('\n'));
