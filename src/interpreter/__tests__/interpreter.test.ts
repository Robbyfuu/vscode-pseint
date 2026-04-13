import { describe, it, expect } from "vitest";
import { PSeIntError } from "../errors";
import { run } from "./helpers";

describe("Interpreter", () => {
  // 1. Hola Mundo
  it("escribe Hola Mundo", async () => {
    const io = await run(`
      Proceso HolaMundo
        Escribir "Hola";
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("Hola\n");
  });

  // 2. Type coercion: Entero trunca decimales
  it("trunca valores al asignar a Entero", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- 3.7;
        Escribir x;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("3\n");
  });

  // 3. Variable no definida lanza error
  it("lanza error al usar variable no definida", async () => {
    await expect(
      run(`
        Proceso Test
          x <- 5;
        FinProceso
      `)
    ).rejects.toThrow(PSeIntError);
    await expect(
      run(`
        Proceso Test
          x <- 5;
        FinProceso
      `)
    ).rejects.toThrow("no definida");
  });

  // 4. Para loop
  it("ejecuta ciclo Para correctamente", async () => {
    const io = await run(`
      Proceso Test
        Definir i Como Entero;
        Para i <- 1 Hasta 3 Hacer
          Escribir i;
        FinPara
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("1\n2\n3\n");
  });

  // 5. Repetir
  it("ejecuta ciclo Repetir correctamente", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- 0;
        Repetir
          x <- x + 1;
        Hasta Que x = 3
        Escribir x;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("3\n");
  });

  // 6. Mientras
  it("ejecuta ciclo Mientras correctamente", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- 0;
        Mientras x < 3 Hacer
          x <- x + 1;
        FinMientras
        Escribir x;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("3\n");
  });

  // 7. Si/SiNo
  it("ejecuta Si/SiNo correctamente", async () => {
    const io = await run(`
      Proceso Test
        Si 5 > 3 Entonces
          Escribir "si";
        SiNo
          Escribir "no";
        FinSi
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("si\n");
  });

  // 8. Segun
  it("ejecuta Segun correctamente", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- 2;
        Segun x Hacer
          1:
            Escribir "uno";
          2:
            Escribir "dos";
          De Otro Modo:
            Escribir "otro";
        FinSegun
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("dos\n");
  });

  // 9. Subcadena 1-based
  it("Subcadena usa indexación base 1", async () => {
    const io = await run(`
      Proceso Test
        Escribir Subcadena("Hola mundo", 1, 4);
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("Hola\n");
  });

  // 10. Wrong argument count
  it("lanza error con cantidad de argumentos incorrecta", async () => {
    await expect(
      run(`
        Proceso Test
          Escribir Longitud("hola", "mundo");
        FinProceso
      `)
    ).rejects.toThrow("espera 1 argumento(s)");
  });

  // 11. Array out of bounds
  it("lanza error al acceder fuera de rango en arreglo", async () => {
    await expect(
      run(`
        Proceso Test
          Dimension arr[3];
          arr[5] <- 1;
        FinProceso
      `)
    ).rejects.toThrow("fuera de rango");
  });

  // 12. Array basic
  it("maneja arreglos básicos", async () => {
    const io = await run(`
      Proceso Test
        Definir arr Como Entero;
        Dimension arr[3];
        arr[1] <- 10;
        Escribir arr[1];
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("10\n");
  });

  // 13. Escribir Sin Saltar
  it("Escribir Sin Saltar no agrega salto de línea", async () => {
    const io = await run(`
      Proceso Test
        Escribir Sin Saltar "A";
        Escribir "B";
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("AB\n");
  });

  // 14. Leer with input
  it("lee entrada del usuario", async () => {
    const io = await run(
      `
      Proceso Test
        Definir x Como Entero;
        Leer x;
        Escribir x;
      FinProceso
    `,
      ["42"]
    );
    expect(io.getFullOutput()).toBe("42\n");
  });

  // 15. Leer cancelled
  it("lanza error cuando el usuario cancela lectura", async () => {
    await expect(
      run(
        `
        Proceso Test
          Definir x Como Entero;
          Leer x;
        FinProceso
      `,
        [undefined]
      )
    ).rejects.toThrow("cancelada");
  });

  // 16. String concatenation with +
  it("concatena cadenas con +", async () => {
    const io = await run(`
      Proceso Test
        Escribir "Hola" + " mundo";
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("Hola mundo\n");
  });

  // 17. Built-in RC
  it("calcula raíz cuadrada con RC", async () => {
    const io = await run(`
      Proceso Test
        Escribir RC(25);
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("5\n");
  });

  // 18. Expression precedence
  it("respeta precedencia de operadores", async () => {
    const io = await run(`
      Proceso Test
        Escribir 2 + 3 * 4;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("14\n");
  });

  // 19. Nested structures
  it("maneja estructuras anidadas", async () => {
    const io = await run(`
      Proceso Test
        Definir i Como Entero;
        Para i <- 1 Hasta 2 Hacer
          Si i = 1 Entonces
            Escribir "primero";
          SiNo
            Escribir "segundo";
          FinSi
        FinPara
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("primero\nsegundo\n");
  });

  // 20. Operator comparisons
  it("evalúa comparaciones correctamente", async () => {
    const io = await run(`
      Proceso Test
        Si 5 = 5 Entonces
          Escribir "igual";
        FinSi
        Si 5 <> 3 Entonces
          Escribir "diferente";
        FinSi
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("igual\ndiferente\n");
  });

  // 21. Boolean operations
  it("evalúa operaciones lógicas", async () => {
    const io = await run(`
      Proceso Test
        Si Verdadero Y Falso Entonces
          Escribir "si";
        SiNo
          Escribir "no";
        FinSi
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("no\n");
  });

  // 22. Division by zero
  it("lanza error al dividir por cero", async () => {
    await expect(
      run(`
        Proceso Test
          Definir x Como Real;
          x <- 10 / 0;
        FinProceso
      `)
    ).rejects.toThrow("División por cero");
  });

  // 23. ConvertirATexto and ConvertirANumero
  it("convierte entre texto y número", async () => {
    const io = await run(`
      Proceso Test
        Escribir ConvertirATexto(42);
        Escribir ConvertirANumero("3.14");
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("42\n3.14\n");
  });

  // 24. Aleatorio returns a number
  it("Aleatorio retorna un número en rango", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- Aleatorio(1, 10);
        Si x >= 1 Y x <= 10 Entonces
          Escribir "ok";
        FinSi
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("ok\n");
  });

  // Additional: Segun with De Otro Modo
  it("ejecuta De Otro Modo en Segun cuando no hay match", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- 99;
        Segun x Hacer
          1:
            Escribir "uno";
          2:
            Escribir "dos";
          De Otro Modo:
            Escribir "otro";
        FinSegun
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("otro\n");
  });

  // Additional: negative unary
  it("evalúa negación unaria", async () => {
    const io = await run(`
      Proceso Test
        Definir x Como Entero;
        x <- -5;
        Escribir x;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("-5\n");
  });

  // Additional: Escribir multiple expressions
  it("Escribir con múltiples expresiones las concatena", async () => {
    const io = await run(`
      Proceso Test
        Escribir "Resultado: ", 42;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("Resultado: 42\n");
  });

  // Additional: boolean toString
  it("muestra booleanos como Verdadero/Falso", async () => {
    const io = await run(`
      Proceso Test
        Escribir Verdadero;
        Escribir Falso;
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("Verdadero\nFalso\n");
  });

  // Additional: Para with step
  it("ejecuta Para con paso personalizado", async () => {
    const io = await run(`
      Proceso Test
        Definir i Como Entero;
        Para i <- 0 Hasta 10 Con Paso 5 Hacer
          Escribir i;
        FinPara
      FinProceso
    `);
    expect(io.getFullOutput()).toBe("0\n5\n10\n");
  });
});
