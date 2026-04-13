import { PSeIntError } from "./errors";
import { Token, TokenType } from "./tokens";
import type {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  DefineNode,
  AssignNode,
  ArrayAssignNode,
  WriteNode,
  ReadNode,
  IfNode,
  WhileNode,
  ForNode,
  RepeatNode,
  SwitchNode,
  SwitchCase,
  DimensionNode,
  NumberLiteralNode,
  BinaryOperator,
  UnaryOperator,
} from "./ast";

export class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ProgramNode {
    const startToken = this.peek();

    // Expect PROCESO or ALGORITMO
    let keyword: TokenType;
    if (this.check(TokenType.PROCESO)) {
      keyword = TokenType.PROCESO;
      this.advance();
    } else if (this.check(TokenType.ALGORITMO)) {
      keyword = TokenType.ALGORITMO;
      this.advance();
    } else {
      throw this.error("Se esperaba 'Proceso' o 'Algoritmo'");
    }

    // Expect program name
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      "Se esperaba el nombre del programa"
    );

    this.consumeOptionalSemicolon();

    // Parse body
    const body: StatementNode[] = [];
    const endKeyword =
      keyword === TokenType.PROCESO
        ? TokenType.FIN_PROCESO
        : TokenType.FIN_ALGORITMO;

    while (!this.check(endKeyword) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    if (this.isAtEnd() && !this.check(endKeyword)) {
      const expected =
        keyword === TokenType.PROCESO ? "FinProceso" : "FinAlgoritmo";
      throw this.error(`Se esperaba '${expected}'`);
    }

    this.advance(); // consume FIN_PROCESO / FIN_ALGORITMO

    return {
      kind: "program",
      name: nameToken.lexeme,
      body,
      line: startToken.line,
    };
  }

  // ── Statement Parsing ───────────────────────────────────────────

  private parseStatement(): StatementNode {
    const token = this.peek();

    switch (token.type) {
      case TokenType.DEFINIR:
        return this.parseDefine();
      case TokenType.ESCRIBIR:
      case TokenType.ESCRIBIR_SIN_SALTAR:
        return this.parseWrite();
      case TokenType.LEER:
        return this.parseRead();
      case TokenType.SI:
        return this.parseIf();
      case TokenType.MIENTRAS:
        return this.parseWhile();
      case TokenType.PARA:
        return this.parseFor();
      case TokenType.REPETIR:
        return this.parseRepeat();
      case TokenType.SEGUN:
        return this.parseSwitch();
      case TokenType.DIMENSION:
        return this.parseDimension();
      case TokenType.IDENTIFIER:
        return this.parseAssignOrArrayAssign();
      default:
        throw this.error(`Sentencia inesperada '${token.lexeme}'`);
    }
  }

  private parseDefine(): DefineNode {
    const defToken = this.advance(); // consume DEFINIR
    const variables: string[] = [];

    // First variable
    variables.push(
      this.consume(TokenType.IDENTIFIER, "Se esperaba nombre de variable")
        .lexeme
    );

    // Additional variables separated by commas
    while (this.match(TokenType.COMMA)) {
      variables.push(
        this.consume(TokenType.IDENTIFIER, "Se esperaba nombre de variable")
          .lexeme
      );
    }

    // Expect COMO
    this.consume(TokenType.COMO, "Se esperaba 'Como'");

    // Expect type
    const typeToken = this.advance();
    const validTypes = [
      TokenType.TIPO_ENTERO,
      TokenType.TIPO_REAL,
      TokenType.TIPO_CADENA,
      TokenType.TIPO_LOGICO,
      TokenType.TIPO_CARACTER,
    ];

    if (!validTypes.includes(typeToken.type)) {
      throw new PSeIntError(
        `Se esperaba un tipo de dato válido, se encontró '${typeToken.lexeme}'`,
        typeToken.line,
        typeToken.column
      );
    }

    this.consumeOptionalSemicolon();

    return {
      kind: "define",
      variables,
      type: typeToken.lexeme.toLowerCase(),
      line: defToken.line,
    };
  }

  private parseAssignOrArrayAssign(): AssignNode | ArrayAssignNode {
    const nameToken = this.advance(); // consume identifier
    const name = nameToken.lexeme;

    if (this.match(TokenType.LBRACKET)) {
      // Array assignment: arr[idx] <- expr
      const index = this.parseExpression();
      this.consume(TokenType.RBRACKET, "Se esperaba ']'");
      this.consume(TokenType.ASSIGN, "Se esperaba '<-'");
      const value = this.parseExpression();
      this.consumeOptionalSemicolon();

      return {
        kind: "array_assign",
        name,
        index,
        value,
        line: nameToken.line,
      };
    }

    // Simple assignment: var <- expr
    this.consume(TokenType.ASSIGN, "Se esperaba '<-'");
    const value = this.parseExpression();
    this.consumeOptionalSemicolon();

    return {
      kind: "assign",
      target: name,
      value,
      line: nameToken.line,
    };
  }

  private parseWrite(): WriteNode {
    const writeToken = this.advance(); // consume ESCRIBIR or ESCRIBIR_SIN_SALTAR
    const newline = writeToken.type === TokenType.ESCRIBIR;

    const expressions: ExpressionNode[] = [];

    // Parse first expression (if any before semicolon/newline)
    if (
      !this.check(TokenType.SEMICOLON) &&
      !this.isAtEnd() &&
      !this.isStatementStart()
    ) {
      expressions.push(this.parseExpression());

      while (this.match(TokenType.COMMA)) {
        expressions.push(this.parseExpression());
      }
    }

    this.consumeOptionalSemicolon();

    return {
      kind: "write",
      expressions,
      newline,
      line: writeToken.line,
    };
  }

  private parseRead(): ReadNode {
    const readToken = this.advance(); // consume LEER
    const variables: string[] = [];

    variables.push(
      this.consume(TokenType.IDENTIFIER, "Se esperaba nombre de variable")
        .lexeme
    );

    while (this.match(TokenType.COMMA)) {
      variables.push(
        this.consume(TokenType.IDENTIFIER, "Se esperaba nombre de variable")
          .lexeme
      );
    }

    this.consumeOptionalSemicolon();

    return {
      kind: "read",
      variables,
      line: readToken.line,
    };
  }

  private parseIf(): IfNode {
    const ifToken = this.advance(); // consume SI
    const condition = this.parseExpression();
    this.consume(TokenType.ENTONCES, "Se esperaba 'Entonces'");
    this.consumeOptionalSemicolon();

    const thenBranch: StatementNode[] = [];
    while (
      !this.check(TokenType.SINO) &&
      !this.check(TokenType.FIN_SI) &&
      !this.isAtEnd()
    ) {
      thenBranch.push(this.parseStatement());
    }

    const elseBranch: StatementNode[] = [];
    if (this.match(TokenType.SINO)) {
      this.consumeOptionalSemicolon();
      while (!this.check(TokenType.FIN_SI) && !this.isAtEnd()) {
        elseBranch.push(this.parseStatement());
      }
    }

    this.consume(TokenType.FIN_SI, "Se esperaba 'FinSi'");
    this.consumeOptionalSemicolon();

    return {
      kind: "if",
      condition,
      thenBranch,
      elseBranch,
      line: ifToken.line,
    };
  }

  private parseWhile(): WhileNode {
    const whileToken = this.advance(); // consume MIENTRAS
    const condition = this.parseExpression();
    this.consume(TokenType.HACER, "Se esperaba 'Hacer'");
    this.consumeOptionalSemicolon();

    const body: StatementNode[] = [];
    while (!this.check(TokenType.FIN_MIENTRAS) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    this.consume(TokenType.FIN_MIENTRAS, "Se esperaba 'FinMientras'");
    this.consumeOptionalSemicolon();

    return {
      kind: "while",
      condition,
      body,
      line: whileToken.line,
    };
  }

  private parseFor(): ForNode {
    const forToken = this.advance(); // consume PARA
    const varToken = this.consume(
      TokenType.IDENTIFIER,
      "Se esperaba variable del ciclo"
    );
    this.consume(TokenType.ASSIGN, "Se esperaba '<-'");
    const from = this.parseExpression();
    this.consume(TokenType.HASTA, "Se esperaba 'Hasta'");
    const to = this.parseExpression();

    // Optional: Con Paso step
    let step: ExpressionNode;
    if (this.match(TokenType.CON_PASO)) {
      step = this.parseExpression();
    } else {
      const defaultStep: NumberLiteralNode = {
        kind: "number_literal",
        value: 1,
        line: forToken.line,
      };
      step = defaultStep;
    }

    this.consume(TokenType.HACER, "Se esperaba 'Hacer'");
    this.consumeOptionalSemicolon();

    const body: StatementNode[] = [];
    while (!this.check(TokenType.FIN_PARA) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    this.consume(TokenType.FIN_PARA, "Se esperaba 'FinPara'");
    this.consumeOptionalSemicolon();

    return {
      kind: "for",
      variable: varToken.lexeme,
      from,
      to,
      step,
      body,
      line: forToken.line,
    };
  }

  private parseRepeat(): RepeatNode {
    const repeatToken = this.advance(); // consume REPETIR
    this.consumeOptionalSemicolon();

    const body: StatementNode[] = [];
    while (!this.check(TokenType.HASTA_QUE) && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    this.consume(TokenType.HASTA_QUE, "Se esperaba 'Hasta Que'");
    const condition = this.parseExpression();
    this.consumeOptionalSemicolon();

    return {
      kind: "repeat",
      body,
      condition,
      line: repeatToken.line,
    };
  }

  private parseSwitch(): SwitchNode {
    const switchToken = this.advance(); // consume SEGUN
    const expression = this.parseExpression();
    this.consume(TokenType.HACER, "Se esperaba 'Hacer'");
    this.consumeOptionalSemicolon();

    const cases: SwitchCase[] = [];
    let defaultCase: StatementNode[] = [];

    while (
      !this.check(TokenType.FIN_SEGUN) &&
      !this.check(TokenType.DE_OTRO_MODO) &&
      !this.isAtEnd()
    ) {
      // Parse case values: value1, value2:
      const values: ExpressionNode[] = [];
      values.push(this.parseExpression());

      while (this.match(TokenType.COMMA)) {
        values.push(this.parseExpression());
      }

      this.consume(TokenType.COLON, "Se esperaba ':' después de los valores del caso");
      this.consumeOptionalSemicolon();

      // Parse case body
      const body: StatementNode[] = [];
      while (
        !this.check(TokenType.FIN_SEGUN) &&
        !this.check(TokenType.DE_OTRO_MODO) &&
        !this.isAtEnd() &&
        !this.isCaseStart()
      ) {
        body.push(this.parseStatement());
      }

      cases.push({ values, body });
    }

    if (this.match(TokenType.DE_OTRO_MODO)) {
      this.match(TokenType.COLON); // optional colon after De Otro Modo
      this.consumeOptionalSemicolon();

      while (!this.check(TokenType.FIN_SEGUN) && !this.isAtEnd()) {
        defaultCase.push(this.parseStatement());
      }
    }

    this.consume(TokenType.FIN_SEGUN, "Se esperaba 'FinSegun'");
    this.consumeOptionalSemicolon();

    return {
      kind: "switch",
      expression,
      cases,
      defaultCase,
      line: switchToken.line,
    };
  }

  private parseDimension(): DimensionNode {
    const dimToken = this.advance(); // consume DIMENSION
    const nameToken = this.consume(
      TokenType.IDENTIFIER,
      "Se esperaba nombre del arreglo"
    );
    this.consume(TokenType.LBRACKET, "Se esperaba '['");
    const size = this.parseExpression();
    this.consume(TokenType.RBRACKET, "Se esperaba ']'");
    this.consumeOptionalSemicolon();

    return {
      kind: "dimension",
      name: nameToken.lexeme,
      size,
      line: dimToken.line,
    };
  }

  // ── Expression Parsing (Precedence Climbing) ────────────────────

  private parseExpression(): ExpressionNode {
    return this.parseOr();
  }

  private parseOr(): ExpressionNode {
    let left = this.parseAnd();

    while (this.check(TokenType.OR)) {
      const op = this.advance();
      const right = this.parseAnd();
      left = {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left,
        right,
        line: op.line,
      };
    }

    return left;
  }

  private parseAnd(): ExpressionNode {
    let left = this.parseComparison();

    while (this.check(TokenType.AND)) {
      const op = this.advance();
      const right = this.parseComparison();
      left = {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left,
        right,
        line: op.line,
      };
    }

    return left;
  }

  private parseComparison(): ExpressionNode {
    let left = this.parseAddition();

    while (
      this.check(TokenType.EQ) ||
      this.check(TokenType.NEQ) ||
      this.check(TokenType.LT) ||
      this.check(TokenType.GT) ||
      this.check(TokenType.LTE) ||
      this.check(TokenType.GTE)
    ) {
      const op = this.advance();
      const right = this.parseAddition();
      left = {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left,
        right,
        line: op.line,
      };
    }

    return left;
  }

  private parseAddition(): ExpressionNode {
    let left = this.parseMultiplication();

    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const op = this.advance();
      const right = this.parseMultiplication();
      left = {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left,
        right,
        line: op.line,
      };
    }

    return left;
  }

  private parseMultiplication(): ExpressionNode {
    let left = this.parsePower();

    while (
      this.check(TokenType.STAR) ||
      this.check(TokenType.SLASH) ||
      this.check(TokenType.MOD)
    ) {
      const op = this.advance();
      const right = this.parsePower();
      left = {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left,
        right,
        line: op.line,
      };
    }

    return left;
  }

  private parsePower(): ExpressionNode {
    const base = this.parseUnary();

    // Right-associative: a ^ b ^ c = a ^ (b ^ c)
    if (this.check(TokenType.POWER)) {
      const op = this.advance();
      const exponent = this.parsePower(); // recursive for right-associativity
      return {
        kind: "binary_expression",
        operator: op.lexeme as BinaryOperator,
        left: base,
        right: exponent,
        line: op.line,
      };
    }

    return base;
  }

  private parseUnary(): ExpressionNode {
    if (this.check(TokenType.NOT)) {
      const op = this.advance();
      const operand = this.parseUnary();
      return {
        kind: "unary_expression",
        operator: op.lexeme as UnaryOperator,
        operand,
        line: op.line,
      };
    }

    if (this.check(TokenType.MINUS)) {
      const op = this.advance();
      const operand = this.parseUnary();
      return {
        kind: "unary_expression",
        operator: op.lexeme as UnaryOperator,
        operand,
        line: op.line,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.peek();

    // Number literal
    if (this.check(TokenType.NUMBER)) {
      this.advance();
      return {
        kind: "number_literal",
        value: token.literal as number,
        line: token.line,
      };
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      this.advance();
      return {
        kind: "string_literal",
        value: token.literal as string,
        line: token.line,
      };
    }

    // Boolean literal
    if (this.check(TokenType.TRUE) || this.check(TokenType.FALSE)) {
      this.advance();
      return {
        kind: "boolean_literal",
        value: token.literal as boolean,
        line: token.line,
      };
    }

    // Identifier, array access, or function call
    if (this.check(TokenType.IDENTIFIER)) {
      this.advance();

      // Array access: name[index]
      if (this.check(TokenType.LBRACKET)) {
        this.advance(); // consume [
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Se esperaba ']'");
        return {
          kind: "array_access",
          name: token.lexeme,
          index,
          line: token.line,
        };
      }

      // Function call: name(args)
      if (this.check(TokenType.LPAREN)) {
        this.advance(); // consume (
        const args: ExpressionNode[] = [];

        if (!this.check(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          while (this.match(TokenType.COMMA)) {
            args.push(this.parseExpression());
          }
        }

        this.consume(TokenType.RPAREN, "Se esperaba ')'");
        return {
          kind: "function_call",
          name: token.lexeme,
          args,
          line: token.line,
        };
      }

      // Plain identifier
      return {
        kind: "identifier",
        name: token.lexeme,
        line: token.line,
      };
    }

    // Parenthesized expression
    if (this.check(TokenType.LPAREN)) {
      this.advance(); // consume (
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Se esperaba ')'");
      return expr;
    }

    throw this.error(`Expresión inesperada '${token.lexeme}'`);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const token = this.tokens[this.current];
    if (!this.isAtEnd()) {
      this.current++;
    }
    return token;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(message);
  }

  private consumeOptionalSemicolon(): void {
    this.match(TokenType.SEMICOLON);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private isStatementStart(): boolean {
    const type = this.peek().type;
    return (
      type === TokenType.DEFINIR ||
      type === TokenType.ESCRIBIR ||
      type === TokenType.ESCRIBIR_SIN_SALTAR ||
      type === TokenType.LEER ||
      type === TokenType.SI ||
      type === TokenType.MIENTRAS ||
      type === TokenType.PARA ||
      type === TokenType.REPETIR ||
      type === TokenType.SEGUN ||
      type === TokenType.DIMENSION ||
      type === TokenType.FIN_PROCESO ||
      type === TokenType.FIN_ALGORITMO
    );
  }

  /**
   * Detects if the current position is the start of a new Segun case.
   * A case starts with an expression followed by a colon.
   * We use a simple heuristic: if the current token is a literal or identifier
   * and looking ahead we can find a colon before a statement keyword, it's a new case.
   */
  private isCaseStart(): boolean {
    // Save position
    const saved = this.current;

    try {
      // Try to parse expressions separated by commas, then expect a colon
      // Simple heuristic: scan forward looking for a colon before any statement keyword
      let depth = 0;
      let pos = this.current;

      while (pos < this.tokens.length) {
        const t = this.tokens[pos];

        if (t.type === TokenType.LPAREN || t.type === TokenType.LBRACKET) {
          depth++;
        } else if (
          t.type === TokenType.RPAREN ||
          t.type === TokenType.RBRACKET
        ) {
          depth--;
        } else if (depth === 0) {
          if (t.type === TokenType.COLON) {
            return true;
          }
          // If we hit a statement keyword or end, it's not a case start
          if (
            t.type === TokenType.FIN_SEGUN ||
            t.type === TokenType.DE_OTRO_MODO ||
            t.type === TokenType.EOF ||
            t.type === TokenType.DEFINIR ||
            t.type === TokenType.ESCRIBIR ||
            t.type === TokenType.ESCRIBIR_SIN_SALTAR ||
            t.type === TokenType.LEER ||
            t.type === TokenType.SI ||
            t.type === TokenType.MIENTRAS ||
            t.type === TokenType.PARA ||
            t.type === TokenType.REPETIR ||
            t.type === TokenType.SEGUN ||
            t.type === TokenType.DIMENSION
          ) {
            return false;
          }
        }
        pos++;
      }

      return false;
    } finally {
      this.current = saved;
    }
  }

  private error(message: string): PSeIntError {
    const token = this.peek();
    return new PSeIntError(message, token.line, token.column);
  }
}
