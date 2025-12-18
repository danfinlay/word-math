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
