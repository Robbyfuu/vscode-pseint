import { describe, it, expect } from "vitest";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { PSeIntError } from "../errors";
import type {
  ProgramNode,
  WriteNode,
  DefineNode,
  AssignNode,
  ForNode,
  IfNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  WhileNode,
  RepeatNode,
  SwitchNode,
  ReadNode,
  DimensionNode,
  ArrayAssignNode,
  FunctionCallNode,
  NumberLiteralNode,
} from "../ast";

function parse(source: string): ProgramNode {
  const tokens = new Lexer(source).tokenize();
  return new Parser(tokens).parse();
}

describe("Parser", () => {
  describe("programa mínimo", () => {
    it("parsea Proceso con Escribir", () => {
      const ast = parse(`
        Proceso Hola
          Escribir "mundo";
        FinProceso
      `);

      expect(ast.kind).toBe("program");
      expect(ast.name).toBe("Hola");
      expect(ast.body).toHaveLength(1);

      const write = ast.body[0] as WriteNode;
      expect(write.kind).toBe("write");
      expect(write.newline).toBe(true);
      expect(write.expressions).toHaveLength(1);
      expect(write.expressions[0].kind).toBe("string_literal");
    });

    it("parsea variante Algoritmo", () => {
      const ast = parse(`
        Algoritmo Prueba
        FinAlgoritmo
      `);

      expect(ast.kind).toBe("program");
      expect(ast.name).toBe("Prueba");
      expect(ast.body).toHaveLength(0);
    });
  });

  describe("definición de variables", () => {
    it("parsea Definir con múltiples variables", () => {
      const ast = parse(`
        Proceso Test
          Definir x, z Como Entero;
        FinProceso
      `);

      const def = ast.body[0] as DefineNode;
      expect(def.kind).toBe("define");
      expect(def.variables).toEqual(["x", "z"]);
      expect(def.type).toBe("entero");
    });
  });

  describe("asignación", () => {
    it("parsea asignación simple", () => {
      const ast = parse(`
        Proceso Test
          x <- 5;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      expect(assign.kind).toBe("assign");
      expect(assign.target).toBe("x");
      expect(assign.value.kind).toBe("number_literal");
      if (assign.value.kind === "number_literal") {
        expect(assign.value.value).toBe(5);
      }
    });
  });

  describe("estructuras anidadas", () => {
    it("parsea Si dentro de Para", () => {
      const ast = parse(`
        Proceso Test
          Para i <- 1 Hasta 10 Hacer
            Si i > 5 Entonces
              Escribir i;
            FinSi
          FinPara
        FinProceso
      `);

      expect(ast.body).toHaveLength(1);
      const forNode = ast.body[0] as ForNode;
      expect(forNode.kind).toBe("for");
      expect(forNode.body).toHaveLength(1);

      const ifNode = forNode.body[0] as IfNode;
      expect(ifNode.kind).toBe("if");
      expect(ifNode.thenBranch).toHaveLength(1);
      expect(ifNode.thenBranch[0].kind).toBe("write");
    });
  });

  describe("errores", () => {
    it("lanza error si falta FinProceso", () => {
      expect(() =>
        parse(`
          Proceso Test
            Escribir "hola";
        `)
      ).toThrow(PSeIntError);
      expect(() =>
        parse(`
          Proceso Test
            Escribir "hola";
        `)
      ).toThrow(/FinProceso/);
    });
  });

  describe("Para (ciclo for)", () => {
    it("usa paso por defecto 1 sin Con Paso", () => {
      const ast = parse(`
        Proceso Test
          Para i <- 1 Hasta 10 Hacer
          FinPara
        FinProceso
      `);

      const forNode = ast.body[0] as ForNode;
      expect(forNode.kind).toBe("for");
      expect(forNode.variable).toBe("i");
      expect(forNode.step.kind).toBe("number_literal");
      if (forNode.step.kind === "number_literal") {
        expect(forNode.step.value).toBe(1);
      }
    });

    it("parsea Con Paso explícito", () => {
      const ast = parse(`
        Proceso Test
          Para i <- 0 Hasta 100 Con Paso 5 Hacer
          FinPara
        FinProceso
      `);

      const forNode = ast.body[0] as ForNode;
      expect(forNode.step.kind).toBe("number_literal");
      if (forNode.step.kind === "number_literal") {
        expect(forNode.step.value).toBe(5);
      }
    });
  });

  describe("precedencia de expresiones", () => {
    it("respeta precedencia: 2 + 3 * 4 → suma con multiplicación a la derecha", () => {
      const ast = parse(`
        Proceso Test
          x <- 2 + 3 * 4;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const expr = assign.value as BinaryExpressionNode;

      expect(expr.kind).toBe("binary_expression");
      expect(expr.operator).toBe("+");

      // Left side is just 2
      expect(expr.left.kind).toBe("number_literal");
      if (expr.left.kind === "number_literal") {
        expect(expr.left.value).toBe(2);
      }

      // Right side is 3 * 4
      expect(expr.right.kind).toBe("binary_expression");
      if (expr.right.kind === "binary_expression") {
        expect(expr.right.operator).toBe("*");
      }
    });
  });

  describe("operadores unarios", () => {
    it("parsea NO (negación lógica)", () => {
      const ast = parse(`
        Proceso Test
          x <- NO Verdadero;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const unary = assign.value as UnaryExpressionNode;
      expect(unary.kind).toBe("unary_expression");
      expect(unary.operator.toLowerCase()).toBe("no");
      expect(unary.operand.kind).toBe("boolean_literal");
    });

    it("parsea menos unario", () => {
      const ast = parse(`
        Proceso Test
          x <- -5;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const unary = assign.value as UnaryExpressionNode;
      expect(unary.kind).toBe("unary_expression");
      expect(unary.operator).toBe("-");
      expect(unary.operand.kind).toBe("number_literal");
    });
  });

  describe("Segun (switch)", () => {
    it("parsea múltiples casos y De Otro Modo", () => {
      const ast = parse(`
        Proceso Test
          Segun x Hacer
            1:
              Escribir "uno";
            2, 3:
              Escribir "dos o tres";
            De Otro Modo:
              Escribir "otro";
          FinSegun
        FinProceso
      `);

      const switchNode = ast.body[0] as SwitchNode;
      expect(switchNode.kind).toBe("switch");
      expect(switchNode.cases).toHaveLength(2);

      // First case: 1
      expect(switchNode.cases[0].values).toHaveLength(1);
      expect(switchNode.cases[0].body).toHaveLength(1);

      // Second case: 2, 3
      expect(switchNode.cases[1].values).toHaveLength(2);
      expect(switchNode.cases[1].body).toHaveLength(1);

      // Default case
      expect(switchNode.defaultCase).toHaveLength(1);
    });
  });

  describe("Repetir...Hasta Que", () => {
    it("parsea ciclo Repetir", () => {
      const ast = parse(`
        Proceso Test
          Repetir
            Escribir "hola";
          Hasta Que x > 10
        FinProceso
      `);

      const repeat = ast.body[0] as RepeatNode;
      expect(repeat.kind).toBe("repeat");
      expect(repeat.body).toHaveLength(1);
      expect(repeat.condition.kind).toBe("binary_expression");
    });
  });

  describe("Mientras...Hacer...FinMientras", () => {
    it("parsea ciclo Mientras", () => {
      const ast = parse(`
        Proceso Test
          Mientras x < 10 Hacer
            x <- x + 1;
          FinMientras
        FinProceso
      `);

      const whileNode = ast.body[0] as WhileNode;
      expect(whileNode.kind).toBe("while");
      expect(whileNode.body).toHaveLength(1);
      expect(whileNode.condition.kind).toBe("binary_expression");
    });
  });

  describe("Escribir Sin Saltar", () => {
    it("parsea con newline=false", () => {
      const ast = parse(`
        Proceso Test
          Escribir Sin Saltar "hola";
        FinProceso
      `);

      const write = ast.body[0] as WriteNode;
      expect(write.kind).toBe("write");
      expect(write.newline).toBe(false);
      expect(write.expressions).toHaveLength(1);
    });
  });

  describe("Leer", () => {
    it("parsea Leer con múltiples variables", () => {
      const ast = parse(`
        Proceso Test
          Leer a, b, c;
        FinProceso
      `);

      const read = ast.body[0] as ReadNode;
      expect(read.kind).toBe("read");
      expect(read.variables).toEqual(["a", "b", "c"]);
    });
  });

  describe("Dimension", () => {
    it("parsea declaración de arreglo", () => {
      const ast = parse(`
        Proceso Test
          Dimension arr[10];
        FinProceso
      `);

      const dim = ast.body[0] as DimensionNode;
      expect(dim.kind).toBe("dimension");
      expect(dim.name).toBe("arr");
      expect(dim.size.kind).toBe("number_literal");
    });
  });

  describe("asignación de arreglo", () => {
    it("parsea arr[1] <- 10", () => {
      const ast = parse(`
        Proceso Test
          arr[1] <- 10;
        FinProceso
      `);

      const arrayAssign = ast.body[0] as ArrayAssignNode;
      expect(arrayAssign.kind).toBe("array_assign");
      expect(arrayAssign.name).toBe("arr");
      expect(arrayAssign.index.kind).toBe("number_literal");
      expect(arrayAssign.value.kind).toBe("number_literal");
    });
  });

  describe("llamada a función en expresión", () => {
    it("parsea RC(25) como FunctionCallNode", () => {
      const ast = parse(`
        Proceso Test
          x <- RC(25);
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const call = assign.value as FunctionCallNode;
      expect(call.kind).toBe("function_call");
      expect(call.name).toBe("RC");
      expect(call.args).toHaveLength(1);
      expect(call.args[0].kind).toBe("number_literal");
    });
  });

  describe("semicolons opcionales", () => {
    it("parsea sin punto y coma", () => {
      const ast = parse(`
        Proceso Test
          x <- 5
          Escribir x
        FinProceso
      `);

      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].kind).toBe("assign");
      expect(ast.body[1].kind).toBe("write");
    });
  });

  describe("potencia (right-associative)", () => {
    it("2 ^ 3 ^ 2 se asocia a la derecha: 2 ^ (3 ^ 2)", () => {
      const ast = parse(`
        Proceso Test
          x <- 2 ^ 3 ^ 2;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const expr = assign.value as BinaryExpressionNode;

      expect(expr.operator).toBe("^");
      expect(expr.left.kind).toBe("number_literal");
      if (expr.left.kind === "number_literal") {
        expect(expr.left.value).toBe(2);
      }

      // Right side should be 3 ^ 2
      expect(expr.right.kind).toBe("binary_expression");
      if (expr.right.kind === "binary_expression") {
        expect(expr.right.operator).toBe("^");
        if (expr.right.left.kind === "number_literal") {
          expect(expr.right.left.value).toBe(3);
        }
        if (expr.right.right.kind === "number_literal") {
          expect(expr.right.right.value).toBe(2);
        }
      }
    });
  });

  describe("expresiones con paréntesis", () => {
    it("(2 + 3) * 4 respeta paréntesis", () => {
      const ast = parse(`
        Proceso Test
          x <- (2 + 3) * 4;
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const expr = assign.value as BinaryExpressionNode;
      expect(expr.operator).toBe("*");
      expect(expr.left.kind).toBe("binary_expression");
      if (expr.left.kind === "binary_expression") {
        expect(expr.left.operator).toBe("+");
      }
    });
  });

  describe("Si con SiNo", () => {
    it("parsea ambas ramas", () => {
      const ast = parse(`
        Proceso Test
          Si x > 0 Entonces
            Escribir "positivo";
          SiNo
            Escribir "no positivo";
          FinSi
        FinProceso
      `);

      const ifNode = ast.body[0] as IfNode;
      expect(ifNode.kind).toBe("if");
      expect(ifNode.thenBranch).toHaveLength(1);
      expect(ifNode.elseBranch).toHaveLength(1);
    });
  });

  describe("función con múltiples argumentos", () => {
    it("parsea función con 2 argumentos", () => {
      const ast = parse(`
        Proceso Test
          x <- AZAR(1, 100);
        FinProceso
      `);

      const assign = ast.body[0] as AssignNode;
      const call = assign.value as FunctionCallNode;
      expect(call.kind).toBe("function_call");
      expect(call.name).toBe("AZAR");
      expect(call.args).toHaveLength(2);
    });
  });
});
