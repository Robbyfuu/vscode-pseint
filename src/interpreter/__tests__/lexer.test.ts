import { describe, it, expect } from "vitest";
import { Lexer } from "../lexer";
import { TokenType } from "../tokens";
import type { Token } from "../tokens";
import { PSeIntError } from "../errors";

function tokenize(source: string): Token[] {
  return new Lexer(source).tokenize();
}

function tokenTypes(source: string): TokenType[] {
  return tokenize(source).map((t) => t.type);
}

describe("Lexer", () => {
  describe("tokenización básica", () => {
    it('tokeniza Escribir "Hola";', () => {
      const types = tokenTypes('Escribir "Hola";');
      expect(types).toEqual([
        TokenType.ESCRIBIR,
        TokenType.STRING,
        TokenType.SEMICOLON,
        TokenType.EOF,
      ]);
    });

    it("produce token EOF para entrada vacía", () => {
      const tokens = tokenize("");
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it("tokeniza múltiples tokens simples", () => {
      const types = tokenTypes("x <- 5 + 3;");
      expect(types).toEqual([
        TokenType.IDENTIFIER,
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.PLUS,
        TokenType.NUMBER,
        TokenType.SEMICOLON,
        TokenType.EOF,
      ]);
    });
  });

  describe("insensibilidad a mayúsculas/minúsculas", () => {
    it("PROCESO y proceso producen el mismo token", () => {
      const upper = tokenTypes("PROCESO foo");
      const lower = tokenTypes("proceso foo");
      expect(upper[0]).toBe(TokenType.PROCESO);
      expect(lower[0]).toBe(TokenType.PROCESO);
    });

    it("MiEnTrAs se reconoce como keyword", () => {
      const types = tokenTypes("MiEnTrAs");
      expect(types[0]).toBe(TokenType.MIENTRAS);
    });

    it("Verdadero y FALSO se reconocen", () => {
      const tokens = tokenize("Verdadero FALSO");
      expect(tokens[0].type).toBe(TokenType.TRUE);
      expect(tokens[0].literal).toBe(true);
      expect(tokens[1].type).toBe(TokenType.FALSE);
      expect(tokens[1].literal).toBe(false);
    });
  });

  describe("operadores de asignación", () => {
    it("x <- 5 produce ASSIGN", () => {
      const tokens = tokenize("x <- 5");
      expect(tokens[1].type).toBe(TokenType.ASSIGN);
      expect(tokens[1].lexeme).toBe("<-");
    });

    it("x := 5 produce ASSIGN", () => {
      const tokens = tokenize("x := 5");
      expect(tokens[1].type).toBe(TokenType.ASSIGN);
      expect(tokens[1].lexeme).toBe(":=");
    });
  });

  describe("todos los operadores", () => {
    it("operadores aritméticos", () => {
      const types = tokenTypes("+ - * / ^ %");
      expect(types).toEqual([
        TokenType.PLUS,
        TokenType.MINUS,
        TokenType.STAR,
        TokenType.SLASH,
        TokenType.POWER,
        TokenType.MOD,
        TokenType.EOF,
      ]);
    });

    it("operadores de comparación", () => {
      expect(tokenTypes("=")[0]).toBe(TokenType.EQ);
      expect(tokenTypes("<>")[0]).toBe(TokenType.NEQ);
      expect(tokenTypes("<")[0]).toBe(TokenType.LT);
      expect(tokenTypes(">")[0]).toBe(TokenType.GT);
      expect(tokenTypes("<=")[0]).toBe(TokenType.LTE);
      expect(tokenTypes(">=")[0]).toBe(TokenType.GTE);
    });

    it("operadores lógicos como keywords", () => {
      const types = tokenTypes("Y O NO");
      expect(types).toEqual([
        TokenType.AND,
        TokenType.OR,
        TokenType.NOT,
        TokenType.EOF,
      ]);
    });

    it("MOD como keyword", () => {
      expect(tokenTypes("mod")[0]).toBe(TokenType.MOD);
    });

    it("puntuación", () => {
      const types = tokenTypes("( ) [ ] , ; :");
      expect(types).toEqual([
        TokenType.LPAREN,
        TokenType.RPAREN,
        TokenType.LBRACKET,
        TokenType.RBRACKET,
        TokenType.COMMA,
        TokenType.SEMICOLON,
        TokenType.COLON,
        TokenType.EOF,
      ]);
    });
  });

  describe("palabras clave compuestas", () => {
    it("Hasta Que como dos palabras", () => {
      const types = tokenTypes("Hasta Que");
      expect(types).toEqual([TokenType.HASTA_QUE, TokenType.EOF]);
    });

    it("Hasta solo (sin Que)", () => {
      const types = tokenTypes("Hasta 10");
      expect(types[0]).toBe(TokenType.HASTA);
    });

    it("Con Paso como dos palabras", () => {
      const types = tokenTypes("Con Paso");
      expect(types).toEqual([TokenType.CON_PASO, TokenType.EOF]);
    });

    it("Escribir Sin Saltar como tres palabras", () => {
      const types = tokenTypes("Escribir Sin Saltar");
      expect(types).toEqual([TokenType.ESCRIBIR_SIN_SALTAR, TokenType.EOF]);
    });

    it("EscribirSinSaltar como una sola palabra", () => {
      const types = tokenTypes("EscribirSinSaltar");
      expect(types).toEqual([TokenType.ESCRIBIR_SIN_SALTAR, TokenType.EOF]);
    });

    it("De Otro Modo como tres palabras", () => {
      const types = tokenTypes("De Otro Modo");
      expect(types).toEqual([TokenType.DE_OTRO_MODO, TokenType.EOF]);
    });

    it("FinProceso como una sola palabra", () => {
      const types = tokenTypes("FinProceso");
      expect(types).toEqual([TokenType.FIN_PROCESO, TokenType.EOF]);
    });

    it("Fin Proceso como dos palabras", () => {
      const types = tokenTypes("Fin Proceso");
      expect(types).toEqual([TokenType.FIN_PROCESO, TokenType.EOF]);
    });

    it("Fin Si, Fin Mientras, Fin Para, Fin Segun", () => {
      expect(tokenTypes("Fin Si")[0]).toBe(TokenType.FIN_SI);
      expect(tokenTypes("Fin Mientras")[0]).toBe(TokenType.FIN_MIENTRAS);
      expect(tokenTypes("Fin Para")[0]).toBe(TokenType.FIN_PARA);
      expect(tokenTypes("Fin Segun")[0]).toBe(TokenType.FIN_SEGUN);
    });

    it("FinSi, FinMientras como una sola palabra", () => {
      expect(tokenTypes("FinSi")[0]).toBe(TokenType.FIN_SI);
      expect(tokenTypes("FinMientras")[0]).toBe(TokenType.FIN_MIENTRAS);
    });
  });

  describe("números", () => {
    it("enteros", () => {
      const tokens = tokenize("42");
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(42);
    });

    it("flotantes", () => {
      const tokens = tokenize("3.14");
      expect(tokens[0].type).toBe(TokenType.NUMBER);
      expect(tokens[0].literal).toBe(3.14);
    });

    it("número seguido de punto sin decimales no consume el punto", () => {
      // 42 followed by something non-numeric: number stops before it
      const types = tokenTypes("42 + 3");
      expect(types[0]).toBe(TokenType.NUMBER);
      expect(types[1]).toBe(TokenType.PLUS);
      // Verify 42. (dot without digits) throws since . is not a valid token
      expect(() => tokenize("42.")).toThrow(PSeIntError);
    });
  });

  describe("cadenas", () => {
    it("comillas dobles", () => {
      const tokens = tokenize('"Hola Mundo"');
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe("Hola Mundo");
    });

    it("comillas simples", () => {
      const tokens = tokenize("'Hola'");
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe("Hola");
    });

    it("cadena vacía", () => {
      const tokens = tokenize('""');
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].literal).toBe("");
    });
  });

  describe("comentarios", () => {
    it("comentario de línea //", () => {
      const types = tokenTypes("x <- 5 // comentario\nz <- 3");
      expect(types).toEqual([
        TokenType.IDENTIFIER,
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.IDENTIFIER,
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.EOF,
      ]);
    });

    it("comentario de bloque /* */", () => {
      const types = tokenTypes("x /* ignorar */ <- 5");
      expect(types).toEqual([
        TokenType.IDENTIFIER,
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.EOF,
      ]);
    });

    it("comentario de bloque multilínea", () => {
      const tokens = tokenize("x\n/* hola\nmundo */\nz");
      const zToken = tokens.find((t) => t.lexeme === "z");
      expect(zToken).toBeDefined();
      expect(zToken!.line).toBe(4);
    });
  });

  describe("errores", () => {
    it("cadena sin cerrar lanza PSeIntError con número de línea", () => {
      expect(() => tokenize('"hola')).toThrow(PSeIntError);
      try {
        tokenize('"hola');
      } catch (e) {
        expect(e).toBeInstanceOf(PSeIntError);
        const err = e as PSeIntError;
        expect(err.line).toBe(1);
        expect(err.message).toContain("Cadena sin cerrar");
      }
    });

    it("carácter desconocido lanza PSeIntError", () => {
      expect(() => tokenize("@")).toThrow(PSeIntError);
      try {
        tokenize("@");
      } catch (e) {
        expect(e).toBeInstanceOf(PSeIntError);
        const err = e as PSeIntError;
        expect(err.message).toContain("Carácter inesperado");
      }
    });

    it("comentario de bloque sin cerrar lanza PSeIntError", () => {
      expect(() => tokenize("/* sin cerrar")).toThrow(PSeIntError);
    });
  });

  describe("caracteres españoles en identificadores", () => {
    it("año como identificador", () => {
      const tokens = tokenize("año <- 2024");
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].lexeme).toBe("año");
    });

    it("función se reconoce como keyword FUNCION", () => {
      const tokens = tokenize("función");
      expect(tokens[0].type).toBe(TokenType.FUNCION);
    });

    it("identificadores con acentos", () => {
      const tokens = tokenize("número_línea");
      expect(tokens[0].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[0].lexeme).toBe("número_línea");
    });
  });

  describe("tipos de datos", () => {
    it("todos los tipos se reconocen", () => {
      expect(tokenTypes("Entero")[0]).toBe(TokenType.TIPO_ENTERO);
      expect(tokenTypes("Real")[0]).toBe(TokenType.TIPO_REAL);
      expect(tokenTypes("Cadena")[0]).toBe(TokenType.TIPO_CADENA);
      expect(tokenTypes("Texto")[0]).toBe(TokenType.TIPO_CADENA);
      expect(tokenTypes("Logico")[0]).toBe(TokenType.TIPO_LOGICO);
      expect(tokenTypes("Lógico")[0]).toBe(TokenType.TIPO_LOGICO);
      expect(tokenTypes("Caracter")[0]).toBe(TokenType.TIPO_CARACTER);
      expect(tokenTypes("Carácter")[0]).toBe(TokenType.TIPO_CARACTER);
    });

    it("Dimension y Dimensión se reconocen", () => {
      expect(tokenTypes("Dimension")[0]).toBe(TokenType.DIMENSION);
      expect(tokenTypes("Dimensión")[0]).toBe(TokenType.DIMENSION);
    });
  });

  describe("subprogramas (Funcion / SubProceso)", () => {
    it("Funcion produce token FUNCION", () => {
      expect(tokenTypes("Funcion")[0]).toBe(TokenType.FUNCION);
    });

    it("Función (con tilde) produce token FUNCION", () => {
      expect(tokenTypes("Función")[0]).toBe(TokenType.FUNCION);
    });

    it("SubProceso produce token SUBPROCESO", () => {
      expect(tokenTypes("SubProceso")[0]).toBe(TokenType.SUBPROCESO);
    });

    it("Retornar produce token RETORNAR", () => {
      expect(tokenTypes("Retornar")[0]).toBe(TokenType.RETORNAR);
    });

    it("FinFuncion produce FIN_FUNCION", () => {
      expect(tokenTypes("FinFuncion")[0]).toBe(TokenType.FIN_FUNCION);
    });

    it("FinFunción (con tilde) produce FIN_FUNCION", () => {
      expect(tokenTypes("FinFunción")[0]).toBe(TokenType.FIN_FUNCION);
    });

    it("Fin Funcion como dos palabras produce FIN_FUNCION", () => {
      expect(tokenTypes("Fin Funcion")[0]).toBe(TokenType.FIN_FUNCION);
    });

    it("FinSubProceso produce FIN_SUBPROCESO", () => {
      expect(tokenTypes("FinSubProceso")[0]).toBe(TokenType.FIN_SUBPROCESO);
    });

    it("Fin SubProceso como dos palabras produce FIN_SUBPROCESO", () => {
      expect(tokenTypes("Fin SubProceso")[0]).toBe(TokenType.FIN_SUBPROCESO);
    });

    it("Por Valor produce POR_VALOR", () => {
      const types = tokenTypes("Por Valor");
      expect(types).toEqual([TokenType.POR_VALOR, TokenType.EOF]);
    });

    it("Por Referencia produce POR_REFERENCIA", () => {
      const types = tokenTypes("Por Referencia");
      expect(types).toEqual([TokenType.POR_REFERENCIA, TokenType.EOF]);
    });

    it("Por solo (sin Valor/Referencia) cae a IDENTIFIER", () => {
      const types = tokenTypes("Por algo");
      expect(types[0]).toBe(TokenType.IDENTIFIER);
      expect(types[1]).toBe(TokenType.IDENTIFIER);
    });
  });

  describe("programa completo", () => {
    it("tokeniza un programa simple", () => {
      const source = `Proceso HolaMundo
  Escribir "Hola Mundo";
FinProceso`;

      const types = tokenTypes(source);
      expect(types).toEqual([
        TokenType.PROCESO,
        TokenType.IDENTIFIER, // HolaMundo
        TokenType.ESCRIBIR,
        TokenType.STRING,
        TokenType.SEMICOLON,
        TokenType.FIN_PROCESO,
        TokenType.EOF,
      ]);
    });

    it("tokeniza un programa con variables y operaciones", () => {
      const source = `Proceso Suma
  Definir a, b Como Entero;
  a <- 5;
  b <- 3;
  Escribir a + b;
Fin Proceso`;

      const types = tokenTypes(source);
      expect(types).toEqual([
        TokenType.PROCESO,
        TokenType.IDENTIFIER, // Suma
        TokenType.DEFINIR,
        TokenType.IDENTIFIER, // a
        TokenType.COMMA,
        TokenType.IDENTIFIER, // b
        TokenType.COMO,
        TokenType.TIPO_ENTERO,
        TokenType.SEMICOLON,
        TokenType.IDENTIFIER, // a
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.SEMICOLON,
        TokenType.IDENTIFIER, // b
        TokenType.ASSIGN,
        TokenType.NUMBER,
        TokenType.SEMICOLON,
        TokenType.ESCRIBIR,
        TokenType.IDENTIFIER, // a
        TokenType.PLUS,
        TokenType.IDENTIFIER, // b
        TokenType.SEMICOLON,
        TokenType.FIN_PROCESO,
        TokenType.EOF,
      ]);
    });

    it("mantiene números de línea correctos", () => {
      const source = `Proceso Test
  x <- 1
  z <- 2
FinProceso`;

      const tokens = tokenize(source);
      const xToken = tokens.find((t) => t.lexeme === "x");
      const zToken = tokens.find((t) => t.lexeme === "z");
      expect(xToken!.line).toBe(2);
      expect(zToken!.line).toBe(3);
    });
  });
});
