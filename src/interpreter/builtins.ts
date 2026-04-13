import { PSeIntError } from "./errors";
import type { PSeIntValue } from "./environment";

type BuiltinFn = (args: PSeIntValue[], line: number) => PSeIntValue;

function expectArgs(
  name: string,
  args: PSeIntValue[],
  expected: number,
  line: number
): void {
  if (args.length !== expected) {
    throw new PSeIntError(
      `${name} espera ${expected} argumento(s), recibió ${args.length}`,
      line
    );
  }
}

function toNum(name: string, val: PSeIntValue, line: number): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (isNaN(n)) {
      throw new PSeIntError(
        `${name}: se esperaba un número, recibió '${val}'`,
        line
      );
    }
    return n;
  }
  if (typeof val === "boolean") return val ? 1 : 0;
  throw new PSeIntError(`${name}: argumento inválido`, line);
}

function toStr(name: string, val: PSeIntValue, line: number): string {
  if (typeof val === "string") return val;
  throw new PSeIntError(
    `${name}: se esperaba una cadena, recibió ${typeof val}`,
    line
  );
}

const builtinEntries: Array<[string[], BuiltinFn]> = [
  // ── Math ────────────────────────────────────────────────────────
  [
    ["rc", "raiz"],
    (args, line) => {
      expectArgs("RC", args, 1, line);
      const x = toNum("RC", args[0], line);
      if (x < 0) {
        throw new PSeIntError("RC: no se puede calcular la raíz de un número negativo", line);
      }
      return Math.sqrt(x);
    },
  ],
  [
    ["abs"],
    (args, line) => {
      expectArgs("ABS", args, 1, line);
      return Math.abs(toNum("ABS", args[0], line));
    },
  ],
  [
    ["trunc"],
    (args, line) => {
      expectArgs("TRUNC", args, 1, line);
      return Math.trunc(toNum("TRUNC", args[0], line));
    },
  ],
  [
    ["redon"],
    (args, line) => {
      expectArgs("REDON", args, 1, line);
      return Math.round(toNum("REDON", args[0], line));
    },
  ],

  // ── String ──────────────────────────────────────────────────────
  [
    ["longitud"],
    (args, line) => {
      expectArgs("Longitud", args, 1, line);
      const s = toStr("Longitud", args[0], line);
      return s.length;
    },
  ],
  [
    ["subcadena"],
    (args, line) => {
      expectArgs("Subcadena", args, 3, line);
      const s = toStr("Subcadena", args[0], line);
      const inicio = toNum("Subcadena", args[1], line);
      const fin = toNum("Subcadena", args[2], line);
      return s.substring(inicio - 1, fin);
    },
  ],
  [
    ["mayusculas"],
    (args, line) => {
      expectArgs("Mayusculas", args, 1, line);
      const s = toStr("Mayusculas", args[0], line);
      return s.toUpperCase();
    },
  ],
  [
    ["minusculas"],
    (args, line) => {
      expectArgs("Minusculas", args, 1, line);
      const s = toStr("Minusculas", args[0], line);
      return s.toLowerCase();
    },
  ],
  [
    ["concatenar"],
    (args, line) => {
      expectArgs("Concatenar", args, 2, line);
      return String(args[0]) + String(args[1]);
    },
  ],

  // ── Conversion ──────────────────────────────────────────────────
  [
    ["convertiranumero"],
    (args, line) => {
      expectArgs("ConvertirANumero", args, 1, line);
      const val = args[0];
      const n = parseFloat(String(val));
      if (isNaN(n)) {
        throw new PSeIntError(
          `No se puede convertir '${val}' a número`,
          line
        );
      }
      return n;
    },
  ],
  [
    ["convertiratexto"],
    (args, line) => {
      expectArgs("ConvertirATexto", args, 1, line);
      return String(args[0]);
    },
  ],

  // ── Random ──────────────────────────────────────────────────────
  [
    ["azar"],
    (args, line) => {
      expectArgs("Azar", args, 1, line);
      const x = toNum("Azar", args[0], line);
      return Math.floor(Math.random() * x);
    },
  ],
  [
    ["aleatorio"],
    (args, line) => {
      expectArgs("Aleatorio", args, 2, line);
      const a = toNum("Aleatorio", args[0], line);
      const b = toNum("Aleatorio", args[1], line);
      return Math.floor(Math.random() * (b - a + 1)) + a;
    },
  ],
];

// Build the registry: all keys lowercase for case-insensitive lookup
export const BUILTINS: Readonly<Record<string, BuiltinFn>> = Object.freeze(
  builtinEntries.reduce<Record<string, BuiltinFn>>((acc, [names, fn]) => {
    for (const name of names) {
      acc[name.toLowerCase()] = fn;
    }
    return acc;
  }, {})
);
