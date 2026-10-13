---
title: Tries (Prefix Trees)
track: dsa
tags: [trees, strings, prefix, autocomplete]
difficulty: 2
minutes: 4
tldr: "A trie stores strings as paths of characters from one root, so common prefixes share nodes. Insert, search and prefix checks are O(L) for length L, however many words are stored."
analogy: "A paper dictionary's thumb tabs: to find 'cart' you open at C, then the CA pages, then CAR. Every word starting with 'ca' sits in one place, so 'what starts with ca?' is answered by reading one section."
diagram: tries
story:
  - title: Insert "car"
    text: "Start from an empty root. For each letter of 'car', step to the child for that letter, creating it if it is missing: c, then a, then r. Then mark the last node (green) as the end of a word. No node stores the word itself; the path from the root spells it."
  - title: Shared prefixes share nodes
    text: "'cart' walks the existing c-a-r path and adds just one node, t. 'cat' walks c-a and adds its own t. The three words, 10 letters in total, need only 5 nodes below the root, because the prefix c-a is stored once."
  - title: A new first letter, a new branch
    text: "'dog' shares nothing with the others, so it gets its own branch from the root. Each node keeps a small map from letter to child. Inserting is one map lookup per letter: O(L) for a word of length L, whether the trie holds 4 words or 4 million."
  - title: search and startsWith differ
    text: "search('ca') follows c then a: the path exists, but a is not green, so 'ca' was never inserted: False. startsWith('ca') only asks whether the path exists: True. search('cap') fails as soon as a has no child p."
  - title: Autocomplete
    text: "To list every word starting with 'ca', walk to the a node, then explore everything below it, collecting each green node's spelling: car, cart, cat. Words with the same prefix sit in one subtree, which is why tries suit autocomplete."
  - title: Compressed tries
    text: "Chains of nodes with one child each waste memory and pointer hops. A compressed (radix) trie merges each chain into one node labelled with a whole substring: c-a becomes 'ca', d-o-g becomes 'dog'. 9 nodes shrink to 6 and the operations work the same way."
keyIdeas:
  - "A **trie** stores each string as a **path** from the root, one character per step; words with a common prefix **share nodes**."
  - "Each node has a **map of children** (letter → node) and an **end-of-word flag**. The flag is what separates the word 'car' from a mere prefix of 'cart'."
  - "**insert, search, startsWith: O(L)**, where L is the length of the string, independent of how many words are stored."
  - "**Prefix queries** (autocomplete, 'any word starting with…', longest-prefix match) are what tries do and hash sets cannot."
  - "The cost is **memory**: one object per node. **Compressed (radix) tries** merge one-child chains to save space."
quiz:
  - q: "A trie holds car, cart, cat and dog. What does search('car') return, and what does startsWith('do') return?"
    options: ["True and True", "False and True", "True and False", "False and False"]
    answer: 0
    why: "'car' ends at a node marked as a word end, so search is True. startsWith only needs the path d-o to exist, and it does."
  - q: "Why does a trie need an end-of-word flag on nodes?"
    options: ["To make search O(1), since the flag skips the walk down", "A word may be a prefix of another; the path alone can't tell which", "To store how many children sit below each node, for counting", "To keep the children sorted, so iteration runs in order"]
    answer: 1
    why: "Inserting 'cart' creates the path c-a-r-t, which also passes through c-a-r. Without a flag, you could not tell whether 'car' was inserted or is merely on the way to 'cart'."
  - q: "You only need to test whether exact words are in a set of 1 million words. What is usually the better choice?"
    options: ["A trie, since its O(L) lookups beat a hash set's O(L log n)", "A hash set: hashing is O(L) too, and it usually needs far less memory", "A sorted array with linear search, to keep memory to a minimum", "A heap of the words, which keeps the smallest one on top"]
    answer: 1
    why: "Hashing a word also reads all L characters, so lookups are O(L) in both. A hash set stores each word once in a compact table; a trie allocates an object per node. Choose a trie when you need prefix queries."
  - q: "What is the time to list all words starting with prefix p (length m) in a trie?"
    options: ["O(m), just the walk down to p", "O(m + size of the subtree below p)", "O(number of words in the whole trie)", "O(m log n), from searching each level"]
    answer: 1
    why: "Walking to the prefix node costs O(m). Then every node below it has to be visited to collect the words, so the work also grows with that subtree's size, which includes the length of the output."
bigO:
  - { op: "insert / search / startsWith", avg: "O(L)", note: "L = length of the string" }
  - { op: "autocomplete", avg: "O(m + k)", note: "m = prefix length, k = nodes in the subtree below it" }
  - { op: "space", avg: "O(total characters)", note: "at most one node per stored character; shared prefixes need fewer" }
related: [dsa/hash-tables, dsa/trees-and-traversals, dsa/backtracking, sysdesign/search-indexing]
prereqs: [dsa/trees-and-traversals, dsa/hash-tables]
flashcards:
  - kind: qa
    q: "What is the difference between search(word) and startsWith(prefix) in a trie?"
    a: "Both walk the path letter by letter. search also requires the final node to be marked as a word end; startsWith only requires the path to exist."
  - kind: cloze
    text: "Trie operations cost {{O(L)}} for a string of length L, independent of the {{number of words}} stored."
  - kind: qa
    q: "When would you choose a trie over a hash set of strings?"
    a: "When you need prefix operations: autocomplete, 'does any word start with…', longest-prefix match, or listing words in sorted order. For exact lookups only, a hash set is simpler and smaller."
sources:
  - { name: "Open Data Structures", url: "https://opendatastructures.org/", licence: "CC BY 2.5", note: "Binary tries chapter, adapted to character tries" }
  - { name: "Napkin (own explanation)", url: "https://github.com/RahulTarigoppula/self-learn-napkin", licence: "Own work" }
---

## The idea

Suppose you store a dictionary of words and want to answer "which words start with `ca`?" as someone types. A hash set can answer "is `cart` a word?" quickly, but it has no idea which words *begin* with `ca`; you would have to check every word. A sorted list could binary-search to the first `ca…` word, but inserting into it is O(n).

A **trie** (from re*trie*val, usually pronounced "try"), also called a **prefix tree**, organises strings by their characters. The root represents the empty string. Each node has up to one child per possible next character, and the path from the root to any node spells a prefix. All words that start with `ca` live in the subtree below the node reached by `c` then `a`.

## How it works

Each node holds two things:

- **children**: a map from a character to the child node (a dict, or an array of 26 slots for lowercase English).
- **is_end**: a flag that says "a word ends exactly here".

**Insert(word)**: start at the root. For each character, move to the child for that character, creating it if it does not exist. After the last character, set `is_end = True` on the node you are on.

**Search(word)**: start at the root and follow the characters. If a child is missing, the word is absent. If you consume every character, the answer is the final node's `is_end` flag.

**StartsWith(prefix)**: the same walk, but the answer is simply whether the walk succeeded. The flag is ignored.

**Autocomplete(prefix)**: walk to the prefix's node, then do a depth-first traversal of its subtree and output the spelling of every node whose flag is set. Visiting children in alphabetical order outputs the words in sorted order.

**Delete(word)**: walk to the word's node and clear its flag. Optionally, walk back up removing nodes that now have no children and no flag, so the trie does not keep dead branches.

Every operation does a constant amount of work per character, so insert, search and startsWith are **O(L)** for a string of length L. The number of stored words never enters the cost.

## Worked example

Insert `car`, `cart`, `cat`, `dog` into an empty trie:

| Insert | Walks existing nodes | Creates | Marks as end |
|---|---|---|---|
| car | none | c, a, r | r |
| cart | c, a, r | t (under r) | that t |
| cat | c, a | t (under a) | that t |
| dog | none | d, o, g | g |

13 letters are stored in 8 nodes plus the root, because `ca` and `car` are shared. Now the queries:

- `search("cat")`: c → a → t, and t is marked: **True**.
- `search("ca")`: c → a exists, but a is not marked: **False**.
- `startsWith("ca")`: the path exists: **True**.
- `search("cap")`: c → a, then a has no child `p`: **False** after two steps.
- `complete("ca")`: walk to a, then depth-first: r is marked (`car`), its child t is marked (`cart`), then a's other child t is marked (`cat`). Output: **car, cart, cat**.

## Implement it in Python

Search and startsWith share one private `_walk` helper; they only differ in whether they check the flag at the end.

```python
class TrieNode:
    __slots__ = ("children", "is_end")
    def __init__(self):
        self.children = {}            # letter -> TrieNode
        self.is_end = False           # does a word end exactly here?

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):           # O(L)
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())  # reuse or create
        node.is_end = True

    def _walk(self, s):               # node at the end of path s, or None
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None: return None
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_end

    def starts_with(self, prefix): return self._walk(prefix) is not None

    def complete(self, prefix):       # every stored word that starts with prefix
        out, start = [], self._walk(prefix)
        def dfs(node, path):
            if node.is_end: out.append(path)
            for ch in sorted(node.children):  # sorted -> alphabetical output
                dfs(node.children[ch], path + ch)
        if start: dfs(start, prefix)
        return out

t = Trie()
for w in ["car", "cart", "cat", "dog"]: t.insert(w)
print(t.search("ca"), t.starts_with("ca"), t.search("cat"), t.search("cap"))
# False True True False
print(t.complete("ca"), t.complete("x"))   # ['car', 'cart', 'cat'] []
```

## Memory: the real trade-off

A trie is fast but hungry. Each node is a separate object with its own children map. In Python, an empty dict alone takes about 64 bytes and grows from there, so a trie of English words can use several times the memory of a `set` of the same words. Lower-level implementations face a choice:

- **Array of 26 (or 256) child pointers per node**: O(1) child lookup, but most slots are empty, so the memory is mostly wasted.
- **Hash map or sorted list of children**: compact, slightly slower per step.

A **compressed trie** (also called a **radix tree** or Patricia trie) removes the biggest waste: long chains of nodes that each have one child. It merges each chain into a single node labelled with a substring, so `d → o → g` becomes one node `dog`. A trie of N words then has at most about 2N nodes, however long the words are. Radix trees are used for IP routing tables (longest-prefix match on address bits) and inside many in-memory databases and HTTP routers.

## Trie or hash set?

| Need | Better choice |
|---|---|
| Exact membership only | Hash set: simpler, much smaller, O(L) to hash |
| All words with a given prefix | Trie |
| Longest stored prefix of a string (routing, tokenising) | Trie |
| Words in sorted order | Trie (or a sorted structure) |
| Searching many words in a letter grid at once | Trie: prune a path the moment no word has that prefix |

Note that a hash lookup is also O(L), not O(1), when the key is a string of length L: computing the hash reads every character.

## Edge cases and pitfalls

- **Forgetting the end flag**: without it, `search("car")` returns True after only `cart` was inserted.
- **The empty string**: inserting `""` marks the root itself.
- **Case and alphabet**: decide early whether `Car` and `car` are the same; a fixed 26-slot array breaks on uppercase, digits or Unicode.
- **Recursion depth** in autocomplete is the length of the longest word, which is normally harmless.

## In the interview

"Implement a trie" (insert, search, startsWith) is a classic warm-up. Follow-ups: autocomplete with the top 3 suggestions (store counts, or cache the best suggestions in each node), "Word Search II" (put the dictionary in a trie and run a depth-first search on the grid, abandoning any path that is not a prefix), wildcard search where `.` matches any letter (branch into every child), and replace-words-with-their-shortest-root. Mention the memory cost and the compressed-trie fix without being asked.
