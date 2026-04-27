# Changelog

All notable changes to the "PSeInt - Pseudocódigo en Español" extension are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.6] - 2026-04-26
### Added
- CHANGELOG.md siguiendo el formato Keep a Changelog.
- Galleria banner en marketplace (color `#1e3a5f`, tema dark).
- Badges en README (versión, descargas, rating, CI, licencia).
- Workflow CI en GitHub Actions (tests + tsc + package en Node 20/22).
- Templates de issue (bug + feature) y PR.
- `CONTRIBUTING.md` con flujo de trabajo y convenciones.
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1 en español).

## [0.6.5] - 2026-04-26
### Changed
- Icono renovado: PSe/Int + flecha de asignación rellenan el canvas, sin brackets distractivos. Legible a 90×90 (tamaño marketplace).

## [0.6.4] - 2026-04-26
### Fixed
- README alineado con package.json: solo `F5` documentado (eliminadas referencias a `Cmd+Shift+I` / `Cmd+Shift+R` que no existían).
- Sección "Limitaciones" actualizada (arreglos N-dim y trig sí están soportados).
- Comando `pseint.runSelection` removido del manifest (era stub no implementado).
- `terminal.sendText("clear")` ahora detecta plataforma (`cls` en Windows).
- Conteo de tests en README actualizado (281).
- Removido código muerto `openWithPseintApp`.
### Changed
- `@vscode/vsce` actualizado a 3.9.1.

## [0.6.3] - 2026-04-26
### Added
- Funciones y SubProcesos definidos por usuario (Por Valor / Por Referencia, recursión, Retornar opcional).
- Builtins matemáticos: sen, cos, tan, asen, acos, atan, ln, exp, log, pot.
- Constante `pi`.
- Statements: `Limpiar Pantalla`, `Borrar Pantalla`, `Esperar Tecla`, `Esperar N Segundos`.
- Arreglos N-dimensionales (1D / 2D / 3D+) con flat row-major storage.
- Soporte de array completo en `Por Referencia`.
### Fixed
- `Retornar` fuera de Funcion/SubProc emite error claro en lugar de crashear.
- Registry de subprogramas se reinicia entre ejecuciones del mismo Interpreter.
- Latent typing del retVar — funciones sin tipo declarado pueden retornar Cadena/Logico/Real.
- `iterationCount` ya no leakea entre llamadas.
- `dimensionArray` lanza error en vez de sobreescribir silencioso.

## [0.6.1] - 2026-04-26
### Added
- Hardening del intérprete tras code review: validación robusta de tipos y bordes.

## [0.3.1] - 2026-04-12
### Fixed
- Atajo cambiado a `F5` para evitar conflictos con DevTools y React Snippets.

## [0.3.0] - 2026-04-12
### Added
- Botón de play usa intérprete embebido cuando PSeInt no está instalado.

## [0.2.x] - 2026-04-12
### Added
- Intérprete embebido inicial (sin necesidad de PSeInt instalado).
- Iconos profesionales con símbolo de asignación.
- Edge case tests, ejemplos y README orientado al marketplace.

## [0.1.0] - 2026-04-12
### Added
- Versión inicial: sintaxis (TextMate grammar), snippets, validación de bloques, ejecución vía PSeInt instalado.
