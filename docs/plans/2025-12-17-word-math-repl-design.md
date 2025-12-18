# word-math REPL Design

A REPL for doing vector arithmetic on word embeddings, enabling queries like `king - man + woman = queen`.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     REPL Loop                        │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐   │
│  │  Parser  │ → │ Evaluator │ → │ Nearest Search │   │
│  └──────────┘   └──────────┘   └────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Embeddings Store                        │
│  - Loads GloVe file at startup (~400k words)        │
│  - In-memory Map<string, Float32Array>              │
│  - Pre-normalized vectors for fast cosine similarity│
└─────────────────────────────────────────────────────┘
```

**Components:**
- **Parser** - Tokenizes input, builds simple AST (words, operators, variables, assignments)
- **Evaluator** - Walks AST, resolves words/variables to vectors, performs +/- operations
- **Nearest Search** - Finds top 5 closest words to result vector using cosine similarity
- **Embeddings Store** - Loads GloVe file once, serves lookups

## Syntax & Grammar

```
input      → assignment | expression
assignment → IDENTIFIER "=" expression
expression → term (("+"|"-") term)*
term       → IDENTIFIER | "(" expression ")"

IDENTIFIER → [a-zA-Z_][a-zA-Z0-9_]*
```

**Examples:**

```
> king - man + woman
  queen      0.847
  princess   0.762
  monarch    0.731
  duchess    0.704
  elizabeth  0.689

> royalty = king - man
  [stored as 'royalty']

> royalty + cat
  lion       0.692
  tiger      0.651
  ...

> vars
  royalty    <vector>

> help
  Commands:
    <expr>           evaluate expression, show top 5 nearest words
    name = <expr>    store result in variable
    vars             list defined variables
    help             show this help
    exit             quit
```

**Operator semantics:**
- `a + b` → element-wise vector addition, then normalize
- `a - b` → element-wise vector subtraction, then normalize
- Parentheses for grouping: `(king - man) + woman`
- Results are L2-normalized after each operation

## Embeddings & Storage

**Source:** GloVe 6B 300d from Stanford NLP
- ~1GB download, 400k words, 300 dimensions
- Format: `word 0.123 -0.456 0.789 ... (300 floats)`

**Loading:**
- Downloaded on first run to `~/.word-math/glove.6B.300d.txt`
- Parsed and normalized at startup
- ~480MB in memory, ~5-10 second load time

**First-run experience:**
```
$ word-math
Downloading GloVe embeddings (862MB)... done
Loading embeddings... done (400,000 words)
>
```

## Project Structure

```
word-math/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Entry point, REPL loop
│   ├── parser.ts         # Tokenizer + AST builder
│   ├── evaluator.ts      # AST → vector computation
│   ├── embeddings.ts     # Load GloVe, nearest neighbor search
│   └── vector.ts         # add, subtract, normalize, dot product
├── bin/
│   └── word-math         # CLI shebang wrapper
└── data/
    └── .gitkeep          # embeddings downloaded here at runtime
```

**Dependencies:** None external - pure Node.js built-ins (readline, fs, path, https).

## Error Handling

- **Unknown words:** `Error: Unknown word 'flibbertigibbet'`
- **Undefined variables:** `Error: Undefined variable 'royalty'`
- **Syntax errors:** `Error: Unexpected token '-'`
- **Empty input:** Show prompt again (no error)
- **Case:** Auto-lowercase all input (GloVe is lowercase)
- **Self-reference:** Exclude input words from nearest neighbor results
