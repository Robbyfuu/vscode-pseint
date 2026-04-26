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

describe("Retornar fuera de Funcion/SubProceso", () => {
  it("Retornar en main body emite error PSeInt en español, no crash", async () => {
    const source = `
Proceso Main
  Retornar 5;
FinProceso
`;
    await expect(run(source)).rejects.toThrow(
      /Retornar.*solo es válido dentro de una Funcion o SubProceso/
    );
  });
});

describe("Subprogramas: iterationCount aislado por llamada (M4)", () => {
  it("muchas llamadas a una funcion con loop interno NO disparan límite global", async () => {
    // Cada invocación tiene un loop de ~1000 iteraciones. 100 llamadas = 100k
    // iteraciones acumuladas — debajo de 1M, pero antes del fix M4 las
    // iteraciones se sumaban entre frames y, con poca holgura, programas
    // legítimos rompían el límite global. Este test usa 100 llamadas con
    // bucles internos para verificar que el contador se resetea por frame.
    const source = `
Proceso Main
  Definir i, total Como Entero;
  total <- 0;
  Para i <- 1 Hasta 100 Hacer
    total <- total + sumar(1000);
  FinPara
  Escribir total;
FinProceso

Funcion r <- sumar(n)
  Definir k, acc Como Entero;
  acc <- 0;
  Para k <- 1 Hasta n Hacer
    acc <- acc + 1;
  FinPara
  r <- acc;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("100000\n");
  }, 15000);

  it("iterationCount del caller se restaura tras la llamada", async () => {
    // El caller corre un loop largo, en medio llama a una funcion con su
    // propio loop. Tras volver, el caller continúa su loop. Si el contador
    // del caller no se restaurara, el caller podría romper el límite a pesar
    // de no haber hecho realmente tantas iteraciones.
    const source = `
Proceso Main
  Definir i, dummy Como Entero;
  dummy <- 0;
  Para i <- 1 Hasta 500000 Hacer
    Si i = 250000 Entonces
      dummy <- sumar(900000);
    FinSi
  FinPara
  Escribir "ok ", dummy;
FinProceso

Funcion r <- sumar(n)
  Definir k, acc Como Entero;
  acc <- 0;
  Para k <- 1 Hasta n Hacer
    acc <- acc + 1;
  FinPara
  r <- acc;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("ok 900000\n");
  }, 30000);
});

describe("Subprogramas: tipado latente del retVar sin Como Tipo (M3)", () => {
  it("Funcion sin tipo declarado puede retornar Cadena", async () => {
    const source = `
Proceso Main
  Escribir saludo();
FinProceso

Funcion r <- saludo()
  r <- "hola";
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("hola\n");
  });

  it("Funcion sin tipo declarado puede retornar Logico", async () => {
    const source = `
Proceso Main
  Si esActivo() Entonces
    Escribir "si";
  SiNo
    Escribir "no";
  FinSi
FinProceso

Funcion r <- esActivo()
  r <- Verdadero;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("si\n");
  });

  it("Funcion sin tipo declarado puede retornar Real", async () => {
    const source = `
Proceso Main
  Escribir mitad(10);
FinProceso

Funcion r <- mitad(x)
  r <- x / 2;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("5\n");
  });

  it("tipo latente se bloquea tras la primera asignación (Cadena coerciona Entero a string)", async () => {
    // Decisión: una vez que el retVar se bloquea como Cadena, asignar un
    // número lo coerciona a string. Coincide con la flexibilidad clásica
    // de PSeInt y mantiene compatibilidad con coerce().
    const source = `
Proceso Main
  Escribir mezcla();
FinProceso

Funcion r <- mezcla()
  r <- "valor=";
  r <- 5;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("5\n");
  });
});

describe("Subprogramas: Por Referencia con arreglo completo (H3)", () => {
  it("SubProceso muta arreglo 1D pasado Por Referencia", async () => {
    const source = `
Proceso Main
  Dimension a[3];
  a[1] <- 1;
  a[2] <- 2;
  a[3] <- 3;
  fill(a);
  Escribir a[1], " ", a[2], " ", a[3];
FinProceso

SubProceso fill(arr Por Referencia)
  arr[1] <- 99;
  arr[2] <- 88;
  arr[3] <- 77;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("99 88 77\n");
  });

  it("SubProceso muta arreglo 2D pasado Por Referencia", async () => {
    const source = `
Proceso Main
  Dimension m[2, 2];
  m[1, 1] <- 1;
  m[1, 2] <- 2;
  m[2, 1] <- 3;
  m[2, 2] <- 4;
  poner(m);
  Escribir m[1, 1], " ", m[1, 2], " ", m[2, 1], " ", m[2, 2];
FinProceso

SubProceso poner(mat Por Referencia)
  mat[1, 1] <- 10;
  mat[2, 2] <- 40;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("10 2 3 40\n");
  });

  it("Por Ref con arreglo completo: bubble sort completo muta el caller", async () => {
    const source = `
Proceso Main
  Dimension v[5];
  v[1] <- 5;
  v[2] <- 2;
  v[3] <- 4;
  v[4] <- 1;
  v[5] <- 3;
  ordenar(v, 5);
  Escribir v[1], v[2], v[3], v[4], v[5];
FinProceso

SubProceso ordenar(a Por Referencia, n)
  Definir i, j, tmp Como Entero;
  Para i <- 1 Hasta n - 1 Hacer
    Para j <- 1 Hasta n - i Hacer
      Si a[j] > a[j + 1] Entonces
        tmp <- a[j];
        a[j] <- a[j + 1];
        a[j + 1] <- tmp;
      FinSi
    FinPara
  FinPara
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("12345\n");
  });

  it("arreglo Por Referencia muta el caller (alias activo)", async () => {
    // Verifica que pasar un arreglo Por Referencia comparte el ArrayData
    // con el callee — mutaciones internas se reflejan en el caller.
    const source = `
Proceso Main
  Dimension a[3];
  a[1] <- 7;
  a[2] <- 8;
  a[3] <- 9;
  intentar(a);
  Escribir a[1], " ", a[2], " ", a[3];
FinProceso

SubProceso intentar(arr Por Referencia)
  arr[1] <- 100;
FinSubProceso
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("100 8 9\n");
  });
});

describe("Subprogramas: ReturnSignal (S1)", () => {
  it("Retornar dentro de una funcion no produce error de tipo runtime (ReturnSignal extends Error)", async () => {
    // Smoke test: si ReturnSignal NO extiende Error, motores estrictos
    // pueden no propagarlo correctamente vía `throw`. Este test verifica
    // que el flujo funciona normalmente — si rompe, S1 no está aplicado.
    const source = `
Proceso Main
  Escribir abs(-7);
FinProceso

Funcion r <- abs(x)
  Si x < 0 Entonces
    Retornar -x;
  FinSi
  r <- x;
FinFuncion
`;
    const io = await run(source);
    expect(io.getFullOutput()).toBe("7\n");
  });
});

describe("Reuso de Interpreter (registry reset)", () => {
  it("ejecutar dos veces el mismo programa no tira 'Subprograma ya definido'", async () => {
    const { Interpreter } = await import("../interpreter");
    const { Lexer } = await import("../lexer");
    const { Parser } = await import("../parser");
    const source = `
Proceso Main
  Escribir doble(3);
FinProceso

Funcion r <- doble(x)
  r <- x * 2;
FinFuncion
`;
    const tokens = new Lexer(source).tokenize();
    const program = new Parser(tokens).parse();

    let captured = "";
    const io = {
      write: (t: string) => {
        captured += t;
      },
      read: async () => undefined,
    };

    const interp = new Interpreter(io);
    await interp.execute(program);
    await interp.execute(program); // second run must not throw
    expect(captured).toBe("6\n6\n");
  });
});
