import { describe, it, expect } from "vitest";
import { MockIO, run } from "./helpers";
import { PSeIntError } from "../errors";
import { Lexer } from "../lexer";
import { Parser } from "../parser";

describe("Edge Cases", () => {
  // ── Empty/Minimal Programs ─────────────────────────────────────────

  describe("Empty/Minimal Programs", () => {
    it("programa vacío con Proceso no produce salida", async () => {
      const io = await run(`
        Proceso Vacio
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("");
    });

    it("programa vacío con Algoritmo no produce salida", async () => {
      const io = await run(`
        Algoritmo Vacio
        FinAlgoritmo
      `);
      expect(io.getFullOutput()).toBe("");
    });
  });

  // ── String Edge Cases ──────────────────────────────────────────────

  describe("String Edge Cases", () => {
    it("cadena vacía produce solo salto de línea", async () => {
      const io = await run(`
        Proceso Test
          Escribir "";
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("\n");
    });

    it("cadena con caracteres especiales en español (UTF-8)", async () => {
      const io = await run(`
        Proceso Test
          Escribir "año ñoño café";
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("año ñoño café\n");
    });

    it("concatenación de cadenas con operador +", async () => {
      const io = await run(`
        Proceso Test
          Escribir "Hola" + " " + "Mundo";
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("Hola Mundo\n");
    });
  });

  // ── Numeric Edge Cases ─────────────────────────────────────────────

  describe("Numeric Edge Cases", () => {
    it("números negativos en expresiones", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Entero;
          x <- -5;
          Escribir x;
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("-5\n");
    });

    it("números grandes", async () => {
      const io = await run(`
        Proceso Test
          Escribir 999999999;
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("999999999\n");
    });

    it("precisión de punto flotante (0.1 + 0.2)", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Real;
          x <- 0.1 + 0.2;
          Escribir x;
        FinProceso
      `);
      // JS float behavior: 0.1 + 0.2 = 0.30000000000000004
      const output = io.getFullOutput();
      expect(output).toContain("0.3");
      expect(output).toMatch(/^0\.3/);
    });

    it("división produce Real", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Real;
          x <- 10 / 3;
          Escribir x;
        FinProceso
      `);
      const output = io.getFullOutput();
      expect(output).toContain("3.3333");
    });
  });

  // ── Array Edge Cases ───────────────────────────────────────────────

  describe("Array Edge Cases", () => {
    it("arreglo de tamaño 1", async () => {
      const io = await run(`
        Proceso Test
          Dimension arr[1];
          arr[1] <- 42;
          Escribir arr[1];
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("42\n");
    });

    it("índice 0 en arreglo (inválido, base-1) lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Dimension arr[3];
            arr[0] <- 1;
          FinProceso
        `)
      ).rejects.toThrow(PSeIntError);
      await expect(
        run(`
          Proceso Test
            Dimension arr[3];
            arr[0] <- 1;
          FinProceso
        `)
      ).rejects.toThrow("fuera de rango");
    });

    it("índice negativo en arreglo lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Dimension arr[3];
            arr[-1] <- 1;
          FinProceso
        `)
      ).rejects.toThrow(PSeIntError);
      await expect(
        run(`
          Proceso Test
            Dimension arr[3];
            arr[-1] <- 1;
          FinProceso
        `)
      ).rejects.toThrow("fuera de rango");
    });
  });

  // ── Control Flow Edge Cases ────────────────────────────────────────

  describe("Control Flow Edge Cases", () => {
    it("Si sin SiNo (rama falsa) no produce salida", async () => {
      const io = await run(`
        Proceso Test
          Si Falso Entonces
            Escribir "no";
          FinSi
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("");
    });

    it("Para que no ejecuta (from > to con paso positivo)", async () => {
      const io = await run(`
        Proceso Test
          Definir i Como Entero;
          Para i <- 10 Hasta 1 Con Paso 1 Hacer
            Escribir i;
          FinPara
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("");
    });

    it("Para contando hacia abajo con paso negativo", async () => {
      const io = await run(`
        Proceso Test
          Definir i Como Entero;
          Para i <- 3 Hasta 1 Con Paso -1 Hacer
            Escribir i;
          FinPara
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("3\n2\n1\n");
    });

    it("Mientras que nunca entra (condición falsa)", async () => {
      const io = await run(`
        Proceso Test
          Mientras Falso Hacer
            Escribir "no";
          FinMientras
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("");
    });

    it("Repetir que sale inmediatamente", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Logico;
          x <- Verdadero;
          Repetir
            Escribir "una vez";
          Hasta Que x
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("una vez\n");
    });

    it("estructuras profundamente anidadas (Si dentro de Para dentro de Mientras)", async () => {
      const io = await run(`
        Proceso Test
          Definir i, n Como Entero;
          n <- 1;
          Mientras n <= 2 Hacer
            Para i <- 1 Hasta 2 Hacer
              Si i = 1 Entonces
                Escribir n * 10 + i;
              FinSi
            FinPara
            n <- n + 1;
          FinMientras
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("11\n21\n");
    });
  });

  // ── Built-in Function Edge Cases ───────────────────────────────────

  describe("Built-in Function Edge Cases", () => {
    it("RC de 0 retorna 0", async () => {
      const io = await run(`
        Proceso Test
          Escribir RC(0);
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("0\n");
    });

    it("RC de número negativo lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Escribir RC(-1);
          FinProceso
        `)
      ).rejects.toThrow(PSeIntError);
    });

    it("Abs de número negativo", async () => {
      const io = await run(`
        Proceso Test
          Escribir Abs(-42);
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("42\n");
    });

    it("Longitud de cadena vacía retorna 0", async () => {
      const io = await run(`
        Proceso Test
          Escribir Longitud("");
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("0\n");
    });

    it("Subcadena en los límites exactos", async () => {
      const io = await run(`
        Proceso Test
          Escribir Subcadena("ABC", 1, 3);
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("ABC\n");
    });

    it("Trunc de flotante negativo (hacia cero)", async () => {
      const io = await run(`
        Proceso Test
          Escribir Trunc(-3.7);
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("-3\n");
    });

    it("Redon redondea correctamente", async () => {
      const io = await run(`
        Proceso Test
          Escribir Redon(2.5);
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("3\n");
    });

    it("Mayusculas y Minusculas", async () => {
      const io = await run(`
        Proceso Test
          Escribir Mayusculas("hola");
          Escribir Minusculas("HOLA");
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("HOLA\nhola\n");
    });
  });

  // ── Error Cases ────────────────────────────────────────────────────

  describe("Error Cases", () => {
    it("Definir duplicado permite redefinición (override)", async () => {
      // Environment.define() just overwrites — no error
      const io = await run(`
        Proceso Test
          Definir x Como Entero;
          x <- 42;
          Definir x Como Real;
          x <- 3.14;
          Escribir x;
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("3.14\n");
    });

    it("Escribir variable no definida lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Escribir x;
          FinProceso
        `)
      ).rejects.toThrow(PSeIntError);
      await expect(
        run(`
          Proceso Test
            Escribir x;
          FinProceso
        `)
      ).rejects.toThrow("no definida");
    });

    it("cantidad incorrecta de argumentos en función builtin lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Escribir RC(1, 2);
          FinProceso
        `)
      ).rejects.toThrow("espera 1 argumento(s)");
    });

    it("división por cero lanza error", async () => {
      await expect(
        run(`
          Proceso Test
            Escribir 5 / 0;
          FinProceso
        `)
      ).rejects.toThrow("División por cero");
    });

    it("Leer cancelado lanza error", async () => {
      await expect(
        run(
          `
          Proceso Test
            Definir x Como Entero;
            Leer x;
          FinProceso
        `,
          [undefined]
        )
      ).rejects.toThrow("cancelada");
    });
  });

  // ── Segun Edge Cases ───────────────────────────────────────────────

  describe("Segun Edge Cases", () => {
    it("Segun sin caso coincidente y sin De Otro Modo no produce salida", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Entero;
          x <- 99;
          Segun x Hacer
            1:
              Escribir "uno";
            2:
              Escribir "dos";
          FinSegun
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("");
    });

    it("Segun con múltiples valores por caso", async () => {
      const io = await run(`
        Proceso Test
          Definir x Como Entero;
          x <- 2;
          Segun x Hacer
            1, 2, 3:
              Escribir "encontrado";
            De Otro Modo:
              Escribir "no encontrado";
          FinSegun
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("encontrado\n");
    });
  });

  // ── Multiple Escribir Expressions ──────────────────────────────────

  describe("Multiple Escribir Expressions", () => {
    it("Escribir con múltiples cadenas las concatena sin espacios", async () => {
      const io = await run(`
        Proceso Test
          Escribir "a", "b", "c";
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("abc\n");
    });
  });

  // ── Comments ───────────────────────────────────────────────────────

  describe("Comments", () => {
    it("comentarios de línea son ignorados", async () => {
      const io = await run(`
        Proceso Test
          // esto es un comentario
          Escribir "ok";
        FinProceso
      `);
      expect(io.getFullOutput()).toBe("ok\n");
    });
  });
});
