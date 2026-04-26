export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",
  TRUE = "TRUE",
  FALSE = "FALSE",

  // Keywords
  PROCESO = "PROCESO",
  FIN_PROCESO = "FIN_PROCESO",
  ALGORITMO = "ALGORITMO",
  FIN_ALGORITMO = "FIN_ALGORITMO",
  DEFINIR = "DEFINIR",
  COMO = "COMO",
  ESCRIBIR = "ESCRIBIR",
  ESCRIBIR_SIN_SALTAR = "ESCRIBIR_SIN_SALTAR",
  LEER = "LEER",
  SI = "SI",
  ENTONCES = "ENTONCES",
  SINO = "SINO",
  FIN_SI = "FIN_SI",
  MIENTRAS = "MIENTRAS",
  HACER = "HACER",
  FIN_MIENTRAS = "FIN_MIENTRAS",
  PARA = "PARA",
  HASTA = "HASTA",
  CON_PASO = "CON_PASO",
  FIN_PARA = "FIN_PARA",
  REPETIR = "REPETIR",
  HASTA_QUE = "HASTA_QUE",
  SEGUN = "SEGUN",
  DE_OTRO_MODO = "DE_OTRO_MODO",
  FIN_SEGUN = "FIN_SEGUN",
  DIMENSION = "DIMENSION",

  // Subprograms (Funcion / SubProceso)
  FUNCION = "FUNCION",
  FIN_FUNCION = "FIN_FUNCION",
  SUBPROCESO = "SUBPROCESO",
  FIN_SUBPROCESO = "FIN_SUBPROCESO",
  RETORNAR = "RETORNAR",
  POR_VALOR = "POR_VALOR",
  POR_REFERENCIA = "POR_REFERENCIA",

  // Types
  TIPO_ENTERO = "TIPO_ENTERO",
  TIPO_REAL = "TIPO_REAL",
  TIPO_CADENA = "TIPO_CADENA",
  TIPO_LOGICO = "TIPO_LOGICO",
  TIPO_CARACTER = "TIPO_CARACTER",

  // Operators
  ASSIGN = "ASSIGN",
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  POWER = "POWER",
  MOD = "MOD",
  EQ = "EQ",
  NEQ = "NEQ",
  LT = "LT",
  GT = "GT",
  LTE = "LTE",
  GTE = "GTE",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Punctuation
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  COMMA = "COMMA",
  SEMICOLON = "SEMICOLON",
  COLON = "COLON",

  // Special
  EOF = "EOF",
}

export interface Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: number | string | boolean | null;
  readonly line: number;
  readonly column: number;
}
