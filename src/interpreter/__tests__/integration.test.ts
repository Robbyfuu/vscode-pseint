import { describe, it, expect } from "vitest";
import { run } from "./helpers";

describe("Integration: full pipeline (source → tokens → AST → execute)", () => {
  it("Hola Mundo", async () => {
    const source = `
Proceso HolaMundo
  Escribir "Hola Mundo"
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("Hola Mundo\n");
  });

  it("Calculadora con Leer: lee dos números y muestra la suma", async () => {
    const source = `
Proceso Suma
  Definir a, b Como Entero
  Escribir "Ingrese a:"
  Leer a
  Escribir "Ingrese b:"
  Leer b
  Escribir "Suma: ", a + b
FinProceso
`;
    const io = await run(source, ["10", "25"]);
    expect(io.getFullOutput()).toContain("Suma: 35");
  });

  it("Para contando del 1 al 5", async () => {
    const source = `
Proceso Contar
  Definir i Como Entero
  Para i <- 1 Hasta 5 Hacer
    Escribir i
  FinPara
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("1\n2\n3\n4\n5\n");
  });

  it("Si/SiNo: evalúa ambas ramas", async () => {
    const source = `
Proceso Ramas
  Definir x Como Entero
  x <- 10
  Si x > 5 Entonces
    Escribir "Mayor"
  SiNo
    Escribir "Menor"
  FinSi
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("Mayor\n");

    const source2 = `
Proceso Ramas2
  Definir x Como Entero
  x <- 3
  Si x > 5 Entonces
    Escribir "Mayor"
  SiNo
    Escribir "Menor"
  FinSi
FinProceso
`;
    const io2 = await run(source2);
    expect(io2.getFullOutput()).toBe("Menor\n");
  });

  it("Arreglo: Dimension, asignar y leer valores", async () => {
    const source = `
Proceso Arreglo
  Dimension arr[3]
  arr[1] <- 10
  arr[2] <- 20
  arr[3] <- 30
  Escribir arr[1], " ", arr[2], " ", arr[3]
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("10 20 30\n");
  });

  it("Segun con De Otro Modo", async () => {
    const source = `
Proceso Menu
  Definir opcion Como Entero
  opcion <- 2
  Segun opcion Hacer
    1:
      Escribir "Uno"
    2:
      Escribir "Dos"
    3:
      Escribir "Tres"
    De Otro Modo:
      Escribir "Otro"
  FinSegun
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("Dos\n");

    const source2 = `
Proceso MenuDefault
  Definir opcion Como Entero
  opcion <- 99
  Segun opcion Hacer
    1:
      Escribir "Uno"
    De Otro Modo:
      Escribir "Otro"
  FinSegun
FinProceso
`;
    const io2 = await run(source2);
    expect(io2.getFullOutput()).toBe("Otro\n");
  });

  it("Ciclos anidados: Para dentro de Mientras", async () => {
    const source = `
Proceso Anidado
  Definir fila, col Como Entero
  fila <- 1
  Mientras fila <= 2 Hacer
    Para col <- 1 Hasta 3 Hacer
      EscribirSinSaltar fila * 10 + col, " "
    FinPara
    Escribir ""
    fila <- fila + 1
  FinMientras
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("11 12 13 \n21 22 23 \n");
  });

  it("Operaciones de cadenas: Longitud, Subcadena, Mayusculas", async () => {
    const source = `
Proceso Cadenas
  Definir s Como Cadena
  s <- "hola mundo"
  Escribir Longitud(s)
  Escribir Subcadena(s, 1, 4)
  Escribir Mayusculas(s)
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("10\nhola\nHOLA MUNDO\n");
  });

  it("Operaciones matemáticas: RC, Abs, Trunc", async () => {
    const source = `
Proceso Mates
  Escribir RC(16)
  Escribir Abs(-7)
  Escribir Trunc(3.9)
FinProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("4\n7\n3\n");
  });

  it("factorial recursivo con Funcion: factorial(5) = 120", async () => {
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

  it("fibonacci recursivo con Funcion: fibonacci(10) = 55", async () => {
    const source = `
Proceso Main
  Escribir fib(10);
FinProceso

Funcion r <- fib(n)
  Si n < 2 Entonces
    r <- n;
  SiNo
    r <- fib(n - 1) + fib(n - 2);
  FinSi
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("55\n");
  });

  it("recursión mutua esPar/esImpar", async () => {
    const source = `
Proceso Main
  Si esPar(10) Entonces
    Escribir "10 par";
  FinSi
  Si esImpar(7) Entonces
    Escribir "7 impar";
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
    expect(io.getFullOutput()).toBe("10 par\n7 impar\n");
  });

  it("ordenamiento burbuja con SubProceso swap Por Referencia", async () => {
    const source = `
Proceso Main
  Definir i, j Como Entero;
  Dimension a[5];
  a[1] <- 5;
  a[2] <- 2;
  a[3] <- 4;
  a[4] <- 1;
  a[5] <- 3;

  Para i <- 1 Hasta 4 Hacer
    Para j <- 1 Hasta 5 - i Hacer
      Si a[j] > a[j + 1] Entonces
        swap(a[j], a[j + 1]);
      FinSi
    FinPara
  FinPara

  Para i <- 1 Hasta 5 Hacer
    EscribirSinSaltar a[i], " ";
  FinPara
  Escribir "";
FinProceso

SubProceso swap(uno Por Referencia, dos Por Referencia)
  Definir t Como Entero;
  t <- uno;
  uno <- dos;
  dos <- t;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("1 2 3 4 5 \n");
  });

  it("Programa completo: nota de estudiante Aprobado/Reprobado", async () => {
    const source = `
Proceso Calificacion
  Definir nota Como Real
  Escribir "Ingrese su nota:"
  Leer nota
  Si nota >= 4.0 Entonces
    Escribir "Aprobado"
  SiNo
    Escribir "Reprobado"
  FinSi
FinProceso
`;
    const aprobado = await run(source, ["5.5"]);
    expect(aprobado.getFullOutput()).toContain("Aprobado");

    const reprobado = await run(source, ["3.2"]);
    expect(reprobado.getFullOutput()).toContain("Reprobado");
  });
});
