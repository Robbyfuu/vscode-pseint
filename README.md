# PSeInt para VS Code / Cursor

Extensión que agrega soporte completo para pseudocódigo **PSeInt** (`.psc`) en Visual Studio Code y Cursor.

## Características

- **Resaltado de sintaxis** — todas las palabras clave de PSeInt en español
- **Snippets** — estructuras comunes con autocompletado (Proceso, Si, Mientras, Para, etc.)
- **Validación en tiempo real** — detecta bloques sin cerrar (FinSi, FinMientras, etc.)
- **Ejecutar archivos** — botón de play y atajo `Cmd+Shift+R` / `Ctrl+Shift+R`
- **Plegado de código** — colapsa bloques Si/Para/Mientras/Funciones
- **Indentación automática** — indenta al entrar en bloques
- **Ícono de archivo** — identifica archivos `.psc` en el explorador

## Instalación

### Desde VSIX (recomendado)

```bash
cd vscode-pseint
npm install
npm run compile
npm run package
```

Esto genera un archivo `vscode-pseint-0.1.0.vsix`. Luego:

1. En Cursor/VSCode: `Cmd+Shift+P` → "Extensions: Install from VSIX..."
2. Seleccionar el archivo `.vsix`
3. Reiniciar el editor

### Desarrollo local

```bash
cd vscode-pseint
npm install
npm run watch
```

Presionar `F5` para abrir una ventana de desarrollo con la extensión cargada.

## Uso

### Abrir archivos `.psc`

Los archivos se reconocen automáticamente como PSeInt con resaltado de sintaxis.

### Ejecutar un archivo

- Botón ▶️ en la barra del editor (aparece en archivos `.psc`)
- Click derecho → "Ejecutar archivo PSeInt"
- Atajo: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows/Linux)
- Paleta de comandos: "PSeInt: Ejecutar archivo PSeInt"

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
