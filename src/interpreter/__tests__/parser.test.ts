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
  SubProcDeclNode,
  CallStatementNode,
  ReturnNode,
  ClearScreenNode,
  WaitKeyNode,
  WaitSecondsNode,
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

  describe("declaración de SubProceso (sin retorno)", () => {
    it("parsea SubProceso simple sin retorno y sin parámetros", () => {
      const ast = parse(`
        Proceso Main
          saludar();
        FinProceso

        SubProceso saludar()
          Escribir "Hola";
        FinSubProceso
      `);

      expect(ast.subprograms).toHaveLength(1);
      const sp = ast.subprograms[0] as SubProcDeclNode;
      expect(sp.kind).toBe("subproc_decl");
      expect(sp.name).toBe("saludar");
      expect(sp.returnVar).toBeNull();
      expect(sp.params).toHaveLength(0);
      expect(sp.body).toHaveLength(1);
    });

    it("parsea SubProceso con parámetro Por Valor implícito", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso saludar(nombre)
          Escribir "Hola ", nombre;
        FinSubProceso
      `);

      const sp = ast.subprograms[0];
      expect(sp.params).toHaveLength(1);
      expect(sp.params[0].name).toBe("nombre");
      expect(sp.params[0].mode).toBe("value");
    });
  });

  describe("declaración de Funcion (con retorno)", () => {
    it("parsea Funcion con retVar y un parámetro", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        Funcion res <- doble(x)
          res <- x * 2;
        FinFuncion
      `);

      expect(ast.subprograms).toHaveLength(1);
      const fn = ast.subprograms[0];
      expect(fn.name).toBe("doble");
      expect(fn.returnVar).toBe("res");
      expect(fn.params).toHaveLength(1);
      expect(fn.params[0].name).toBe("x");
      expect(fn.params[0].mode).toBe("value");
    });

    it("parsea Funcion con tipo declarado en parámetro y retorno", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        Funcion r <- suma(a Por Valor, b Por Valor) Como Real
          r <- a + b;
        FinFuncion
      `);

      const fn = ast.subprograms[0];
      expect(fn.params).toHaveLength(2);
      expect(fn.params[0].mode).toBe("value");
      expect(fn.params[1].mode).toBe("value");
    });
  });

  describe("subprogramas: top-level fan-out", () => {
    it("admite SubProceso ANTES de Proceso", () => {
      const ast = parse(`
        SubProceso saludar()
          Escribir "Hola";
        FinSubProceso

        Proceso Main
          saludar();
        FinProceso
      `);

      expect(ast.subprograms).toHaveLength(1);
      expect(ast.subprograms[0].name).toBe("saludar");
      expect(ast.body).toHaveLength(1);
    });

    it("admite SubProcesos antes Y después del Proceso", () => {
      const ast = parse(`
        SubProceso primera()
          Escribir "1";
        FinSubProceso

        Proceso Main
          primera();
          segunda();
        FinProceso

        SubProceso segunda()
          Escribir "2";
        FinSubProceso
      `);

      expect(ast.subprograms).toHaveLength(2);
      const names = ast.subprograms.map((s) => s.name).sort();
      expect(names).toEqual(["primera", "segunda"]);
    });
  });

  describe("CallStatementNode vs AssignNode", () => {
    it("identificador seguido de '(' produce call_stmt, no assign", () => {
      const ast = parse(`
        Proceso Main
          saludar();
        FinProceso

        SubProceso saludar()
          Escribir "Hola";
        FinSubProceso
      `);

      const stmt = ast.body[0] as CallStatementNode;
      expect(stmt.kind).toBe("call_stmt");
      expect(stmt.name).toBe("saludar");
      expect(stmt.args).toHaveLength(0);
    });

    it("call_stmt con argumentos", () => {
      const ast = parse(`
        Proceso Main
          saludar("mundo", 42);
        FinProceso
      `);

      const stmt = ast.body[0] as CallStatementNode;
      expect(stmt.kind).toBe("call_stmt");
      expect(stmt.name).toBe("saludar");
      expect(stmt.args).toHaveLength(2);
    });

    it("identificador seguido de '<-' produce assign (no call_stmt)", () => {
      const ast = parse(`
        Proceso Main
          x <- 5;
        FinProceso
      `);

      const stmt = ast.body[0] as AssignNode;
      expect(stmt.kind).toBe("assign");
      expect(stmt.target).toBe("x");
    });
  });

  describe("Retornar", () => {
    it("Retornar con expresión genera ReturnNode con value", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        Funcion r <- f()
          Retornar 5;
        FinFuncion
      `);

      const ret = ast.subprograms[0].body[0] as ReturnNode;
      expect(ret.kind).toBe("return");
      expect(ret.value).not.toBeNull();
      expect(ret.value!.kind).toBe("number_literal");
    });

    it("Retornar sin expresión genera ReturnNode con value=null", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso s()
          Retornar;
        FinSubProceso
      `);

      const ret = ast.subprograms[0].body[0] as ReturnNode;
      expect(ret.kind).toBe("return");
      expect(ret.value).toBeNull();
    });
  });

  describe("parseParams (modos y tipos)", () => {
    it("parámetros sin modificador → mode value", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso s(a, b, c)
        FinSubProceso
      `);

      const params = ast.subprograms[0].params;
      expect(params).toHaveLength(3);
      expect(params.every((p) => p.mode === "value")).toBe(true);
    });

    it("Por Valor explícito", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso s(x Por Valor)
        FinSubProceso
      `);

      expect(ast.subprograms[0].params[0].mode).toBe("value");
    });

    it("Por Referencia explícito", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso s(x Por Referencia)
        FinSubProceso
      `);

      expect(ast.subprograms[0].params[0].mode).toBe("ref");
    });

    it("mezcla de modos", () => {
      const ast = parse(`
        Proceso Main
        FinProceso

        SubProceso s(a Por Valor, b Por Referencia, c)
        FinSubProceso
      `);

      const params = ast.subprograms[0].params;
      expect(params[0].mode).toBe("value");
      expect(params[1].mode).toBe("ref");
      expect(params[2].mode).toBe("value");
    });
  });

  describe("statements extendidas (Limpiar Pantalla / Esperar)", () => {
    it("parsea Limpiar Pantalla como ClearScreenNode", () => {
      const ast = parse(`
        Proceso Test
          Limpiar Pantalla;
        FinProceso
      `);

      expect(ast.body).toHaveLength(1);
      const node = ast.body[0] as ClearScreenNode;
      expect(node.kind).toBe("clear_screen");
    });

    it("parsea Borrar Pantalla como ClearScreenNode (alias)", () => {
      const ast = parse(`
        Proceso Test
          Borrar Pantalla
        FinProceso
      `);

      const node = ast.body[0] as ClearScreenNode;
      expect(node.kind).toBe("clear_screen");
    });

    it("parsea Esperar Tecla como WaitKeyNode (sin punto y coma)", () => {
      const ast = parse(`
        Proceso Test
          Esperar Tecla
        FinProceso
      `);

      const node = ast.body[0] as WaitKeyNode;
      expect(node.kind).toBe("wait_key");
    });

    it("parsea Esperar 5 Segundos como WaitSecondsNode", () => {
      const ast = parse(`
        Proceso Test
          Esperar 5 Segundos;
        FinProceso
      `);

      const node = ast.body[0] as WaitSecondsNode;
      expect(node.kind).toBe("wait_seconds");
      expect(node.seconds.kind).toBe("number_literal");
      if (node.seconds.kind === "number_literal") {
        expect(node.seconds.value).toBe(5);
      }
    });

    it("parsea Esperar con expresión arbitraria Segundos", () => {
      const ast = parse(`
        Proceso Test
          Esperar 1 + 2 Segundos
        FinProceso
      `);

      const node = ast.body[0] as WaitSecondsNode;
      expect(node.kind).toBe("wait_seconds");
      expect(node.seconds.kind).toBe("binary_expression");
    });

    it("Esperar sin Segundos lanza error de parseo", () => {
      expect(() =>
        parse(`
          Proceso Test
            Esperar 5;
          FinProceso
        `)
      ).toThrow(PSeIntError);
    });
  });
});
