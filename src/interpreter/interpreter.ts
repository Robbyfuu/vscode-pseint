import { PSeIntError } from "./errors";
import {
  Environment,
  SubProgRegistry,
  defaultValue,
  normalizePSeIntType,
} from "./environment";
import { BUILTINS } from "./builtins";
import type { PSeIntValue, PSeIntType, RefCell } from "./environment";
import type {
  ProgramNode,
  StatementNode,
  ExpressionNode,
  SubProcDeclNode,
  ParamSpec,
} from "./ast";

export interface InterpreterIO {
  write(text: string): void;
  read(prompt: string): Promise<string | undefined>;
  /** Limpia la pantalla / output channel. Opcional: si no se implementa, Limpiar Pantalla es no-op. */
  clear?(): void;
  /** Bloquea hasta que el usuario presione una tecla. Opcional: si no se implementa, resuelve inmediatamente. */
  waitForKey?(): Promise<void>;
}

/**
 * Internal control-flow signal used by Retornar to early-exit a user-defined
 * subprogram. NOT a PSeIntError — must be caught only by callUserFn.
 */
class ReturnSignal {
  // marker class
}

const MAX_CALL_DEPTH = 500;

export class Interpreter {
  private env: Environment;
  private registry: SubProgRegistry;
  private callDepth = 0;
  private iterationCount = 0;
  private readonly MAX_ITERATIONS = 1_000_000;

  constructor(private io: InterpreterIO) {
    this.env = new Environment();
    this.registry = new SubProgRegistry();
  }

  private checkIterationLimit(line: number): void {
    if (++this.iterationCount > this.MAX_ITERATIONS) {
      throw new PSeIntError(
        `Límite de iteraciones excedido (${this.MAX_ITERATIONS}). Posible ciclo infinito.`,
        line
      );
    }
  }

  async execute(program: ProgramNode): Promise<void> {
    this.iterationCount = 0;
    this.callDepth = 0;
    // Reset registry so re-running the same Interpreter instance doesn't
    // throw "Subprograma ya definido" on the second call.
    this.registry = new SubProgRegistry();

    // Predefinir constante `pi` en el frame raíz. El usuario puede
    // reasignarla (PSeInt clásico permite esto). Se hace ANTES de registrar
    // subprogramas y ejecutar el body.
    this.env.current().defineWithValue("pi", "Real", Math.PI, 0);

    // Pre-pass: register all subprograms BEFORE executing the main body.
    // Allows forward refs and mutual recursion.
    for (const decl of program.subprograms) {
      this.registry.register(decl);
    }

    await this.executeBlock(program.body);
  }

  private async executeBlock(statements: StatementNode[]): Promise<void> {
    for (const stmt of statements) {
      await this.executeStatement(stmt);
    }
  }

  private async executeStatement(stmt: StatementNode): Promise<void> {
    switch (stmt.kind) {
      case "define":
        for (const varName of stmt.variables) {
          this.env.define(varName, stmt.type);
        }
        break;

      case "assign": {
        const value = await this.evaluateExpression(stmt.value);
        this.env.set(stmt.target, value, stmt.line);
        break;
      }

      case "array_assign": {
        const indices: number[] = [];
        for (const idxExpr of stmt.indices) {
          const idxVal = await this.evaluateExpression(idxExpr);
          indices.push(this.toNumber(idxVal, stmt.line));
        }
        const value = await this.evaluateExpression(stmt.value);
        this.env.setArray(stmt.name, indices, value, stmt.line);
        break;
      }

      case "write": {
        let output = "";
        for (const expr of stmt.expressions) {
          const val = await this.evaluateExpression(expr);
          output += this.toString(val);
        }
        if (stmt.newline) {
          output += "\n";
        }
        this.io.write(output);
        break;
      }

      case "read": {
        for (const varName of stmt.variables) {
          const input = await this.io.read(varName);
          if (input === undefined) {
            throw new PSeIntError("Ejecución cancelada por el usuario", stmt.line);
          }
          // Coerce input to the variable's type
          const type = this.env.getType(varName);
          let value: PSeIntValue;
          if (type === "Entero") {
            const n = parseInt(input, 10);
            if (isNaN(n)) {
              throw new PSeIntError(`Valor '${input}' no es un Entero válido`, stmt.line);
            }
            value = n;
          } else if (type === "Real") {
            const n = parseFloat(input);
            if (isNaN(n)) {
              throw new PSeIntError(`Valor '${input}' no es un Real válido`, stmt.line);
            }
            value = n;
          } else if (type === "Logico") {
            value = input.toLowerCase() === "verdadero" || input === "1";
          } else {
            // Cadena / Caracter / undefined type
            value = input;
          }
          this.env.set(varName, value, stmt.line);
        }
        break;
      }

      case "if": {
        const condition = await this.evaluateExpression(stmt.condition);
        if (this.toBool(condition)) {
          await this.executeBlock(stmt.thenBranch);
        } else {
          await this.executeBlock(stmt.elseBranch);
        }
        break;
      }

      case "while": {
        let cond = await this.evaluateExpression(stmt.condition);
        while (this.toBool(cond)) {
          this.checkIterationLimit(stmt.line);
          await this.executeBlock(stmt.body);
          cond = await this.evaluateExpression(stmt.condition);
        }
        break;
      }

      case "for": {
        const from = this.toNumber(
          await this.evaluateExpression(stmt.from),
          stmt.line
        );
        const to = this.toNumber(
          await this.evaluateExpression(stmt.to),
          stmt.line
        );
        const step = this.toNumber(
          await this.evaluateExpression(stmt.step),
          stmt.line
        );

        // Define the loop variable if it doesn't exist yet
        if (!this.env.isDefined(stmt.variable)) {
          this.env.define(stmt.variable, "Entero");
        }

        this.env.set(stmt.variable, from, stmt.line);

        if (step > 0) {
          while (this.toNumber(this.env.get(stmt.variable, stmt.line), stmt.line) <= to) {
            this.checkIterationLimit(stmt.line);
            await this.executeBlock(stmt.body);
            const current = this.toNumber(
              this.env.get(stmt.variable, stmt.line),
              stmt.line
            );
            this.env.set(stmt.variable, current + step, stmt.line);
          }
        } else if (step < 0) {
          while (this.toNumber(this.env.get(stmt.variable, stmt.line), stmt.line) >= to) {
            this.checkIterationLimit(stmt.line);
            await this.executeBlock(stmt.body);
            const current = this.toNumber(
              this.env.get(stmt.variable, stmt.line),
              stmt.line
            );
            this.env.set(stmt.variable, current + step, stmt.line);
          }
        }
        if (step === 0) {
          throw new PSeIntError("El paso del ciclo Para no puede ser cero", stmt.line);
        }
        break;
      }

      case "repeat": {
        let cond: PSeIntValue;
        do {
          this.checkIterationLimit(stmt.line);
          await this.executeBlock(stmt.body);
          cond = await this.evaluateExpression(stmt.condition);
        } while (!this.toBool(cond));
        break;
      }

      case "switch": {
        const switchVal = await this.evaluateExpression(stmt.expression);
        let matched = false;

        for (const c of stmt.cases) {
          for (const caseExpr of c.values) {
            const caseVal = await this.evaluateExpression(caseExpr);
            if (this.valuesEqual(switchVal, caseVal)) {
              matched = true;
              break;
            }
          }
          if (matched) {
            await this.executeBlock(c.body);
            break;
          }
        }

        if (!matched && stmt.defaultCase.length > 0) {
          await this.executeBlock(stmt.defaultCase);
        }
        break;
      }

      case "dimension": {
        const dims: number[] = [];
        for (const sizeExpr of stmt.sizes) {
          const sizeVal = this.toNumber(
            await this.evaluateExpression(sizeExpr),
            stmt.line
          );
          dims.push(sizeVal);
        }
        this.env.dimensionArray(stmt.name, dims, stmt.line);
        break;
      }

      case "call_stmt": {
        const decl = this.registry.lookup(stmt.name);
        if (!decl) {
          throw new PSeIntError(
            `SubProceso o Función '${stmt.name}' no definido`,
            stmt.line
          );
        }
        await this.callUserFn(decl, stmt.args, stmt.line);
        break;
      }

      case "return": {
        if (this.callDepth === 0) {
          throw new PSeIntError(
            "'Retornar' solo es válido dentro de una Funcion o SubProceso",
            stmt.line
          );
        }
        const frame = this.env.current();
        if (stmt.value !== null) {
          // Funcion: assign to retVar before signaling. SubProc with no
          // retVar simply discards the value (or could error — design TBD).
          if (frame.retVar !== null) {
            const val = await this.evaluateExpression(stmt.value);
            frame.set(frame.retVar, val, stmt.line);
          }
        }
        throw new ReturnSignal();
      }

      case "clear_screen": {
        this.io.clear?.();
        break;
      }

      case "wait_key": {
        await (this.io.waitForKey?.() ?? Promise.resolve());
        break;
      }

      case "wait_seconds": {
        const secs = this.toNumber(
          await this.evaluateExpression(stmt.seconds),
          stmt.line
        );
        if (secs < 0) {
          throw new PSeIntError(
            "El tiempo de espera debe ser no negativo",
            stmt.line
          );
        }
        await new Promise((resolve) => setTimeout(resolve, secs * 1000));
        break;
      }

      default: {
        const _exhaustive: never = stmt;
        throw new PSeIntError(`Sentencia desconocida: ${(_exhaustive as any).kind}`, 0);
      }
    }
  }

  private async evaluateExpression(expr: ExpressionNode): Promise<PSeIntValue> {
    switch (expr.kind) {
      case "number_literal":
        return expr.value;

      case "string_literal":
        return expr.value;

      case "boolean_literal":
        return expr.value;

      case "identifier":
        return this.env.get(expr.name, expr.line);

      case "array_access": {
        const indices: number[] = [];
        for (const idxExpr of expr.indices) {
          const idxVal = await this.evaluateExpression(idxExpr);
          indices.push(this.toNumber(idxVal, expr.line));
        }
        return this.env.getArray(expr.name, indices, expr.line);
      }

      case "function_call": {
        // 1. User-defined subprogram lookup first
        const decl = this.registry.lookup(expr.name);
        if (decl) {
          if (decl.returnVar === null) {
            throw new PSeIntError(
              `SubProceso '${expr.name}' no retorna valor`,
              expr.line
            );
          }
          const result = await this.callUserFn(decl, expr.args, expr.line);
          if (result === null) {
            // Should not happen since returnVar !== null, but defensive:
            throw new PSeIntError(
              `SubProceso '${expr.name}' no retorna valor`,
              expr.line
            );
          }
          return result;
        }

        // 2. Builtins
        const args: PSeIntValue[] = [];
        for (const arg of expr.args) {
          args.push(await this.evaluateExpression(arg));
        }
        const fnName = expr.name.toLowerCase();
        const fn = BUILTINS[fnName];
        if (!fn) {
          throw new PSeIntError(`Función '${expr.name}' no definida`, expr.line);
        }
        return fn(args, expr.line);
      }

      case "unary_expression": {
        const operand = await this.evaluateExpression(expr.operand);
        const op = expr.operator.toLowerCase();

        if (op === "no" || op === "!" ) {
          return !this.toBool(operand);
        }
        if (expr.operator === "-") {
          return -this.toNumber(operand, expr.line);
        }
        if (expr.operator === "+") {
          return this.toNumber(operand, expr.line);
        }
        throw new PSeIntError(
          `Operador unario desconocido: ${expr.operator}`,
          expr.line
        );
      }

      case "binary_expression": {
        const left = await this.evaluateExpression(expr.left);
        const right = await this.evaluateExpression(expr.right);
        return this.evaluateBinary(expr.operator, left, right, expr.line);
      }

      default: {
        const _exhaustive: never = expr;
        throw new PSeIntError(`Expresión desconocida: ${(_exhaustive as any).kind}`, 0);
      }
    }
  }

  /**
   * Calls a user-defined subprogram with the given argument expressions.
   * Returns the value of the return variable (Funcion) or null (SubProceso).
   */
  private async callUserFn(
    decl: SubProcDeclNode,
    argExprs: ExpressionNode[],
    line: number
  ): Promise<PSeIntValue | null> {
    // 1. Depth guard
    if (this.callDepth + 1 > MAX_CALL_DEPTH) {
      throw new PSeIntError(
        `Profundidad de llamadas excedida (${MAX_CALL_DEPTH})`,
        line
      );
    }

    // 2. Arity check
    if (argExprs.length !== decl.params.length) {
      const kind = decl.returnVar !== null ? "Función" : "SubProceso";
      throw new PSeIntError(
        `${kind} '${decl.name}' espera ${decl.params.length} argumento(s), recibió ${argExprs.length}`,
        line
      );
    }

    // 3. Resolve args in CALLER's frame BEFORE pushing.
    //    For Por Valor: eval to a value.
    //    For Por Referencia: build a RefCell against the caller's slot.
    interface ResolvedArg {
      param: ParamSpec;
      value?: PSeIntValue;
      ref?: RefCell;
    }
    const resolved: ResolvedArg[] = [];
    for (let i = 0; i < decl.params.length; i++) {
      const param = decl.params[i];
      const argExpr = argExprs[i];

      if (param.mode === "ref") {
        // Must be Identifier or ArrayAccess
        if (argExpr.kind === "identifier") {
          const ref = this.env.refToVariable(argExpr.name, argExpr.line);
          resolved.push({ param, ref });
        } else if (argExpr.kind === "array_access") {
          const indices: number[] = [];
          for (const idxExpr of argExpr.indices) {
            const idxVal = await this.evaluateExpression(idxExpr);
            indices.push(this.toNumber(idxVal, argExpr.line));
          }
          const ref = this.env.refToArraySlot(
            argExpr.name,
            indices,
            argExpr.line
          );
          resolved.push({ param, ref });
        } else {
          throw new PSeIntError(
            `El parámetro '${param.name}' es Por Referencia y requiere una variable o elemento de arreglo, no una expresión`,
            argExpr.line
          );
        }
      } else {
        const value = await this.evaluateExpression(argExpr);
        resolved.push({ param, value });
      }
    }

    // 4. Push new frame (increment depth INSIDE try-catch boundary so leaks
    // are impossible if pushFrame ever throws in the future).
    const frame = this.env.pushFrame();
    this.callDepth++;

    try {
      // 5. Bind params in the new frame
      for (const r of resolved) {
        if (r.ref) {
          frame.bindRef(r.param.name, r.ref);
        } else {
          // Por Valor: define + set. Type: explicit or inferred.
          const type = this.inferParamType(r.param, r.value!);
          frame.defineWithValue(r.param.name, type, r.value!, line);
        }
      }

      // 6. Track retVar
      if (decl.returnVar !== null) {
        const retType: PSeIntType = decl.returnType
          ? normalizePSeIntType(decl.returnType)
          : "Real";
        frame.defineWithValue(
          decl.returnVar,
          retType,
          defaultValue(retType),
          line
        );
        frame.retVar = decl.returnVar;
      }

      // 7. Execute body, catching ReturnSignal
      try {
        await this.executeBlock(decl.body);
      } catch (e) {
        if (e instanceof ReturnSignal) {
          // ok — early exit
        } else {
          throw e;
        }
      }

      // 8. Read retVar value
      let result: PSeIntValue | null = null;
      if (decl.returnVar !== null) {
        result = frame.get(decl.returnVar, line);
      }

      return result;
    } finally {
      // 9. Pop frame, decrement depth
      this.env.popFrame();
      this.callDepth--;
    }
  }

  private inferParamType(param: ParamSpec, value: PSeIntValue): PSeIntType {
    if (param.type) {
      return normalizePSeIntType(param.type);
    }
    if (typeof value === "number") return "Real";
    if (typeof value === "string") return "Cadena";
    if (typeof value === "boolean") return "Logico";
    return "Real";
  }

  private evaluateBinary(
    operator: string,
    left: PSeIntValue,
    right: PSeIntValue,
    line: number
  ): PSeIntValue {
    const op = operator.toLowerCase();

    // String concatenation with +
    if (operator === "+" && (typeof left === "string" || typeof right === "string")) {
      return String(left) + String(right);
    }

    // Arithmetic
    switch (op) {
      case "+":
        return this.toNumber(left, line) + this.toNumber(right, line);
      case "-":
        return this.toNumber(left, line) - this.toNumber(right, line);
      case "*":
        return this.toNumber(left, line) * this.toNumber(right, line);
      case "/": {
        const divisor = this.toNumber(right, line);
        if (divisor === 0) {
          throw new PSeIntError("División por cero", line);
        }
        return this.toNumber(left, line) / divisor;
      }
      case "^":
        return Math.pow(this.toNumber(left, line), this.toNumber(right, line));
      case "%":
      case "mod": {
        const d = this.toNumber(right, line);
        if (d === 0) {
          throw new PSeIntError("División por cero", line);
        }
        return this.toNumber(left, line) % d;
      }
    }

    // Comparison
    switch (op) {
      case "=":
        return this.valuesEqual(left, right);
      case "<>":
        return !this.valuesEqual(left, right);
      case "<":
        return this.compareValues(left, right, line) < 0;
      case ">":
        return this.compareValues(left, right, line) > 0;
      case "<=":
        return this.compareValues(left, right, line) <= 0;
      case ">=":
        return this.compareValues(left, right, line) >= 0;
    }

    // Logical
    if (op === "y" || op === "&" || op === "and") {
      return this.toBool(left) && this.toBool(right);
    }
    if (op === "o" || op === "|" || op === "or") {
      return this.toBool(left) || this.toBool(right);
    }

    throw new PSeIntError(`Operador binario desconocido: ${operator}`, line);
  }

  // ── Helper functions ────────────────────────────────────────────

  private toNumber(val: PSeIntValue, line: number): number {
    if (typeof val === "number") return val;
    if (typeof val === "boolean") return val ? 1 : 0;
    if (typeof val === "string") {
      const n = parseFloat(val);
      if (isNaN(n)) {
        throw new PSeIntError(
          `No se puede convertir '${val}' a número`,
          line
        );
      }
      return n;
    }
    return 0;
  }

  private toBool(val: PSeIntValue): boolean {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    if (typeof val === "string") return val !== "";
    return false;
  }

  private toString(val: PSeIntValue): string {
    if (typeof val === "boolean") return val ? "Verdadero" : "Falso";
    return String(val);
  }

  private valuesEqual(a: PSeIntValue, b: PSeIntValue): boolean {
    if (typeof a === typeof b) {
      return a === b;
    }
    // Both numeric: compare as numbers
    if (typeof a === "number" && typeof b === "number") {
      return a === b;
    }
    // Boolean to number: true=1, false=0
    if (typeof a === "boolean" && typeof b === "number") {
      return (a ? 1 : 0) === b;
    }
    if (typeof a === "number" && typeof b === "boolean") {
      return a === (b ? 1 : 0);
    }
    // String to number: try parsing
    if (typeof a === "string" && typeof b === "number") {
      const parsed = parseFloat(a);
      return !isNaN(parsed) && parsed === b;
    }
    if (typeof a === "number" && typeof b === "string") {
      const parsed = parseFloat(b);
      return !isNaN(parsed) && a === parsed;
    }
    // All other cross-type: convert both to string
    return String(a) === String(b);
  }

  private compareValues(a: PSeIntValue, b: PSeIntValue, line: number): number {
    if (typeof a === "string" && typeof b === "string") {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    const na = this.toNumber(a, line);
    const nb = this.toNumber(b, line);
    return na - nb;
  }
}
