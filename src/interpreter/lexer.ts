import { PSeIntError } from "./errors";
import { Token, TokenType } from "./tokens";

const KEYWORDS: Map<string, TokenType> = new Map([
  ["proceso", TokenType.PROCESO],
  ["finproceso", TokenType.FIN_PROCESO],
  ["algoritmo", TokenType.ALGORITMO],
  ["finalgoritmo", TokenType.FIN_ALGORITMO],
  ["definir", TokenType.DEFINIR],
  ["como", TokenType.COMO],
  ["escribir", TokenType.ESCRIBIR],
  ["escribirsinsaltar", TokenType.ESCRIBIR_SIN_SALTAR],
  ["leer", TokenType.LEER],
  ["si", TokenType.SI],
  ["entonces", TokenType.ENTONCES],
  ["sino", TokenType.SINO],
  ["finsi", TokenType.FIN_SI],
  ["mientras", TokenType.MIENTRAS],
  ["hacer", TokenType.HACER],
  ["finmientras", TokenType.FIN_MIENTRAS],
  ["para", TokenType.PARA],
  ["hasta", TokenType.HASTA],
  ["finpara", TokenType.FIN_PARA],
  ["repetir", TokenType.REPETIR],
  ["segun", TokenType.SEGUN],
  ["finsegun", TokenType.FIN_SEGUN],
  ["dimension", TokenType.DIMENSION],
  ["dimensión", TokenType.DIMENSION],
  ["segundos", TokenType.SEGUNDOS],
  ["funcion", TokenType.FUNCION],
  ["función", TokenType.FUNCION],
  ["finfuncion", TokenType.FIN_FUNCION],
  ["finfunción", TokenType.FIN_FUNCION],
  ["subproceso", TokenType.SUBPROCESO],
  ["finsubproceso", TokenType.FIN_SUBPROCESO],
  ["retornar", TokenType.RETORNAR],
  ["entero", TokenType.TIPO_ENTERO],
  ["real", TokenType.TIPO_REAL],
  ["cadena", TokenType.TIPO_CADENA],
  ["texto", TokenType.TIPO_CADENA],
  ["caracter", TokenType.TIPO_CARACTER],
  ["carácter", TokenType.TIPO_CARACTER],
  ["logico", TokenType.TIPO_LOGICO],
  ["lógico", TokenType.TIPO_LOGICO],
  ["numero", TokenType.TIPO_REAL],
  ["número", TokenType.TIPO_REAL],
  ["numerico", TokenType.TIPO_REAL],
  ["numérico", TokenType.TIPO_REAL],
  ["verdadero", TokenType.TRUE],
  ["falso", TokenType.FALSE],
  ["y", TokenType.AND],
  ["o", TokenType.OR],
  ["no", TokenType.NOT],
  ["mod", TokenType.MOD],
]);

/** Keywords that map to IDENTIFIER (pass-through, out of scope) */
const PASSTHROUGH_KEYWORDS: Set<string> = new Set([]);

/** Compound "Fin X" mappings (second word lowercase → token type) */
const FIN_COMPOUNDS: Map<string, TokenType> = new Map([
  ["proceso", TokenType.FIN_PROCESO],
  ["algoritmo", TokenType.FIN_ALGORITMO],
  ["si", TokenType.FIN_SI],
  ["mientras", TokenType.FIN_MIENTRAS],
  ["para", TokenType.FIN_PARA],
  ["segun", TokenType.FIN_SEGUN],
  ["funcion", TokenType.FIN_FUNCION],
  ["función", TokenType.FIN_FUNCION],
  ["subproceso", TokenType.FIN_SUBPROCESO],
]);

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}

function isAlpha(c: string): boolean {
  if (c === "_") return true;
  const code = c.charCodeAt(0);
  // a-z, A-Z
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) return true;
  // Spanish/accented characters: check via regex for simplicity
  if (/[\u00C0-\u024F\u1E00-\u1EFF]/.test(c)) return true;
  return false;
}

function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || isDigit(c);
}

export class Lexer {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      literal: null,
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case "(":
        this.addToken(TokenType.LPAREN);
        break;
      case ")":
        this.addToken(TokenType.RPAREN);
        break;
      case "[":
        this.addToken(TokenType.LBRACKET);
        break;
      case "]":
        this.addToken(TokenType.RBRACKET);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "^":
        this.addToken(TokenType.POWER);
        break;
      case "%":
        this.addToken(TokenType.MOD);
        break;
      case "=":
        this.addToken(TokenType.EQ);
        break;

      case ":":
        if (this.match("=")) {
          this.addToken(TokenType.ASSIGN);
        } else {
          this.addToken(TokenType.COLON);
        }
        break;

      case "<":
        if (this.match("-")) {
          this.addToken(TokenType.ASSIGN);
        } else if (this.match(">")) {
          this.addToken(TokenType.NEQ);
        } else if (this.match("=")) {
          this.addToken(TokenType.LTE);
        } else {
          this.addToken(TokenType.LT);
        }
        break;

      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GTE);
        } else {
          this.addToken(TokenType.GT);
        }
        break;

      case "/":
        if (this.match("/")) {
          // Single-line comment
          while (!this.isAtEnd() && this.peek() !== "\n") {
            this.advance();
          }
        } else if (this.match("*")) {
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case '"':
      case "'":
        this.string(c);
        break;

      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;

      case "\n":
        this.line++;
        this.column = 1;
        break;

      default:
        if (isDigit(c)) {
          this.number();
        } else if (isAlpha(c)) {
          this.identifier();
        } else {
          throw new PSeIntError(
            `Carácter inesperado '${c}'`,
            this.line,
            this.startColumn
          );
        }
        break;
    }
  }

  private blockComment(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0; // advance() will increment to 1
      }
      if (this.peek() === "*" && this.peekNext() === "/") {
        this.advance(); // consume *
        this.advance(); // consume /
        return;
      }
      this.advance();
    }
    throw new PSeIntError(
      "Comentario de bloque sin cerrar",
      this.line,
      this.startColumn
    );
  }

  private string(quote: string): void {
    const startLine = this.line;
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new PSeIntError(
        "Cadena sin cerrar",
        startLine,
        this.startColumn
      );
    }

    // Consume closing quote
    this.advance();

    // Extract string value (without quotes)
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addTokenWithLiteral(TokenType.STRING, value);
  }

  private number(): void {
    while (!this.isAtEnd() && isDigit(this.peek())) {
      this.advance();
    }

    // Look for fractional part
    if (
      !this.isAtEnd() &&
      this.peek() === "." &&
      isDigit(this.peekNext())
    ) {
      this.advance(); // consume '.'
      while (!this.isAtEnd() && isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.source.substring(this.start, this.current);
    this.addTokenWithLiteral(TokenType.NUMBER, parseFloat(text));
  }

  private identifier(): void {
    while (!this.isAtEnd() && isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const lower = text.toLowerCase();

    // Check passthrough keywords first
    if (PASSTHROUGH_KEYWORDS.has(lower)) {
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "fin" as a standalone word that starts compound keywords
    if (lower === "fin") {
      const compoundToken = this.tryFinCompound(text);
      if (compoundToken) return;
      // "fin" alone is just an identifier
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "escribir" → peek for "Sin Saltar"
    if (lower === "escribir") {
      if (this.tryCompoundWords("sin", "saltar")) {
        this.addToken(TokenType.ESCRIBIR_SIN_SALTAR);
        return;
      }
      this.addToken(TokenType.ESCRIBIR);
      return;
    }

    // Check for "limpiar" → peek for "pantalla"
    if (lower === "limpiar") {
      if (this.tryCompoundWord("pantalla")) {
        this.addToken(TokenType.LIMPIAR_PANTALLA);
        return;
      }
      // "limpiar" solo cae a IDENTIFIER (puede ser nombre de variable)
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "borrar" → peek for "pantalla" (alias de Limpiar Pantalla)
    if (lower === "borrar") {
      if (this.tryCompoundWord("pantalla")) {
        this.addToken(TokenType.LIMPIAR_PANTALLA);
        return;
      }
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "esperar" → peek for "tecla" (sino, ESPERAR para "Esperar N Segundos")
    if (lower === "esperar") {
      if (this.tryCompoundWord("tecla")) {
        this.addToken(TokenType.ESPERAR_TECLA);
        return;
      }
      this.addToken(TokenType.ESPERAR);
      return;
    }

    // Check for "hasta" → peek for "que"
    if (lower === "hasta") {
      if (this.tryCompoundWord("que")) {
        this.addToken(TokenType.HASTA_QUE);
        return;
      }
      this.addToken(TokenType.HASTA);
      return;
    }

    // Check for "con" → peek for "paso"
    if (lower === "con") {
      if (this.tryCompoundWord("paso")) {
        this.addToken(TokenType.CON_PASO);
        return;
      }
      // "con" alone is an identifier
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "por" → peek for "valor" or "referencia"
    if (lower === "por") {
      if (this.tryCompoundWord("valor")) {
        this.addToken(TokenType.POR_VALOR);
        return;
      }
      if (this.tryCompoundWord("referencia")) {
        this.addToken(TokenType.POR_REFERENCIA);
        return;
      }
      // "por" alone is just an identifier
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Check for "de" → peek for "otro modo"
    if (lower === "de") {
      if (this.tryCompoundWords("otro", "modo")) {
        this.addToken(TokenType.DE_OTRO_MODO);
        return;
      }
      // "de" alone is an identifier
      this.addToken(TokenType.IDENTIFIER);
      return;
    }

    // Standard keyword lookup
    const type = KEYWORDS.get(lower);
    if (type !== undefined) {
      if (type === TokenType.TRUE) {
        this.addTokenWithLiteral(type, true);
      } else if (type === TokenType.FALSE) {
        this.addTokenWithLiteral(type, false);
      } else {
        this.addToken(type);
      }
      return;
    }

    this.addToken(TokenType.IDENTIFIER);
  }

  /**
   * After seeing "fin", try to consume the next word to form a compound
   * like "Fin Proceso" → FIN_PROCESO.
   */
  private tryFinCompound(finText: string): boolean {
    const saved = this.current;
    const savedCol = this.column;

    // Skip whitespace (not newlines)
    let tempPos = this.current;
    let tempCol = this.column;
    while (tempPos < this.source.length && (this.source[tempPos] === " " || this.source[tempPos] === "\t")) {
      tempPos++;
      tempCol++;
    }

    // Try to read next word
    if (tempPos < this.source.length && isAlpha(this.source[tempPos])) {
      let wordStart = tempPos;
      while (tempPos < this.source.length && isAlphaNumeric(this.source[tempPos])) {
        tempPos++;
        tempCol++;
      }

      const nextWord = this.source.substring(wordStart, tempPos).toLowerCase();
      const compoundType = FIN_COMPOUNDS.get(nextWord);

      if (compoundType) {
        // Consume: update current and column
        this.current = tempPos;
        this.column = tempCol;
        this.addToken(compoundType);
        return true;
      }
    }

    // Restore
    this.current = saved;
    this.column = savedCol;
    return false;
  }

  /**
   * Try to consume one next word (separated by whitespace) matching `expected`.
   * Returns true if consumed, false otherwise (restores position).
   */
  private tryCompoundWord(expected: string): boolean {
    const saved = this.current;
    const savedCol = this.column;

    // Skip horizontal whitespace
    let tempPos = this.current;
    let tempCol = this.column;
    while (tempPos < this.source.length && (this.source[tempPos] === " " || this.source[tempPos] === "\t")) {
      tempPos++;
      tempCol++;
    }

    if (tempPos < this.source.length && isAlpha(this.source[tempPos])) {
      const wordStart = tempPos;
      while (tempPos < this.source.length && isAlphaNumeric(this.source[tempPos])) {
        tempPos++;
        tempCol++;
      }

      const word = this.source.substring(wordStart, tempPos).toLowerCase();
      if (word === expected) {
        this.current = tempPos;
        this.column = tempCol;
        return true;
      }
    }

    this.current = saved;
    this.column = savedCol;
    return false;
  }

  /**
   * Try to consume two consecutive words matching `first` and `second`.
   */
  private tryCompoundWords(first: string, second: string): boolean {
    const saved = this.current;
    const savedCol = this.column;

    if (this.tryCompoundWord(first) && this.tryCompoundWord(second)) {
      return true;
    }

    this.current = saved;
    this.column = savedCol;
    return false;
  }

  private advance(): string {
    const c = this.source[this.current];
    this.current++;
    this.column++;
    return c;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal: null,
      line: this.line,
      column: this.startColumn,
    });
  }

  private addTokenWithLiteral(
    type: TokenType,
    literal: number | string | boolean | null
  ): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
      line: this.line,
      column: this.startColumn,
    });
  }
}
