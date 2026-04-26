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
  it("set en RefCell de slot se propaga al elemento del arreglo", () => {
    const env = new Environment();
    env.define("arr", "Entero");
    env.dimensionArray("arr", 5, 1);
    env.setArray("arr", 1, 10, 1);

    const ref = env.refToArraySlot("arr", 1, 1);
    expect(ref.get()).toBe(10);
    ref.set(99, 1);
    expect(env.getArray("arr", 1, 1)).toBe(99);
  });

  it("RefCell a arreglo inexistente lanza error", () => {
    const env = new Environment();
    expect(() => env.refToArraySlot("nope", 1, 1)).toThrow(PSeIntError);
  });

  it("RefCell a slot fuera de rango lanza error en bind", () => {
    const env = new Environment();
    env.define("arr", "Entero");
    env.dimensionArray("arr", 3, 1);
    expect(() => env.refToArraySlot("arr", 10, 1)).toThrow(PSeIntError);
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
