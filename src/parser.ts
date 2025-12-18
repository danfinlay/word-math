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
