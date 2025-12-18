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
