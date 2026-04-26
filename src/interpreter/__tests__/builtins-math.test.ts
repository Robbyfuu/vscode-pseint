import { describe, it, expect } from "vitest";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { Interpreter } from "../interpreter";
import type { InterpreterIO } from "../interpreter";
import { PSeIntError } from "../errors";
import { run } from "./helpers";

// Helper local: ejecuta y devuelve la última línea (sin "\n")
async function runOut(source: string): Promise<string> {
  const io = await run(source);
  return io.getFullOutput();
}

describe("Builtins matemáticos extendidos", () => {
  describe("trigonometría directa", () => {
    it("sen(0) = 0", async () => {
      const out = await runOut(`
        Proceso T
          Escribir sen(0);
        FinProceso
      `);
      expect(out.trim()).toBe("0");
    });

    it("cos(0) = 1", async () => {
      const out = await runOut(`
        Proceso T
          Escribir cos(0);
        FinProceso
      `);
      expect(out.trim()).toBe("1");
    });

    it("tan(0) = 0", async () => {
      const out = await runOut(`
        Proceso T
          Escribir tan(0);
        FinProceso
      `);
      expect(out.trim()).toBe("0");
    });
  });

  describe("trigonometría inversa", () => {
    it("asen(1) ≈ pi/2", async () => {
      const io = await run(`
        Proceso T
          Escribir asen(1);
        FinProceso
      `);
      const v = parseFloat(io.getFullOutput().trim());
      expect(v).toBeCloseTo(Math.PI / 2, 10);
    });

    it("acos(0) ≈ pi/2", async () => {
      const io = await run(`
        Proceso T
          Escribir acos(0);
        FinProceso
      `);
      const v = parseFloat(io.getFullOutput().trim());
      expect(v).toBeCloseTo(Math.PI / 2, 10);
    });

    it("atan(1) ≈ pi/4", async () => {
      const io = await run(`
        Proceso T
          Escribir atan(1);
        FinProceso
      `);
      const v = parseFloat(io.getFullOutput().trim());
      expect(v).toBeCloseTo(Math.PI / 4, 10);
    });

    it("asen(2) lanza error en español (rango [-1, 1])", async () => {
      await expect(
        run(`
          Proceso T
            Escribir asen(2);
          FinProceso
        `)
      ).rejects.toThrow(/\[-1, 1\]/);
    });

    it("acos(-2) lanza error", async () => {
      await expect(
        run(`
          Proceso T
            Escribir acos(-2);
          FinProceso
        `)
      ).rejects.toThrow(PSeIntError);
    });
  });

  describe("logaritmos y exponencial", () => {
    it("ln(1) = 0", async () => {
      const out = await runOut(`
        Proceso T
          Escribir ln(1);
        FinProceso
      `);
      expect(out.trim()).toBe("0");
    });

    it("ln(e) ≈ 1 (usando exp(1) como fuente de e)", async () => {
      const io = await run(`
        Proceso T
          Escribir ln(exp(1));
        FinProceso
      `);
      const v = parseFloat(io.getFullOutput().trim());
      expect(v).toBeCloseTo(1, 10);
    });

    it("exp(0) = 1", async () => {
      const out = await runOut(`
        Proceso T
          Escribir exp(0);
        FinProceso
      `);
      expect(out.trim()).toBe("1");
    });

    it("log(100) = 2", async () => {
      const out = await runOut(`
        Proceso T
          Escribir log(100);
        FinProceso
      `);
      expect(out.trim()).toBe("2");
    });

    it("ln(0) lanza error en español", async () => {
      await expect(
        run(`
          Proceso T
            Escribir ln(0);
          FinProceso
        `)
      ).rejects.toThrow(/positivo/);
    });

    it("log(-1) lanza error", async () => {
      await expect(
        run(`
          Proceso T
            Escribir log(-1);
          FinProceso
        `)
      ).rejects.toThrow(/positivo/);
    });
  });

  describe("pot (potencia)", () => {
    it("pot(2, 10) = 1024", async () => {
      const out = await runOut(`
        Proceso T
          Escribir pot(2, 10);
        FinProceso
      `);
      expect(out.trim()).toBe("1024");
    });

    it("pot(1) lanza error de aridad", async () => {
      await expect(
        run(`
          Proceso T
            Escribir pot(1);
          FinProceso
        `)
      ).rejects.toThrow(/espera 2 argumento\(s\)/);
    });
  });
});

describe("Constante pi predefinida", () => {
  it("pi está disponible como Math.PI sin definirla", async () => {
    const io = await run(`
      Proceso T
        Escribir pi;
      FinProceso
    `);
    expect(io.getFullOutput().trim()).toBe(String(Math.PI));
  });

  it("pi es case-insensitive (Pi, PI)", async () => {
    const io = await run(`
      Proceso T
        Escribir Pi;
        Escribir PI;
      FinProceso
    `);
    const lines = io.getFullOutput().trim().split("\n");
    expect(lines[0]).toBe(String(Math.PI));
    expect(lines[1]).toBe(String(Math.PI));
  });
});

describe("Statements de control de salida", () => {
  // IO mock que captura clear() y waitForKey()
  function makeIO() {
    const calls: string[] = [];
    const io: InterpreterIO = {
      write: (text: string) => {
        calls.push(`write:${text}`);
      },
      read: async (_p: string) => undefined,
      clear: () => {
        calls.push("clear");
      },
      waitForKey: async () => {
        calls.push("waitForKey");
      },
    };
    return { io, calls };
  }

  async function execute(source: string, io: InterpreterIO): Promise<void> {
    const tokens = new Lexer(source).tokenize();
    const program = new Parser(tokens).parse();
    const interpreter = new Interpreter(io);
    await interpreter.execute(program);
  }

  it("Limpiar Pantalla invoca io.clear()", async () => {
    const { io, calls } = makeIO();
    await execute(
      `
      Proceso T
        Escribir "antes";
        Limpiar Pantalla;
        Escribir "despues";
      FinProceso
    `,
      io
    );
    expect(calls).toEqual([
      "write:antes\n",
      "clear",
      "write:despues\n",
    ]);
  });

  it("Borrar Pantalla también invoca io.clear() (alias)", async () => {
    const { io, calls } = makeIO();
    await execute(
      `
      Proceso T
        Borrar Pantalla;
      FinProceso
    `,
      io
    );
    expect(calls).toContain("clear");
  });

  it("Esperar Tecla invoca io.waitForKey()", async () => {
    const { io, calls } = makeIO();
    await execute(
      `
      Proceso T
        Esperar Tecla;
      FinProceso
    `,
      io
    );
    expect(calls).toContain("waitForKey");
  });

  it("Limpiar Pantalla con MockIO sin clear() no rompe (método opcional)", async () => {
    // MockIO no implementa clear() — debe ser no-op
    const io = await run(`
      Proceso T
        Limpiar Pantalla;
        Escribir "ok";
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("ok\n");
  });

  it("Esperar 0 Segundos resuelve rápido", async () => {
    const start = Date.now();
    await run(`
      Proceso T
        Esperar 0 Segundos;
        Escribir "ok";
      FinProceso
    `);
    expect(Date.now() - start).toBeLessThan(100);
  });

  it("Esperar negativo lanza error", async () => {
    await expect(
      run(`
        Proceso T
          Esperar -1 Segundos;
        FinProceso
      `)
    ).rejects.toThrow(/no negativo/);
  });
});
