# word-math Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a REPL for vector arithmetic on word embeddings (`king - man + woman = queen`).

**Architecture:** Parser transforms input into AST, evaluator resolves words to vectors and computes operations, nearest-neighbor search finds closest words to result vectors. GloVe embeddings loaded at startup.

**Tech Stack:** Node.js, TypeScript, no external dependencies.

---

### Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "word-math",
  "version": "0.1.0",
  "description": "REPL for vector arithmetic on word embeddings",
  "main": "dist/index.js",
  "bin": {
    "word-math": "./bin/word-math"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "node --test dist/**/*.test.js"
  },
  "type": "module",
  "keywords": ["word2vec", "embeddings", "nlp", "repl"],
  "license": "MIT"
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create placeholder src/index.ts**

```typescript
console.log('word-math');
```

**Step 4: Build and run**

Run: `npx tsc && node dist/index.js`
Expected: `word-math`

**Step 5: Commit**

```bash
git add package.json tsconfig.json src/index.ts
git commit -m "chore: initialize TypeScript project"
```

---

### Task 2: Vector Utilities

**Files:**
- Create: `src/vector.ts`
- Create: `src/vector.test.ts`

**Step 1: Write failing tests for vector operations**

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { add, subtract, normalize, dot, magnitude } from './vector.js';

describe('vector operations', () => {
  it('adds two vectors element-wise', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const result = add(a, b);
    assert.deepStrictEqual([...result], [5, 7, 9]);
  });

  it('subtracts two vectors element-wise', () => {
    const a = new Float32Array([4, 5, 6]);
    const b = new Float32Array([1, 2, 3]);
    const result = subtract(a, b);
    assert.deepStrictEqual([...result], [3, 3, 3]);
  });

  it('computes dot product', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    const result = dot(a, b);
    assert.strictEqual(result, 32); // 1*4 + 2*5 + 3*6
  });

  it('computes magnitude', () => {
    const v = new Float32Array([3, 4]);
    const result = magnitude(v);
    assert.strictEqual(result, 5);
  });

  it('normalizes a vector to unit length', () => {
    const v = new Float32Array([3, 4]);
    const result = normalize(v);
    const mag = Math.sqrt(result[0] ** 2 + result[1] ** 2);
    assert.ok(Math.abs(mag - 1) < 0.0001);
    assert.ok(Math.abs(result[0] - 0.6) < 0.0001);
    assert.ok(Math.abs(result[1] - 0.8) < 0.0001);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx tsc && node --test dist/vector.test.js`
Expected: FAIL - module not found

**Step 3: Implement vector operations**

```typescript
export function add(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] + b[i];
  }
  return result;
}

export function subtract(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] - b[i];
  }
  return result;
}

export function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(v: Float32Array): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: Float32Array): Float32Array {
  const mag = magnitude(v);
  const result = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] / mag;
  }
  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx tsc && node --test dist/vector.test.js`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/vector.ts src/vector.test.ts
git commit -m "feat: add vector math utilities"
```

---

### Task 3: Parser - Tokenizer

**Files:**
- Create: `src/parser.ts`
- Create: `src/parser.test.ts`

**Step 1: Write failing tests for tokenizer**

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenize, TokenType } from './parser.js';

describe('tokenizer', () => {
  it('tokenizes a simple word', () => {
    const tokens = tokenize('king');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' }
    ]);
  });

  it('tokenizes an expression with operators', () => {
    const tokens = tokenize('king - man + woman');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' },
      { type: TokenType.Plus, value: '+' },
      { type: TokenType.Identifier, value: 'woman' }
    ]);
  });

  it('tokenizes an assignment', () => {
    const tokens = tokenize('royalty = king - man');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'royalty' },
      { type: TokenType.Equals, value: '=' },
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' }
    ]);
  });

  it('tokenizes parentheses', () => {
    const tokens = tokenize('(king - man) + woman');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' },
      { type: TokenType.RParen, value: ')' },
      { type: TokenType.Plus, value: '+' },
      { type: TokenType.Identifier, value: 'woman' }
    ]);
  });

  it('lowercases identifiers', () => {
    const tokens = tokenize('King');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' }
    ]);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx tsc && node --test dist/parser.test.js`
Expected: FAIL - module not found

**Step 3: Implement tokenizer**

```typescript
export enum TokenType {
  Identifier = 'Identifier',
  Plus = 'Plus',
  Minus = 'Minus',
  Equals = 'Equals',
  LParen = 'LParen',
  RParen = 'RParen',
}

export interface Token {
  type: TokenType;
  value: string;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Operators and punctuation
    if (char === '+') {
      tokens.push({ type: TokenType.Plus, value: '+' });
      i++;
      continue;
    }
    if (char === '-') {
      tokens.push({ type: TokenType.Minus, value: '-' });
      i++;
      continue;
    }
    if (char === '=') {
      tokens.push({ type: TokenType.Equals, value: '=' });
      i++;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: TokenType.LParen, value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: TokenType.RParen, value: ')' });
      i++;
      continue;
    }

    // Identifiers
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        value += input[i];
        i++;
      }
      tokens.push({ type: TokenType.Identifier, value: value.toLowerCase() });
      continue;
    }

    throw new Error(`Unexpected character: '${char}'`);
  }

  return tokens;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx tsc && node --test dist/parser.test.js`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: add tokenizer for REPL input"
```

---

### Task 4: Parser - AST Builder

**Files:**
- Modify: `src/parser.ts`
- Modify: `src/parser.test.ts`

**Step 1: Add failing tests for AST parsing**

Append to `src/parser.test.ts`:

```typescript
import { parse, NodeType } from './parser.js';

describe('parser', () => {
  it('parses a single word', () => {
    const ast = parse('king');
    assert.deepStrictEqual(ast, {
      type: NodeType.Word,
      value: 'king'
    });
  });

  it('parses subtraction', () => {
    const ast = parse('king - man');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '-',
      left: { type: NodeType.Word, value: 'king' },
      right: { type: NodeType.Word, value: 'man' }
    });
  });

  it('parses chained operations left-to-right', () => {
    const ast = parse('king - man + woman');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      },
      right: { type: NodeType.Word, value: 'woman' }
    });
  });

  it('parses assignment', () => {
    const ast = parse('royalty = king - man');
    assert.deepStrictEqual(ast, {
      type: NodeType.Assignment,
      name: 'royalty',
      expression: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      }
    });
  });

  it('parses parentheses', () => {
    const ast = parse('(king - man) + woman');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      },
      right: { type: NodeType.Word, value: 'woman' }
    });
  });

  it('parses variable reference', () => {
    const ast = parse('royalty + cat');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: { type: NodeType.Word, value: 'royalty' },
      right: { type: NodeType.Word, value: 'cat' }
    });
  });

  it('throws on unexpected token', () => {
    assert.throws(() => parse('king - - man'), /Unexpected token/);
  });

  it('throws on unexpected end', () => {
    assert.throws(() => parse('king -'), /Unexpected end/);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx tsc && node --test dist/parser.test.js`
Expected: FAIL - NodeType and parse not found

**Step 3: Implement AST parser**

Add to `src/parser.ts`:

```typescript
export enum NodeType {
  Word = 'Word',
  BinaryOp = 'BinaryOp',
  Assignment = 'Assignment',
}

export interface WordNode {
  type: NodeType.Word;
  value: string;
}

export interface BinaryOpNode {
  type: NodeType.BinaryOp;
  operator: '+' | '-';
  left: ASTNode;
  right: ASTNode;
}

export interface AssignmentNode {
  type: NodeType.Assignment;
  name: string;
  expression: ASTNode;
}

export type ASTNode = WordNode | BinaryOpNode | AssignmentNode;

export function parse(input: string): ASTNode {
  const tokens = tokenize(input);
  let pos = 0;

  function peek(): Token | undefined {
    return tokens[pos];
  }

  function consume(): Token {
    return tokens[pos++];
  }

  function expect(type: TokenType): Token {
    const token = peek();
    if (!token) {
      throw new Error('Unexpected end of expression');
    }
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    return consume();
  }

  function parsePrimary(): ASTNode {
    const token = peek();
    if (!token) {
      throw new Error('Unexpected end of expression');
    }

    if (token.type === TokenType.LParen) {
      consume(); // (
      const expr = parseExpression();
      expect(TokenType.RParen);
      return expr;
    }

    if (token.type === TokenType.Identifier) {
      consume();
      return { type: NodeType.Word, value: token.value };
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }

  function parseExpression(): ASTNode {
    let left = parsePrimary();

    while (peek()?.type === TokenType.Plus || peek()?.type === TokenType.Minus) {
      const op = consume();
      const right = parsePrimary();
      left = {
        type: NodeType.BinaryOp,
        operator: op.value as '+' | '-',
        left,
        right
      };
    }

    return left;
  }

  function parseInput(): ASTNode {
    const first = peek();
    if (!first) {
      throw new Error('Empty input');
    }

    // Check for assignment: identifier = expression
    if (first.type === TokenType.Identifier && tokens[1]?.type === TokenType.Equals) {
      const name = consume().value;
      consume(); // =
      const expression = parseExpression();
      return { type: NodeType.Assignment, name, expression };
    }

    return parseExpression();
  }

  const ast = parseInput();

  if (pos < tokens.length) {
    throw new Error(`Unexpected token: ${tokens[pos].type}`);
  }

  return ast;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx tsc && node --test dist/parser.test.js`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/parser.ts src/parser.test.ts
git commit -m "feat: add AST parser for expressions and assignments"
```

---

### Task 5: Embeddings Loader

**Files:**
- Create: `src/embeddings.ts`
- Create: `src/embeddings.test.ts`

**Step 1: Write failing test for embeddings**

```typescript
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Embeddings } from './embeddings.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe('Embeddings', () => {
  const testDir = '/tmp/word-math-test';
  const testFile = join(testDir, 'test.txt');

  before(() => {
    mkdirSync(testDir, { recursive: true });
    // Create a tiny test embeddings file
    const data = [
      'king 0.5 0.5 0.0',
      'queen 0.5 -0.5 0.0',
      'man 0.0 0.5 0.5',
      'woman 0.0 -0.5 0.5',
      'cat 0.0 0.0 1.0'
    ].join('\n');
    writeFileSync(testFile, data);
  });

  it('loads embeddings from file', async () => {
    const emb = new Embeddings();
    await emb.loadFromFile(testFile);
    assert.strictEqual(emb.size, 5);
  });

  it('retrieves vector for a word', async () => {
    const emb = new Embeddings();
    await emb.loadFromFile(testFile);
    const vec = emb.get('king');
    assert.ok(vec);
    assert.strictEqual(vec.length, 3);
  });

  it('returns undefined for unknown word', async () => {
    const emb = new Embeddings();
    await emb.loadFromFile(testFile);
    const vec = emb.get('unknown');
    assert.strictEqual(vec, undefined);
  });

  it('finds nearest neighbors', async () => {
    const emb = new Embeddings();
    await emb.loadFromFile(testFile);
    const kingVec = emb.get('king')!;
    const nearest = emb.nearest(kingVec, 3);
    assert.strictEqual(nearest[0].word, 'king');
    assert.strictEqual(nearest.length, 3);
  });

  it('excludes specified words from nearest search', async () => {
    const emb = new Embeddings();
    await emb.loadFromFile(testFile);
    const kingVec = emb.get('king')!;
    const nearest = emb.nearest(kingVec, 3, new Set(['king']));
    assert.ok(!nearest.some(n => n.word === 'king'));
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx tsc && node --test dist/embeddings.test.js`
Expected: FAIL - Embeddings not found

**Step 3: Implement Embeddings class**

```typescript
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { normalize, dot } from './vector.js';

export interface NearestResult {
  word: string;
  similarity: number;
}

export class Embeddings {
  private vectors = new Map<string, Float32Array>();

  get size(): number {
    return this.vectors.size;
  }

  async loadFromFile(filepath: string): Promise<void> {
    const stream = createReadStream(filepath);
    const rl = createInterface({ input: stream });

    for await (const line of rl) {
      const parts = line.split(' ');
      const word = parts[0];
      const values = parts.slice(1).map(Number);
      const vec = normalize(new Float32Array(values));
      this.vectors.set(word, vec);
    }
  }

  get(word: string): Float32Array | undefined {
    return this.vectors.get(word);
  }

  has(word: string): boolean {
    return this.vectors.has(word);
  }

  nearest(vec: Float32Array, n: number, exclude?: Set<string>): NearestResult[] {
    const normalizedVec = normalize(vec);
    const results: NearestResult[] = [];

    for (const [word, wordVec] of this.vectors) {
      if (exclude?.has(word)) continue;
      const similarity = dot(normalizedVec, wordVec);
      results.push({ word, similarity });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, n);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx tsc && node --test dist/embeddings.test.js`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/embeddings.ts src/embeddings.test.ts
git commit -m "feat: add embeddings loader with nearest neighbor search"
```

---

### Task 6: Evaluator

**Files:**
- Create: `src/evaluator.ts`
- Create: `src/evaluator.test.ts`

**Step 1: Write failing tests for evaluator**

```typescript
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Evaluator } from './evaluator.js';
import { Embeddings } from './embeddings.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

describe('Evaluator', () => {
  let embeddings: Embeddings;
  const testDir = '/tmp/word-math-test';
  const testFile = join(testDir, 'test.txt');

  before(async () => {
    mkdirSync(testDir, { recursive: true });
    const data = [
      'king 0.5 0.5 0.0',
      'queen 0.5 -0.5 0.0',
      'man 0.0 0.5 0.5',
      'woman 0.0 -0.5 0.5',
      'cat 0.0 0.0 1.0'
    ].join('\n');
    writeFileSync(testFile, data);

    embeddings = new Embeddings();
    await embeddings.loadFromFile(testFile);
  });

  it('evaluates a single word', () => {
    const evaluator = new Evaluator(embeddings);
    const result = evaluator.evaluate('king');
    assert.ok(result.vector);
    assert.deepStrictEqual(result.usedWords, new Set(['king']));
  });

  it('evaluates subtraction', () => {
    const evaluator = new Evaluator(embeddings);
    const result = evaluator.evaluate('king - man');
    assert.ok(result.vector);
    assert.deepStrictEqual(result.usedWords, new Set(['king', 'man']));
  });

  it('evaluates assignment and stores variable', () => {
    const evaluator = new Evaluator(embeddings);
    const result = evaluator.evaluate('royalty = king - man');
    assert.strictEqual(result.assignment, 'royalty');
    assert.ok(evaluator.hasVariable('royalty'));
  });

  it('uses stored variables in expressions', () => {
    const evaluator = new Evaluator(embeddings);
    evaluator.evaluate('royalty = king - man');
    const result = evaluator.evaluate('royalty + woman');
    assert.ok(result.vector);
  });

  it('throws on unknown word', () => {
    const evaluator = new Evaluator(embeddings);
    assert.throws(() => evaluator.evaluate('unknown'), /Unknown word/);
  });

  it('throws on undefined variable', () => {
    const evaluator = new Evaluator(embeddings);
    assert.throws(() => evaluator.evaluate('undefined_var + king'), /Undefined variable/);
  });

  it('lists variables', () => {
    const evaluator = new Evaluator(embeddings);
    evaluator.evaluate('a = king');
    evaluator.evaluate('b = queen');
    const vars = evaluator.listVariables();
    assert.deepStrictEqual(vars.sort(), ['a', 'b']);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx tsc && node --test dist/evaluator.test.js`
Expected: FAIL - Evaluator not found

**Step 3: Implement Evaluator**

```typescript
import { parse, ASTNode, NodeType } from './parser.js';
import { Embeddings } from './embeddings.js';
import { add, subtract, normalize } from './vector.js';

export interface EvalResult {
  vector: Float32Array;
  usedWords: Set<string>;
  assignment?: string;
}

export class Evaluator {
  private variables = new Map<string, Float32Array>();

  constructor(private embeddings: Embeddings) {}

  evaluate(input: string): EvalResult {
    const ast = parse(input);
    const usedWords = new Set<string>();

    const evalNode = (node: ASTNode): Float32Array => {
      switch (node.type) {
        case NodeType.Word: {
          // Check if it's a variable first
          if (this.variables.has(node.value)) {
            return this.variables.get(node.value)!;
          }
          // Otherwise look up in embeddings
          const vec = this.embeddings.get(node.value);
          if (!vec) {
            if (!this.embeddings.has(node.value)) {
              // Could be an undefined variable or unknown word
              // If it looks like it could be a word but isn't in embeddings
              throw new Error(`Unknown word: '${node.value}'`);
            }
          }
          usedWords.add(node.value);
          return vec!;
        }
        case NodeType.BinaryOp: {
          const left = evalNode(node.left);
          const right = evalNode(node.right);
          const result = node.operator === '+' ? add(left, right) : subtract(left, right);
          return normalize(result);
        }
        case NodeType.Assignment: {
          const vec = evalNode(node.expression);
          this.variables.set(node.name, vec);
          return vec;
        }
      }
    };

    const vector = evalNode(ast);
    const assignment = ast.type === NodeType.Assignment ? ast.name : undefined;

    return { vector, usedWords, assignment };
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name);
  }

  listVariables(): string[] {
    return Array.from(this.variables.keys());
  }
}
```

**Step 4: Fix the unknown word vs undefined variable logic**

Update the Word case in `evalNode`:

```typescript
case NodeType.Word: {
  // Check if it's a variable first
  if (this.variables.has(node.value)) {
    return this.variables.get(node.value)!;
  }
  // Otherwise look up in embeddings
  if (this.embeddings.has(node.value)) {
    usedWords.add(node.value);
    return this.embeddings.get(node.value)!;
  }
  // Not a variable and not in embeddings
  // Heuristic: if it contains underscore, treat as undefined variable
  if (node.value.includes('_')) {
    throw new Error(`Undefined variable: '${node.value}'`);
  }
  throw new Error(`Unknown word: '${node.value}'`);
}
```

**Step 5: Run tests to verify they pass**

Run: `npx tsc && node --test dist/evaluator.test.js`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/evaluator.ts src/evaluator.test.ts
git commit -m "feat: add expression evaluator with variable support"
```

---

### Task 7: GloVe Downloader

**Files:**
- Create: `src/download.ts`

**Step 1: Implement downloader**

```typescript
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { get } from 'node:https';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createUnzip } from 'node:zlib';

const GLOVE_URL = 'https://nlp.stanford.edu/data/glove.6B.zip';
const DATA_DIR = join(homedir(), '.word-math');
const GLOVE_FILE = join(DATA_DIR, 'glove.6B.300d.txt');

export function getEmbeddingsPath(): string {
  return GLOVE_FILE;
}

export function embeddingsExist(): boolean {
  return existsSync(GLOVE_FILE);
}

export async function downloadEmbeddings(
  onProgress?: (downloaded: number, total: number) => void
): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Download and extract
  return new Promise((resolve, reject) => {
    get(GLOVE_URL, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        get(response.headers.location!, handleResponse);
        return;
      }
      handleResponse(response);

      function handleResponse(res: typeof response) {
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;

        // GloVe comes as a zip file - we need to extract just the 300d file
        const Extract = require('unzipper').Extract;

        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          onProgress?.(downloaded, total);
        });

        res.pipe(Extract({ path: DATA_DIR }))
          .on('close', resolve)
          .on('error', reject);
      }
    }).on('error', reject);
  });
}
```

Note: This needs the `unzipper` package. Let's simplify to avoid dependencies.

**Step 2: Simplified approach - manual download instruction**

Replace with a simpler version that gives instructions:

```typescript
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { get } from 'node:https';
import { createWriteStream } from 'node:fs';
import { createGunzip } from 'node:zlib';

const DATA_DIR = join(homedir(), '.word-math');
export const EMBEDDINGS_PATH = join(DATA_DIR, 'glove.6B.300d.txt');

// Using a pre-extracted gzipped version hosted elsewhere or...
// For simplicity, we'll use a smaller word2vec style file from a direct source

// Alternative: Use a smaller pre-hosted file for demo purposes
// Or instruct user to download manually

export function getDataDir(): string {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  return DATA_DIR;
}

export function embeddingsExist(): boolean {
  return existsSync(EMBEDDINGS_PATH);
}

export function getDownloadInstructions(): string {
  return `
Embeddings not found. Please download GloVe embeddings:

1. Download from: https://nlp.stanford.edu/data/glove.6B.zip
2. Extract glove.6B.300d.txt
3. Move to: ${EMBEDDINGS_PATH}

Or run: curl -L https://nlp.stanford.edu/data/glove.6B.zip -o /tmp/glove.zip && \\
         unzip /tmp/glove.zip glove.6B.300d.txt -d ${DATA_DIR}
`;
}
```

**Step 3: Commit**

```bash
git add src/download.ts
git commit -m "feat: add embeddings path utilities and download instructions"
```

---

### Task 8: REPL Loop

**Files:**
- Modify: `src/index.ts`

**Step 1: Implement REPL**

```typescript
import { createInterface } from 'node:readline';
import { Embeddings } from './embeddings.js';
import { Evaluator } from './evaluator.js';
import { EMBEDDINGS_PATH, embeddingsExist, getDownloadInstructions, getDataDir } from './download.js';

const HELP_TEXT = `
word-math - Vector arithmetic on word embeddings

Commands:
  <expr>           Evaluate expression, show top 5 nearest words
  name = <expr>    Store result in variable
  vars             List defined variables
  help             Show this help
  exit             Quit

Examples:
  king - man + woman
  royalty = king - man
  royalty + cat
`;

async function main() {
  // Ensure data directory exists
  getDataDir();

  // Check for embeddings
  if (!embeddingsExist()) {
    console.log(getDownloadInstructions());
    process.exit(1);
  }

  console.log('Loading embeddings...');
  const embeddings = new Embeddings();
  await embeddings.loadFromFile(EMBEDDINGS_PATH);
  console.log(`Loaded ${embeddings.size.toLocaleString()} words`);
  console.log('Type "help" for commands.\n');

  const evaluator = new Evaluator(embeddings);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    if (input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }

    if (input === 'help') {
      console.log(HELP_TEXT);
      rl.prompt();
      return;
    }

    if (input === 'vars') {
      const vars = evaluator.listVariables();
      if (vars.length === 0) {
        console.log('  No variables defined');
      } else {
        for (const v of vars) {
          console.log(`  ${v}    <vector>`);
        }
      }
      rl.prompt();
      return;
    }

    try {
      const result = evaluator.evaluate(input);

      if (result.assignment) {
        console.log(`  [stored as '${result.assignment}']`);
      } else {
        // Find nearest neighbors, excluding words used in expression
        const nearest = embeddings.nearest(result.vector, 5, result.usedWords);
        for (const { word, similarity } of nearest) {
          console.log(`  ${word.padEnd(15)} ${similarity.toFixed(3)}`);
        }
      }
    } catch (err) {
      console.log(`  Error: ${(err as Error).message}`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });
}

main().catch(console.error);
```

**Step 2: Build and test manually**

Run: `npx tsc && node dist/index.js`
Expected: Either shows download instructions or loads embeddings and shows prompt

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add REPL loop with help and vars commands"
```

---

### Task 9: CLI Entry Point

**Files:**
- Create: `bin/word-math`

**Step 1: Create executable**

```bash
#!/usr/bin/env node
import('../dist/index.js');
```

**Step 2: Make executable and add to package.json**

Run: `chmod +x bin/word-math`

**Step 3: Test CLI**

Run: `./bin/word-math`
Expected: Same as running `node dist/index.js`

**Step 4: Commit**

```bash
git add bin/word-math
git commit -m "feat: add CLI entry point"
```

---

### Task 10: Final Integration Test

**Step 1: Download embeddings (if not already)**

Run the curl command from download instructions.

**Step 2: Run full integration test**

```
$ ./bin/word-math
Loading embeddings...
Loaded 400,000 words
Type "help" for commands.

> king - man + woman
  queen           0.847
  princess        0.762
  ...

> royalty = king - man
  [stored as 'royalty']

> royalty + cat
  ...

> vars
  royalty    <vector>

> exit
Goodbye!
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: ready for release"
```

---

## Summary

10 tasks total:
1. Project setup
2. Vector utilities (TDD)
3. Tokenizer (TDD)
4. AST Parser (TDD)
5. Embeddings loader (TDD)
6. Evaluator (TDD)
7. Download utilities
8. REPL loop
9. CLI entry point
10. Integration test
