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
