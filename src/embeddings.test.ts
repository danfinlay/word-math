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
