import { describe, it, expect } from "vitest";
import { Environment, SubProgRegistry } from "../environment";
import { PSeIntError } from "../errors";
import type { SubProcDeclNode } from "../ast";

function makeDecl(name: string): SubProcDeclNode {
  return {
    kind: "subproc_decl",
    name,
    returnVar: null,
    params: [],
    body: [],
    line: 1,
  };
}

describe("Environment - Frame stack", () => {
  it("aísla variables entre frames (push/pop)", () => {
    const env = new Environment();
    env.define("x", "Entero");
    env.set("x", 10, 1);
    expect(env.get("x", 1)).toBe(10);

    env.pushFrame();
    expect(env.isDefined("x")).toBe(false);
    env.define("x", "Entero");
    env.set("x", 99, 1);
    expect(env.get("x", 1)).toBe(99);

    env.popFrame();
    expect(env.get("x", 1)).toBe(10);
  });

  it("variables del frame nuevo no fugan al frame anterior", () => {
    const env = new Environment();
    env.pushFrame();
    env.define("y", "Entero");
    env.set("y", 5, 1);
    env.popFrame();

    expect(env.isDefined("y")).toBe(false);
  });
});

describe("Environment - RefCell to variable", () => {
  it("set en RefCell se propaga al slot original", () => {
    const env = new Environment();
    env.define("a", "Entero");
    env.set("a", 1, 1);

    const ref = env.refToVariable("a", 1);
    expect(ref.get()).toBe(1);
    ref.set(42, 1);
    expect(env.get("a", 1)).toBe(42);
  });

  it("RefCell a variable inexistente lanza error", () => {
    const env = new Environment();
    expect(() => env.refToVariable("nope", 1)).toThrow(PSeIntError);
  });

  it("la RefCell sigue apuntando al frame original tras un push", () => {
    const env = new Environment();
    env.define("a", "Entero");
    env.set("a", 7, 1);
    const ref = env.refToVariable("a", 1);

    env.pushFrame();
    ref.set(123, 1);
    env.popFrame();

    expect(env.get("a", 1)).toBe(123);
  });
});

describe("Environment - RefCell to array slot", () => {
  it("set en RefCell de slot se propaga al elemento del arreglo (1D)", () => {
    const env = new Environment();
    env.define("arr", "Entero");
    env.dimensionArray("arr", [5], 1);
    env.setArray("arr", [1], 10, 1);

    const ref = env.refToArraySlot("arr", [1], 1);
    expect(ref.get()).toBe(10);
    ref.set(99, 1);
    expect(env.getArray("arr", [1], 1)).toBe(99);
  });

  it("RefCell a arreglo inexistente lanza error", () => {
    const env = new Environment();
    expect(() => env.refToArraySlot("nope", [1], 1)).toThrow(PSeIntError);
  });

  it("RefCell a slot fuera de rango lanza error en bind", () => {
    const env = new Environment();
    env.define("arr", "Entero");
    env.dimensionArray("arr", [3], 1);
    expect(() => env.refToArraySlot("arr", [10], 1)).toThrow(PSeIntError);
  });

  it("RefCell sobrevive a re-Dimension (captura por (frame, name, indices), no por referencia directa al ArrayData)", () => {
    const env = new Environment();
    env.define("arr", "Entero");
    env.dimensionArray("arr", [3], 1);
    env.setArray("arr", [1], 100, 1);

    const ref = env.refToArraySlot("arr", [1], 1);
    expect(ref.get()).toBe(100);

    // Re-dimensionar el mismo arreglo: reemplaza el ArrayData en el Map.
    env.dimensionArray("arr", [5], 1);
    // El ref debe leer desde el ArrayData NUEVO, no desde el viejo (que tenía 100).
    expect(ref.get()).toBe(0);
    ref.set(42, 1);
    expect(env.getArray("arr", [1], 1)).toBe(42);
  });
});

describe("Environment - matrices 2D", () => {
  it("dimensionArray con [3, 4] crea storage plano de 12 elementos", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);
    const data = env.current().getArrayData("m");
    expect(data).toBeDefined();
    expect(data!.dims).toEqual([3, 4]);
    expect(data!.elements).toHaveLength(12);
  });

  it("setArray y getArray con índices [i, j] (row-major)", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);

    env.setArray("m", [2, 3], 99, 1);
    expect(env.getArray("m", [2, 3], 1)).toBe(99);
    // Otro slot sigue siendo el default (0 para Entero)
    expect(env.getArray("m", [1, 1], 1)).toBe(0);
  });

  it("flat-index row-major: [1,1]=0, [1,2]=1, [2,1]=4 en una 3x4", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);

    env.setArray("m", [1, 1], 11, 1);
    env.setArray("m", [1, 2], 12, 1);
    env.setArray("m", [2, 1], 21, 1);
    const data = env.current().getArrayData("m")!;
    expect(data.elements[0]).toBe(11);
    expect(data.elements[1]).toBe(12);
    expect(data.elements[4]).toBe(21);
  });

  it("getArray con índice fuera de rango por dimensión lanza error en español", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);

    expect(() => env.getArray("m", [5, 1], 1)).toThrow(/fuera de rango/);
    expect(() => env.getArray("m", [1, 5], 1)).toThrow(/fuera de rango/);
  });

  it("getArray con número incorrecto de índices lanza error", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);

    expect(() => env.getArray("m", [1], 1)).toThrow(/2 dimensión/);
    expect(() => env.getArray("m", [1, 2, 3], 1)).toThrow(/2 dimensión/);
  });

  it("dimensionArray rechaza dimensión <= 0 con error en español", () => {
    const env = new Environment();
    env.define("m", "Entero");
    expect(() => env.dimensionArray("m", [3, 0], 1)).toThrow(/entero positivo/);
    expect(() => env.dimensionArray("m", [-1, 4], 1)).toThrow(/entero positivo/);
  });

  it("dimensionArray rechaza dimensión no entera", () => {
    const env = new Environment();
    env.define("m", "Entero");
    expect(() => env.dimensionArray("m", [2.5, 4], 1)).toThrow(/entero positivo/);
  });

  it("refToArraySlot 2D bind y mutación del slot correcto", () => {
    const env = new Environment();
    env.define("m", "Entero");
    env.dimensionArray("m", [3, 4], 1);

    const ref = env.refToArraySlot("m", [2, 3], 1);
    ref.set(777, 1);
    expect(env.getArray("m", [2, 3], 1)).toBe(777);
  });
});

describe("Environment - cubos 3D", () => {
  it("dimensionArray con [2, 3, 4] crea 24 elementos", () => {
    const env = new Environment();
    env.define("cubo", "Entero");
    env.dimensionArray("cubo", [2, 3, 4], 1);
    const data = env.current().getArrayData("cubo");
    expect(data!.dims).toEqual([2, 3, 4]);
    expect(data!.elements).toHaveLength(24);
  });

  it("set/get 3D con índices [i, j, k]", () => {
    const env = new Environment();
    env.define("cubo", "Entero");
    env.dimensionArray("cubo", [2, 3, 4], 1);
    env.setArray("cubo", [2, 3, 4], 999, 1);
    expect(env.getArray("cubo", [2, 3, 4], 1)).toBe(999);
    expect(env.getArray("cubo", [1, 1, 1], 1)).toBe(0);
  });
});

describe("SubProgRegistry", () => {
  it("registra y resuelve una declaración (case-insensitive)", () => {
    const reg = new SubProgRegistry();
    reg.register(makeDecl("saludar"));

    expect(reg.lookup("saludar")).toBeDefined();
    expect(reg.lookup("SALUDAR")).toBeDefined();
    expect(reg.lookup("Saludar")).toBeDefined();
  });

  it("lookup de nombre desconocido devuelve undefined", () => {
    const reg = new SubProgRegistry();
    expect(reg.lookup("ninguno")).toBeUndefined();
  });

  it("registrar un nombre duplicado lanza PSeIntError", () => {
    const reg = new SubProgRegistry();
    reg.register(makeDecl("dup"));
    expect(() => reg.register(makeDecl("dup"))).toThrow(PSeIntError);
    expect(() => reg.register(makeDecl("DUP"))).toThrow(PSeIntError);
  });
});
