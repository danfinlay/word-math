# word-math

A REPL for performing vector arithmetic on word embeddings. Explore semantic relationships in language by computing expressions like `king - man + woman = queen`.

## Installation

```bash
npm install
npm run build
```

### Download GloVe Embeddings

word-math uses Stanford's GloVe word vectors. Download the 300-dimensional embeddings (one-time setup):

```bash
curl -L https://nlp.stanford.edu/data/glove.6B.zip -o /tmp/glove.zip
unzip /tmp/glove.zip glove.6B.300d.txt -d ~/.word-math
```

The embeddings file is approximately 1GB to download and contains 400,000 words.

## Usage

```bash
npm start
# or
./bin/word-math
```

### Example Session

```
word-math> king - man + woman
  queen           0.847
  princess        0.762
  monarch         0.731
  throne          0.689
  prince          0.676

word-math> paris - france + japan
  tokyo           0.892
  osaka           0.811
  japanese        0.787
  korea           0.743
  seoul           0.721

word-math> royalty = king - man
  [stored as 'royalty']

word-math> royalty + woman
  queen           0.847
  princess        0.762
  monarch         0.731
  throne          0.689
  prince          0.676

word-math> vars
  royalty    <vector>
```

## Commands

| Command | Description |
|---------|-------------|
| `help` | Display usage information |
| `vars` | List all stored variables |
| `exit` or `quit` | Exit the REPL |

## Expression Syntax

- **Words**: Look up a word's embedding vector (e.g., `king`)
- **Addition**: `word1 + word2` - Add vectors together
- **Subtraction**: `word1 - word2` - Subtract vectors
- **Parentheses**: `(king - man) + woman` - Group operations
- **Variables**: `name = expression` - Store results for reuse

All operations normalize the resulting vector before finding nearest neighbors.

## How It Works

Word embeddings represent words as high-dimensional vectors where semantic relationships are encoded as geometric relationships. Words with similar meanings cluster together, and analogies can be solved through vector arithmetic.

The classic example `king - man + woman` works because:
- `king - man` produces a vector representing "royalty without maleness"
- Adding `woman` gives a vector representing "female royalty"
- The nearest word to this vector is `queen`

word-math uses GloVe (Global Vectors for Word Representation) embeddings trained on 6 billion tokens from Wikipedia and news articles.

## Project Structure

```
word-math/
├── bin/word-math         # CLI entry point
├── src/
│   ├── index.ts          # REPL loop
│   ├── parser.ts         # Tokenizer and AST parser
│   ├── evaluator.ts      # Expression evaluation
│   ├── embeddings.ts     # GloVe loader and nearest neighbor search
│   ├── vector.ts         # Vector math operations
│   └── *.test.ts         # Tests
├── dist/                 # Compiled JavaScript
└── docs/plans/           # Design documents
```

## Development

```bash
# Build
npm run build

# Run tests
npm test
```

## License

MIT
