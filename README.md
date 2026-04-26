# PSeInt - Pseudocódigo en Español

> Escribe, ejecuta y aprende pseudocódigo PSeInt directamente en VS Code y Cursor. **Sin instalar nada más.**

## Inicio rápido

1. Instala la extensión desde el marketplace
2. Crea un archivo `.psc`
3. Escribe tu programa (los snippets te ayudan — escribe `proceso` y presiona Tab)
4. Ejecuta con `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

```
Proceso HolaMundo
    Escribir "Hola Mundo!"
FinProceso
```

## Características

### Intérprete embebido

Ejecuta programas PSeInt directamente en el editor. No necesitas descargar ni configurar PSeInt.

- **Cmd+Shift+I** para ejecutar
- Salida en el panel "PSeInt - Intérprete"
- Entrada de datos via cuadro de diálogo (`Leer`)
- Errores en español con número de línea
- Protección contra ciclos infinitos

### Resaltado de sintaxis

Todas las palabras clave de PSeInt resaltadas con colores. Soporte completo para caracteres en español (á, é, í, ó, ú, ñ).

### Snippets inteligentes

Escribe las primeras letras y presiona Tab:

| Escribe | Genera |
|---------|--------|
| `proceso` | Proceso...FinProceso |
| `si` | Si...Entonces...FinSi |
| `sisino` | Si...SiNo...FinSi |
| `mientras` | Mientras...Hacer...FinMientras |
| `para` | Para...Con Paso...FinPara |
| `repetir` | Repetir...Hasta Que |
| `segun` | Segun...FinSegun |
| `escribir` | Escribir |
| `leer` | Leer |
| `escleer` | Escribir + Leer |
| `defent` | Definir Como Entero |
| `defreal` | Definir Como Real |
| `defcad` | Definir Como Cadena |
| `deflog` | Definir Como Logico |
| `dim` | Dimension arreglo |
| `funcion` | Funcion...FinFuncion |
| `subproceso` | SubProceso...FinSubProceso |

### Validación en tiempo real

Detecta errores mientras escribes:
- Bloques sin cerrar (falta `FinSi`, `FinMientras`, etc.)
- Bloques de cierre sin apertura correspondiente

### Más características

- Plegado de código (colapsa bloques)
- Indentación automática al entrar en bloques
- Ícono personalizado para archivos `.psc`
- Soporte para comentarios (`//` y `/* */`)

## Qué soporta el intérprete

| Categoría | Instrucciones |
|-----------|--------------|
| **Tipos** | `Entero`, `Real`, `Cadena`, `Logico` |
| **Variables** | `Definir...Como`, asignación con `<-` |
| **Entrada/Salida** | `Escribir`, `Escribir Sin Saltar`, `Leer`, `Limpiar Pantalla` / `Borrar Pantalla`, `Esperar Tecla`, `Esperar N Segundos` |
| **Condicionales** | `Si...Entonces...SiNo...FinSi` |
| **Ciclos** | `Mientras...Hacer`, `Para...Hasta...Con Paso`, `Repetir...Hasta Que` |
| **Selección** | `Segun...Hacer...De Otro Modo...FinSegun` |
| **Arreglos** | `Dimension` (1D, indexación base-1) |
| **Operadores** | `+`, `-`, `*`, `/`, `^`, `MOD`, `=`, `<>`, `<`, `>`, `Y`, `O`, `NO` |

### Funciones y SubProcesos definidos por el usuario

El intérprete soporta `Funcion` (con valor de retorno) y `SubProceso` (sin retorno), incluyendo recursión, parámetros `Por Valor` (default) y `Por Referencia`, y `Retornar` para salida temprana.

```
Proceso Main
  Definir x Como Entero;
  x <- 5;
  Escribir "factorial(", x, ") = ", factorial(x);
  duplicar(x);
  Escribir "x duplicado: ", x;
FinProceso

Funcion r <- factorial(n)
  Si n <= 1 Entonces
    r <- 1;
  SiNo
    r <- n * factorial(n - 1);
  FinSi
FinFuncion

SubProceso duplicar(v Por Referencia)
  v <- v * 2;
FinSubProceso
```

Detalles:

- Las funciones pueden declararse antes o después de `Proceso/FinProceso`.
- `Por Valor` copia el argumento (default). `Por Referencia` permite mutar variables o elementos de arreglo del caller.
- `Retornar [expr];` permite salida temprana. En `Funcion`, asigna el valor a la variable de retorno.
- Profundidad máxima de llamadas: 500 (suficiente para recursión razonable).

### Funciones incorporadas

| Función | Descripción |
|---------|-------------|
| `RC(x)` / `Raiz(x)` | Raíz cuadrada |
| `Abs(x)` | Valor absoluto |
| `Trunc(x)` | Truncar a entero |
| `Redon(x)` | Redondear |
| `sen(x)` / `cos(x)` / `tan(x)` | Trigonométricas (radianes) |
| `asen(x)` / `acos(x)` / `atan(x)` | Trigonométricas inversas (radianes) |
| `ln(x)` | Logaritmo natural |
| `exp(x)` | Exponencial natural (e^x) |
| `log(x)` | Logaritmo base 10 |
| `pot(b, e)` | Potencia (alias del operador `^`) |
| `Longitud(s)` | Largo de cadena |
| `Subcadena(s, inicio, fin)` | Extraer subcadena (base-1) |
| `Mayusculas(s)` | Convertir a mayúsculas |
| `Minusculas(s)` | Convertir a minúsculas |
| `Concatenar(s1, s2)` | Unir cadenas |
| `ConvertirANumero(s)` | Texto a número |
| `ConvertirATexto(n)` | Número a texto |
| `Azar(n)` | Entero aleatorio en [0, n-1] |
| `Aleatorio(a, b)` | Entero aleatorio en [a, b] |

> Constante predefinida: `pi` (Math.PI). Puedes reasignarla — al estilo PSeInt clásico.

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Cmd+Shift+I` / `Ctrl+Shift+I` | Ejecutar con intérprete embebido |
| `Cmd+Shift+R` / `Ctrl+Shift+R` | Ejecutar con PSeInt nativo (requiere PSeInt instalado) |

## Configuración

| Propiedad | Default | Descripción |
|-----------|---------|-------------|
| `pseint.executablePath` | `""` | Ruta al ejecutable de PSeInt (solo para ejecución nativa) |
| `pseint.runArgs` | `["--nouser"]` | Argumentos al ejecutar con PSeInt nativo |
| `pseint.clearTerminalBeforeRun` | `true` | Limpiar terminal antes de ejecutar |
| `pseint.saveBeforeRun` | `true` | Guardar archivo antes de ejecutar |

## Ejecutar con PSeInt nativo (opcional)

Si prefieres usar el binario oficial de PSeInt:

1. Descarga PSeInt desde [pseint.sourceforge.net](http://pseint.sourceforge.net/)
2. Instálalo en tu sistema
3. La extensión lo detecta automáticamente, o configura la ruta manualmente:

```json
{
  "pseint.executablePath": "/ruta/a/pseint"
}
```

## Ejemplos

La extensión incluye programas de ejemplo en la carpeta `examples/`:

- `01-hola-mundo.psc` — Tu primer programa
- `02-calculadora.psc` — Operaciones básicas con entrada de datos
- `03-tabla-multiplicar.psc` — Ciclo Para
- `04-notas-alumno.psc` — Promedio y Segun
- `05-fibonacci.psc` — Serie de Fibonacci
- `06-arreglo-mayor.psc` — Arreglos con Dimension
- `07-adivina-numero.psc` — Juego con Repetir y Aleatorio

## Limitaciones actuales

El intérprete embebido cubre las instrucciones más usadas en cursos introductorios. Aún **no soporta**:

- Arreglos multidimensionales
- Funciones trigonométricas (SEN, COS, TAN, LN, EXP)
- Depuración paso a paso
- Archivos

Para programas avanzados, usa la ejecución con PSeInt nativo (`Cmd+Shift+R`).

## Contribuir

```bash
git clone https://github.com/Robbyfuu/vscode-pseint.git
cd vscode-pseint
pnpm install
pnpm run watch    # compilación en modo watch
pnpm test         # correr tests (201 tests)
```

Presiona `F5` en VS Code para abrir una ventana de desarrollo con la extensión cargada.

## Licencia

MIT
