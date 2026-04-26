import { describe, it, expect } from "vitest";
import { run } from "./helpers";

describe("Subprogramas: Funcion (con retorno)", () => {
  it("Funcion devuelve un valor calculado", async () => {
    const source = `
Proceso Main
  Escribir doble(5);
FinProceso

Funcion res <- doble(x)
  res <- x * 2;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("10\n");
  });

  it("Funcion sin asignar al retVar devuelve el valor por defecto (0)", async () => {
    const source = `
Proceso Main
  Escribir vacia();
FinProceso

Funcion r <- vacia()
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("0\n");
  });

  it("Funcion con tipo de retorno explícito Cadena", async () => {
    const source = `
Proceso Main
  Escribir hola();
FinProceso

Funcion r <- hola() Como Cadena
  r <- "mundo";
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("mundo\n");
  });
});

describe("Subprogramas: SubProceso (sin retorno)", () => {
  it("SubProceso ejecuta efecto secundario y no retorna valor", async () => {
    const source = `
Proceso Main
  saludar("Mundo");
FinProceso

SubProceso saludar(n)
  Escribir "Hola ", n;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("Hola Mundo\n");
  });

  it("Usar SubProceso (sin retorno) como expresión lanza error", async () => {
    const source = `
Proceso Main
  Definir x Como Cadena;
  x <- saludar("Mundo");
FinProceso

SubProceso saludar(n)
  Escribir "Hola ", n;
FinSubProceso
`;
    await expect(run(source)).rejects.toThrow(/no retorna valor/);
  });
});

describe("Subprogramas: paso de parámetros", () => {
  it("Por Valor (default) NO muta la variable del caller", async () => {
    const source = `
Proceso Main
  Definir x Como Entero;
  x <- 5;
  inc(x);
  Escribir x;
FinProceso

SubProceso inc(n)
  n <- n + 1;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("5\n");
  });

  it("Por Referencia muta la variable del caller", async () => {
    const source = `
Proceso Main
  Definir x Como Entero;
  x <- 5;
  inc(x);
  Escribir x;
FinProceso

SubProceso inc(n Por Referencia)
  n <- n + 1;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("6\n");
  });

  it("Por Referencia muta el slot de un arreglo", async () => {
    const source = `
Proceso Main
  Dimension a[3];
  a[1] <- 10;
  a[2] <- 20;
  a[3] <- 30;
  inc(a[2]);
  Escribir a[1], " ", a[2], " ", a[3];
FinProceso

SubProceso inc(n Por Referencia)
  n <- n + 100;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("10 120 30\n");
  });

  it("Por Referencia con literal lanza error", async () => {
    const source = `
Proceso Main
  inc(5);
FinProceso

SubProceso inc(n Por Referencia)
  n <- n + 1;
FinSubProceso
`;
    await expect(run(source)).rejects.toThrow(/Por Referencia/);
  });
});

describe("Subprogramas: recursión", () => {
  it("factorial recursivo de 5 es 120", async () => {
    const source = `
Proceso Main
  Escribir factorial(5);
FinProceso

Funcion r <- factorial(n)
  Si n <= 1 Entonces
    r <- 1;
  SiNo
    r <- n * factorial(n - 1);
  FinSi
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("120\n");
  });

  it("recursión mutua: esPar / esImpar", async () => {
    const source = `
Proceso Main
  Si esPar(4) Entonces
    Escribir "par";
  SiNo
    Escribir "impar";
  FinSi
  Si esImpar(5) Entonces
    Escribir "impar";
  SiNo
    Escribir "par";
  FinSi
FinProceso

Funcion r <- esPar(n)
  Si n = 0 Entonces
    r <- Verdadero;
  SiNo
    r <- esImpar(n - 1);
  FinSi
FinFuncion

Funcion r <- esImpar(n)
  Si n = 0 Entonces
    r <- Falso;
  SiNo
    r <- esPar(n - 1);
  FinSi
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("par\nimpar\n");
  });
});

describe("Subprogramas: validaciones", () => {
  it("Profundidad de llamadas excedida (sin caso base)", async () => {
    const source = `
Proceso Main
  Escribir loop(1);
FinProceso

Funcion r <- loop(n)
  r <- loop(n + 1);
FinFuncion
`;
    await expect(run(source)).rejects.toThrow(/Profundidad de llamadas/);
  }, 10000);

  it("Cantidad incorrecta de argumentos lanza error", async () => {
    const source = `
Proceso Main
  saludar("Hola");
FinProceso

SubProceso saludar(a, b)
  Escribir a, b;
FinSubProceso
`;
    await expect(run(source)).rejects.toThrow(/2 argumento/);
  });

  it("Llamada a subprograma no definido lanza error", async () => {
    const source = `
Proceso Main
  noExiste();
FinProceso
`;
    await expect(run(source)).rejects.toThrow(/no definid/);
  });
});

describe("Subprogramas: Retornar (early-exit)", () => {
  it("Retornar termina la ejecución y devuelve el valor", async () => {
    const source = `
Proceso Main
  Escribir clamp(-3);
FinProceso

Funcion r <- clamp(x)
  Si x < 0 Entonces
    Retornar 0;
  FinSi
  r <- x;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("0\n");
  });

  it("Retornar sin valor en SubProceso termina temprano", async () => {
    const source = `
Proceso Main
  imprimir(5);
  imprimir(-1);
FinProceso

SubProceso imprimir(n)
  Si n < 0 Entonces
    Retornar;
  FinSi
  Escribir n;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("5\n");
  });
});

describe("Subprogramas: declaración después de FinProceso", () => {
  it("subprograma declarado después de FinProceso es invocable desde main", async () => {
    const source = `
Proceso Main
  Escribir doble(7);
FinProceso

Funcion r <- doble(x)
  r <- x * 2;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("14\n");
  });

  it("subprograma declarado ANTES de Proceso es invocable desde main", async () => {
    const source = `
Funcion r <- doble(x)
  r <- x * 2;
FinFuncion

Proceso Main
  Escribir doble(7);
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("14\n");
  });
});
