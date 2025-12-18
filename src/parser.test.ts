import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenize, TokenType, parse, NodeType } from './parser.js';

describe('tokenizer', () => {
  it('tokenizes a simple word', () => {
    const tokens = tokenize('king');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' }
    ]);
  });

  it('tokenizes an expression with operators', () => {
    const tokens = tokenize('king - man + woman');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' },
      { type: TokenType.Plus, value: '+' },
      { type: TokenType.Identifier, value: 'woman' }
    ]);
  });

  it('tokenizes an assignment', () => {
    const tokens = tokenize('royalty = king - man');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'royalty' },
      { type: TokenType.Equals, value: '=' },
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' }
    ]);
  });

  it('tokenizes parentheses', () => {
    const tokens = tokenize('(king - man) + woman');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.LParen, value: '(' },
      { type: TokenType.Identifier, value: 'king' },
      { type: TokenType.Minus, value: '-' },
      { type: TokenType.Identifier, value: 'man' },
      { type: TokenType.RParen, value: ')' },
      { type: TokenType.Plus, value: '+' },
      { type: TokenType.Identifier, value: 'woman' }
    ]);
  });

  it('lowercases identifiers', () => {
    const tokens = tokenize('King');
    assert.deepStrictEqual(tokens, [
      { type: TokenType.Identifier, value: 'king' }
    ]);
  });
});

describe('parser', () => {
  it('parses a single word', () => {
    const ast = parse('king');
    assert.deepStrictEqual(ast, {
      type: NodeType.Word,
      value: 'king'
    });
  });

  it('parses subtraction', () => {
    const ast = parse('king - man');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '-',
      left: { type: NodeType.Word, value: 'king' },
      right: { type: NodeType.Word, value: 'man' }
    });
  });

  it('parses chained operations left-to-right', () => {
    const ast = parse('king - man + woman');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      },
      right: { type: NodeType.Word, value: 'woman' }
    });
  });

  it('parses assignment', () => {
    const ast = parse('royalty = king - man');
    assert.deepStrictEqual(ast, {
      type: NodeType.Assignment,
      name: 'royalty',
      expression: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      }
    });
  });

  it('parses parentheses', () => {
    const ast = parse('(king - man) + woman');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: {
        type: NodeType.BinaryOp,
        operator: '-',
        left: { type: NodeType.Word, value: 'king' },
        right: { type: NodeType.Word, value: 'man' }
      },
      right: { type: NodeType.Word, value: 'woman' }
    });
  });

  it('parses variable reference', () => {
    const ast = parse('royalty + cat');
    assert.deepStrictEqual(ast, {
      type: NodeType.BinaryOp,
      operator: '+',
      left: { type: NodeType.Word, value: 'royalty' },
      right: { type: NodeType.Word, value: 'cat' }
    });
  });

  it('throws on unexpected token', () => {
    assert.throws(() => parse('king - - man'), /Unexpected token/);
  });

  it('throws on unexpected end', () => {
    assert.throws(() => parse('king -'), /Unexpected end/);
  });
});
