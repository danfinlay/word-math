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
