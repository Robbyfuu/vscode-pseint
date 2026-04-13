import { PSeIntError } from "./errors";

export type PSeIntType = "Entero" | "Real" | "Cadena" | "Logico" | "Caracter";
export type PSeIntValue = number | string | boolean;

const TYPE_MAP: Record<string, PSeIntType> = {
  entero: "Entero",
  real: "Real",
  cadena: "Cadena",
  logico: "Logico",
  caracter: "Caracter",
};

function normalizeType(type: string): PSeIntType {
  const normalized = TYPE_MAP[type.toLowerCase()];
  if (!normalized) {
    throw new PSeIntError(`Tipo desconocido: '${type}'`, 0);
  }
  return normalized;
}

function defaultValue(type: PSeIntType): PSeIntValue {
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

export class Environment {
  private variables = new Map<string, Variable>();
  private arrays = new Map<string, ArrayData>();

  private key(name: string): string {
    return name.toLowerCase();
  }

  define(name: string, type: string): void {
    const pType = normalizeType(type);
    this.variables.set(this.key(name), {
      type: pType,
      value: defaultValue(pType),
    });
  }

  get(name: string, line: number): PSeIntValue {
    const v = this.variables.get(this.key(name));
    if (!v) {
      throw new PSeIntError(`Variable '${name}' no definida`, line);
    }
    return v.value;
  }

  set(name: string, value: PSeIntValue, line: number): void {
    const k = this.key(name);
    const v = this.variables.get(k);
    if (!v) {
      throw new PSeIntError(`Variable '${name}' no definida`, line);
    }
    v.value = coerce(value, v.type, line);
  }

  isDefined(name: string): boolean {
    return this.variables.has(this.key(name));
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
}
