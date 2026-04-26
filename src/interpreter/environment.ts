import { PSeIntError } from "./errors";
import type { SubProcDeclNode } from "./ast";

export type PSeIntType = "Entero" | "Real" | "Cadena" | "Logico" | "Caracter";
export type PSeIntValue = number | string | boolean;

const TYPE_MAP: Record<string, PSeIntType> = {
  entero: "Entero",
  real: "Real",
  cadena: "Cadena",
  logico: "Logico",
  caracter: "Caracter",
};

export function normalizePSeIntType(type: string): PSeIntType {
  const normalized = TYPE_MAP[type.toLowerCase()];
  if (!normalized) {
    throw new PSeIntError(`Tipo desconocido: '${type}'`, 0);
  }
  return normalized;
}

export function defaultValue(type: PSeIntType): PSeIntValue {
  switch (type) {
    case "Entero":
      return 0;
    case "Real":
      return 0.0;
    case "Cadena":
    case "Caracter":
      return "";
    case "Logico":
      return false;
  }
}

function coerce(value: PSeIntValue, type: PSeIntType, line: number): PSeIntValue {
  switch (type) {
    case "Entero": {
      if (typeof value === "number") return Math.trunc(value);
      if (typeof value === "string") {
        const n = parseInt(value, 10);
        if (isNaN(n)) {
          throw new PSeIntError(`No se puede convertir '${value}' a Entero`, line);
        }
        return n;
      }
      if (typeof value === "boolean") return value ? 1 : 0;
      return 0;
    }
    case "Real": {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const n = parseFloat(value);
        if (isNaN(n)) {
          throw new PSeIntError(`No se puede convertir '${value}' a Real`, line);
        }
        return n;
      }
      if (typeof value === "boolean") return value ? 1 : 0;
      return 0;
    }
    case "Cadena":
    case "Caracter":
      return String(value);
    case "Logico": {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return value !== 0;
      throw new PSeIntError(`No se puede convertir '${value}' a Logico`, line);
    }
  }
}

interface Variable {
  type: PSeIntType;
  value: PSeIntValue;
}

interface ArrayData {
  type: PSeIntType;
  size: number;
  elements: PSeIntValue[];
}

export interface RefCell {
  get(): PSeIntValue;
  set(value: PSeIntValue, line: number): void;
}

/**
 * A single execution frame: holds local variables, arrays, refs, and metadata
 * about the current subprogram (for return semantics).
 */
export class Frame {
  readonly variables = new Map<string, Variable>();
  readonly arrays = new Map<string, ArrayData>();
  readonly refs = new Map<string, RefCell>();
  /** Name of the return variable for this frame (Funcion). null/undefined if none. */
  retVar: string | null = null;

  private key(name: string): string {
    return name.toLowerCase();
  }

  define(name: string, type: string): void {
    const pType = normalizePSeIntType(type);
    this.variables.set(this.key(name), {
      type: pType,
      value: defaultValue(pType),
    });
  }

  defineWithValue(name: string, type: PSeIntType, value: PSeIntValue, line: number): void {
    this.variables.set(this.key(name), {
      type,
      value: coerce(value, type, line),
    });
  }

  bindRef(name: string, ref: RefCell): void {
    this.refs.set(this.key(name), ref);
  }

  get(name: string, line: number): PSeIntValue {
    const k = this.key(name);
    const ref = this.refs.get(k);
    if (ref) return ref.get();
    const v = this.variables.get(k);
    if (!v) {
      throw new PSeIntError(`Variable '${name}' no definida`, line);
    }
    return v.value;
  }

  set(name: string, value: PSeIntValue, line: number): void {
    const k = this.key(name);
    const ref = this.refs.get(k);
    if (ref) {
      ref.set(value, line);
      return;
    }
    const v = this.variables.get(k);
    if (!v) {
      throw new PSeIntError(`Variable '${name}' no definida`, line);
    }
    v.value = coerce(value, v.type, line);
  }

  isDefined(name: string): boolean {
    const k = this.key(name);
    return this.variables.has(k) || this.refs.has(k);
  }

  getType(name: string): PSeIntType | undefined {
    return this.variables.get(this.key(name))?.type;
  }

  // ── Array storage (1D, base-1 indexing) ───────────────────────────

  dimensionArray(name: string, size: number, line: number): void {
    if (size <= 0 || !Number.isInteger(size)) {
      throw new PSeIntError(
        `El tamaño del arreglo debe ser un entero positivo, recibió ${size}`,
        line
      );
    }
    const k = this.key(name);
    if (!this.variables.has(k)) {
      this.define(name, "Real");
    }
    const type = this.variables.get(k)!.type;
    const elements = Array.from({ length: size }, () => defaultValue(type));
    this.arrays.set(k, { type, size, elements });
  }

  getArray(name: string, index: number, line: number): PSeIntValue {
    const k = this.key(name);
    const arr = this.arrays.get(k);
    if (!arr) {
      throw new PSeIntError(`Arreglo '${name}' no definido`, line);
    }
    if (index < 1 || index > arr.size || !Number.isInteger(index)) {
      throw new PSeIntError(
        `Índice ${index} fuera de rango [1..${arr.size}] en línea ${line}`,
        line
      );
    }
    return arr.elements[index - 1];
  }

  setArray(name: string, index: number, value: PSeIntValue, line: number): void {
    const k = this.key(name);
    const arr = this.arrays.get(k);
    if (!arr) {
      throw new PSeIntError(`Arreglo '${name}' no definido`, line);
    }
    if (index < 1 || index > arr.size || !Number.isInteger(index)) {
      throw new PSeIntError(
        `Índice ${index} fuera de rango [1..${arr.size}] en línea ${line}`,
        line
      );
    }
    arr.elements[index - 1] = coerce(value, arr.type, line);
  }

  isArray(name: string): boolean {
    return this.arrays.has(this.key(name));
  }

  getArrayData(name: string): ArrayData | undefined {
    return this.arrays.get(this.key(name));
  }

  getVariable(name: string): Variable | undefined {
    return this.variables.get(this.key(name));
  }
}

/**
 * Environment: a stack of Frames. Top-level operations (define/get/set/...)
 * delegate to the current top frame.
 */
export class Environment {
  private stack: Frame[] = [new Frame()];

  // ── Frame stack management ────────────────────────────────────────

  pushFrame(): Frame {
    const f = new Frame();
    this.stack.push(f);
    return f;
  }

  popFrame(): Frame {
    if (this.stack.length <= 1) {
      throw new PSeIntError(
        "No se puede hacer pop del frame raíz",
        0
      );
    }
    return this.stack.pop()!;
  }

  current(): Frame {
    return this.stack[this.stack.length - 1];
  }

  // ── Top-frame proxy methods (preserves backwards compatibility) ───

  define(name: string, type: string): void {
    this.current().define(name, type);
  }

  get(name: string, line: number): PSeIntValue {
    return this.current().get(name, line);
  }

  set(name: string, value: PSeIntValue, line: number): void {
    this.current().set(name, value, line);
  }

  isDefined(name: string): boolean {
    return this.current().isDefined(name);
  }

  getType(name: string): PSeIntType | undefined {
    return this.current().getType(name);
  }

  dimensionArray(name: string, size: number, line: number): void {
    this.current().dimensionArray(name, size, line);
  }

  getArray(name: string, index: number, line: number): PSeIntValue {
    return this.current().getArray(name, index, line);
  }

  setArray(name: string, index: number, value: PSeIntValue, line: number): void {
    this.current().setArray(name, index, value, line);
  }

  isArray(name: string): boolean {
    return this.current().isArray(name);
  }

  // ── RefCell factories (operate on the CURRENT frame) ──────────────

  /**
   * Creates a RefCell that proxies reads/writes to the variable slot in the
   * current frame at bind time. The ref captures the frame, so it survives
   * push/pop (it always points to the original frame's variable).
   */
  refToVariable(name: string, line: number): RefCell {
    const frame = this.current();
    const k = name.toLowerCase();
    const v = frame.getVariable(name);
    if (!v) {
      throw new PSeIntError(`Variable '${name}' no definida`, line);
    }
    return {
      get: () => {
        const cur = frame.getVariable(name);
        if (!cur) {
          throw new PSeIntError(`Variable '${name}' no definida`, line);
        }
        return cur.value;
      },
      set: (value: PSeIntValue, l: number) => {
        const cur = frame.getVariable(name);
        if (!cur) {
          throw new PSeIntError(`Variable '${name}' no definida`, l);
        }
        cur.value = coerce(value, cur.type, l);
      },
    };
  }

  /**
   * Creates a RefCell that proxies reads/writes to a specific array slot.
   * Captures (array data, index) at bind time. Index range is validated at
   * bind time AND at every access (re-validated against current size).
   */
  refToArraySlot(name: string, index: number, line: number): RefCell {
    const frame = this.current();
    const arr = frame.getArrayData(name);
    if (!arr) {
      throw new PSeIntError(`Arreglo '${name}' no definido`, line);
    }
    if (index < 1 || index > arr.size || !Number.isInteger(index)) {
      throw new PSeIntError(
        `Índice ${index} fuera de rango [1..${arr.size}] en línea ${line}`,
        line
      );
    }
    return {
      get: () => {
        if (index < 1 || index > arr.size) {
          throw new PSeIntError(
            `Índice ${index} fuera de rango [1..${arr.size}]`,
            line
          );
        }
        return arr.elements[index - 1];
      },
      set: (value: PSeIntValue, l: number) => {
        if (index < 1 || index > arr.size) {
          throw new PSeIntError(
            `Índice ${index} fuera de rango [1..${arr.size}]`,
            l
          );
        }
        arr.elements[index - 1] = coerce(value, arr.type, l);
      },
    };
  }
}

/**
 * Registry of user-defined subprograms (Funcion / SubProceso). Lookup is
 * case-insensitive. Registering a duplicate name throws PSeIntError.
 */
export class SubProgRegistry {
  private map = new Map<string, SubProcDeclNode>();

  register(decl: SubProcDeclNode): void {
    const key = decl.name.toLowerCase();
    if (this.map.has(key)) {
      throw new PSeIntError(
        `Subprograma '${decl.name}' ya está definido`,
        decl.line
      );
    }
    this.map.set(key, decl);
  }

  lookup(name: string): SubProcDeclNode | undefined {
    return this.map.get(name.toLowerCase());
  }

  has(name: string): boolean {
    return this.map.has(name.toLowerCase());
  }
}
