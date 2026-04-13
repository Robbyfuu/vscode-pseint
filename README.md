# PSeInt para VS Code / Cursor

Extensión que agrega soporte completo para pseudocódigo **PSeInt** (`.psc`) en Visual Studio Code y Cursor. Incluye un **intérprete embebido** que permite ejecutar programas PSeInt sin instalar software adicional.

## Características

- **Intérprete embebido** — ejecuta pseudocódigo PSeInt directamente en VS Code, sin necesidad de instalar PSeInt
- **Resaltado de sintaxis** — todas las palabras clave de PSeInt en español
- **Snippets** — estructuras comunes con autocompletado (Proceso, Si, Mientras, Para, etc.)
- **Validación en tiempo real** — detecta bloques sin cerrar (FinSi, FinMientras, etc.)
- **Ejecutar archivos** — dos opciones: intérprete embebido (`Cmd+Shift+I`) o PSeInt nativo (`Cmd+Shift+R`)
- **Plegado de código** — colapsa bloques Si/Para/Mientras/Funciones
- **Indentación automática** — indenta al entrar en bloques
- **Ícono de archivo** — identifica archivos `.psc` en el explorador
- **Errores en español** — mensajes de error claros con número de línea

## Instalación

### Desde VS Code Marketplace

Busca **"PSeInt"** en la pestaña de extensiones de VS Code o Cursor.

### Desde VSIX

```bash
cd vscode-pseint
pnpm install
pnpm run compile
pnpm run package
```

Esto genera un archivo `vscode-pseint-0.2.0.vsix`. Luego:

1. En Cursor/VSCode: `Cmd+Shift+P` → "Extensions: Install from VSIX..."
2. Seleccionar el archivo `.vsix`
3. Reiniciar el editor

### Desarrollo local

```bash
cd vscode-pseint
pnpm install
pnpm run watch
```

Presionar `F5` para abrir una ventana de desarrollo con la extensión cargada.

## Uso

### Abrir archivos `.psc`

Los archivos se reconocen automáticamente como PSeInt con resaltado de sintaxis.

### Ejecutar con intérprete embebido (recomendado)

No necesitas instalar PSeInt. La extensión incluye su propio intérprete:

- Atajo: `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
- Click derecho → "Ejecutar con intérprete embebido"
- Paleta de comandos: "PSeInt: Ejecutar con intérprete embebido"

La salida aparece en el panel "PSeInt - Intérprete". Para `Leer`, aparece un cuadro de diálogo donde puedes ingresar valores.

#### Qué soporta el intérprete

- Tipos: `Entero`, `Real`, `Cadena`, `Logico`
- Control: `Si/SiNo`, `Mientras`, `Para` (con paso), `Repetir/Hasta Que`, `Segun`
- I/O: `Escribir`, `Escribir Sin Saltar`, `Leer`
- Arrays: `Dimension` (1D, indexación base-1)
- Funciones: `RC`, `Abs`, `Trunc`, `Redon`, `Longitud`, `Subcadena`, `Mayusculas`, `Minusculas`, `Concatenar`, `ConvertirANumero`, `ConvertirATexto`, `Azar`, `Aleatorio`
- Operadores: aritméticos, comparación, lógicos (`Y`, `O`, `NO`)

### Ejecutar con PSeInt nativo

Si tienes PSeInt instalado, también puedes ejecutar con el binario nativo:

- Botón de play en la barra del editor
- Atajo: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows/Linux)
- Click derecho → "Ejecutar archivo PSeInt"

### Snippets disponibles

| Prefijo | Estructura |
|---------|-----------|
| `proceso` | Proceso...FinProceso |
| `si` | Si...Entonces...FinSi |
| `sisino` | Si...SiNo...FinSi |
| `mientras` | Mientras...Hacer...FinMientras |
| `para` | Para...Hasta...Con Paso...FinPara |
| `repetir` | Repetir...Hasta Que |
| `segun` | Segun...FinSegun |
| `funcion` | Funcion...FinFuncion |
| `subproceso` | SubProceso...FinSubProceso |
| `escribir` | Escribir |
| `leer` | Leer |
| `escleer` | Escribir + Leer |
| `defent` | Definir...Como Entero |
| `defreal` | Definir...Como Real |
| `defcar` | Definir...Como Caracter |
| `defcad` | Definir...Como Cadena |
| `deflog` | Definir...Como Logico |
| `dim` | Dimension arreglo |

## Configuración

| Propiedad | Default | Descripción |
|-----------|---------|-------------|
| `pseint.executablePath` | `""` | Ruta al ejecutable de PSeInt |
| `pseint.runArgs` | `["--nouser"]` | Argumentos al ejecutar |
| `pseint.clearTerminalBeforeRun` | `true` | Limpiar terminal antes de ejecutar |
| `pseint.saveBeforeRun` | `true` | Guardar archivo antes de ejecutar |

### Instalar PSeInt

Descarga PSeInt desde [pseint.sourceforge.net](http://pseint.sourceforge.net/).

- **macOS**: Descargar `.dmg`, arrastrar a `/Applications`
- **Linux**: Descargar y extraer; el binario `pseint` queda en la carpeta
- **Windows**: Ejecutar el instalador `.exe`

Si la extensión no detecta PSeInt automáticamente, configura la ruta en settings:

```json
{
  "pseint.executablePath": "/ruta/a/pseint"
}
```

## Licencia

MIT
