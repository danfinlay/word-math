import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DATA_DIR = join(homedir(), '.word-math');
export const EMBEDDINGS_PATH = join(DATA_DIR, 'glove.6B.300d.txt');

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
