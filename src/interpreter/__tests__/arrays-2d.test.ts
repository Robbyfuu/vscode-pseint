import { describe, it, expect } from "vitest";
import { run } from "./helpers";
import { PSeIntError } from "../errors";

describe("Arrays 2D - declaración y uso", () => {
  it("declara matriz 3x4 y rellena con dobles For", async () => {
    const io = await run(`
      Proceso Test
        Dimension a[3, 4];
        Definir i, j Como Entero;
        Para i <- 1 Hasta 3 Hacer
          Para j <- 1 Hasta 4 Hacer
            a[i, j] <- i * 10 + j;
          FinPara
        FinPara
        Para i <- 1 Hasta 3 Hacer
          Para j <- 1 Hasta 4 Hacer
            Escribir a[i, j];
          FinPara
        FinPara
      FinProceso
    `);

    const out = io.output.join("");
    // 12 valores: 11 12 13 14 21 22 23 24 31 32 33 34
    expect(out).toContain("11");
    expect(out).toContain("12");
    expect(out).toContain("23");
    expect(out).toContain("34");
  });

  it("read y write directo sobre slot 2D", async () => {
    const io = await run(`
      Proceso Test
        Dimension m[2, 2];
        m[1, 1] <- 100;
        m[2, 2] <- 200;
        Escribir m[1, 1];
        Escribir m[2, 2];
      FinProceso
    `);
    expect(io.output.join("")).toContain("100\n");
    expect(io.output.join("")).toContain("200\n");
  });

  it("transpone una matriz 2x3 en otra 3x2", async () => {
    const io = await run(`
      Proceso Test
        Dimension a[2, 3];
        Dimension b[3, 2];
        Definir i, j Como Entero;
        // Llenar a con i*10+j
        Para i <- 1 Hasta 2 Hacer
          Para j <- 1 Hasta 3 Hacer
            a[i, j] <- i * 10 + j;
          FinPara
        FinPara
        // Transponer en b
        Para i <- 1 Hasta 2 Hacer
          Para j <- 1 Hasta 3 Hacer
            b[j, i] <- a[i, j];
          FinPara
        FinPara
        Escribir b[1, 1];
        Escribir b[1, 2];
        Escribir b[3, 1];
        Escribir b[3, 2];
      FinProceso
    `);

    const out = io.output.join("");
    // a[1,1]=11 -> b[1,1]=11
    expect(out).toContain("11\n");
    // a[2,1]=21 -> b[1,2]=21
    expect(out).toContain("21\n");
    // a[1,3]=13 -> b[3,1]=13
    expect(out).toContain("13\n");
    // a[2,3]=23 -> b[3,2]=23
    expect(out).toContain("23\n");
  });

  it("cuenta ocurrencias de un valor en una matriz 2D", async () => {
    const io = await run(`
      Proceso Test
        Dimension m[3, 3];
        Definir i, j, total Como Entero;
        // Llenar con 0
        Para i <- 1 Hasta 3 Hacer
          Para j <- 1 Hasta 3 Hacer
            m[i, j] <- 0;
          FinPara
        FinPara
        m[1, 1] <- 7;
        m[2, 2] <- 7;
        m[3, 3] <- 7;
        m[1, 3] <- 7;
        total <- 0;
        Para i <- 1 Hasta 3 Hacer
          Para j <- 1 Hasta 3 Hacer
            Si m[i, j] = 7 Entonces
              total <- total + 1;
            FinSi
          FinPara
        FinPara
        Escribir total;
      FinProceso
    `);
    expect(io.output.join("")).toContain("4\n");
  });

  it("3D: declara cubo[2, 3, 4], setea y lee", async () => {
    const io = await run(`
      Proceso Test
        Dimension cubo[2, 3, 4];
        cubo[1, 1, 1] <- 111;
        cubo[2, 3, 4] <- 999;
        Escribir cubo[1, 1, 1];
        Escribir cubo[2, 3, 4];
      FinProceso
    `);
    expect(io.output.join("")).toContain("111\n");
    expect(io.output.join("")).toContain("999\n");
  });
});

describe("Arrays 2D - errores", () => {
  it("acceso con número incorrecto de índices lanza error con dimensión esperada", async () => {
    await expect(
      run(`
        Proceso Test
          Dimension a[3, 4];
          Escribir a[1];
        FinProceso
      `)
    ).rejects.toThrow(/2 dimensión/);
  });

  it("acceso con un índice fuera de rango lanza error", async () => {
    await expect(
      run(`
        Proceso Test
          Dimension a[3, 4];
          Escribir a[5, 1];
        FinProceso
      `)
    ).rejects.toThrow(PSeIntError);
  });

  it("declarar Dimension a[0, 4] (dim cero) lanza error", async () => {
    await expect(
      run(`
        Proceso Test
          Dimension a[0, 4];
        FinProceso
      `)
    ).rejects.toThrow(/entero positivo/);
  });

  it("asignación con número incorrecto de índices lanza error", async () => {
    await expect(
      run(`
        Proceso Test
          Dimension a[3, 4];
          a[1] <- 99;
        FinProceso
      `)
    ).rejects.toThrow(/2 dimensión/);
  });
});

describe("Arrays 2D - SubProgramas Por Referencia", () => {
  it("Por Referencia con elemento 2D mutates el slot del caller", async () => {
    const io = await run(`
      Proceso Main
        Dimension m[2, 2];
        m[1, 1] <- 10;
        m[2, 2] <- 20;
        duplicar(m[1, 1]);
        duplicar(m[2, 2]);
        Escribir m[1, 1];
        Escribir m[2, 2];
      FinProceso

      SubProceso duplicar(x Por Referencia)
        x <- x * 2;
      FinSubProceso
    `);
    expect(io.output.join("")).toContain("20\n");
    expect(io.output.join("")).toContain("40\n");
  });
});

describe("Arrays 1D - backward compatibility", () => {
  it("Dimension v[5]; v[1] <- 10; Escribir v[1] sigue funcionando", async () => {
    const io = await run(`
      Proceso Test
        Dimension v[5];
        v[1] <- 10;
        v[5] <- 50;
        Escribir v[1];
        Escribir v[5];
      FinProceso
    `);
    expect(io.output.join("")).toContain("10\n");
    expect(io.output.join("")).toContain("50\n");
  });

  it("ciclo Para con arreglo 1D", async () => {
    const io = await run(`
      Proceso Test
        Dimension v[3];
        Definir i Como Entero;
        Para i <- 1 Hasta 3 Hacer
          v[i] <- i * i;
        FinPara
        Para i <- 1 Hasta 3 Hacer
          Escribir v[i];
        FinPara
      FinProceso
    `);
    const out = io.output.join("");
    expect(out).toContain("1\n");
    expect(out).toContain("4\n");
    expect(out).toContain("9\n");
  });
});
