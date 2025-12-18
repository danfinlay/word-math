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
