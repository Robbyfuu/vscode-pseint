# Contribuir a vscode-pseint

¡Gracias por tu interés en contribuir! Esta guía te ayuda a empezar.

## Setup local

Requisitos:
- Node.js 20.x o 22.x
- pnpm 10+
- VS Code 1.74+

```bash
git clone https://github.com/Robbyfuu/vscode-pseint.git
cd vscode-pseint
pnpm install
```

## Flujo de trabajo

1. Forkea el repo y creá una rama desde `main`: `git checkout -b feat/mi-feature`
2. Hacé tus cambios
3. Corré los tests: `pnpm exec vitest run`
4. Verificá tipos: `pnpm exec tsc --noEmit`
5. Actualizá `CHANGELOG.md` bajo `## [Unreleased]`
6. Commit con [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` nueva funcionalidad
   - `fix:` bugfix
   - `docs:` solo documentación
   - `chore:` mantenimiento
   - `test:` tests
   - `refactor:` sin cambio de comportamiento
7. Abrí un PR contra `main`

## Tests

El proyecto usa **vitest**. Los tests están en `src/interpreter/__tests__/`.

```bash
pnpm exec vitest run                            # toda la suite
pnpm exec vitest run src/interpreter/__tests__/lexer.test.ts  # un archivo
pnpm exec vitest watch                          # modo watch
```

Cobertura por capa:
- `lexer.test.ts` — tokenización
- `parser.test.ts` — AST
- `environment.test.ts` — Frame, RefCell, registry
- `interpreter.test.ts` — evaluación
- `subprograms.test.ts` — Funciones y SubProcesos
- `arrays-2d.test.ts` — arreglos multidimensionales
- `builtins-math.test.ts` — sen/cos/log/etc
- `edge-cases.test.ts` — casos límite
- `integration.test.ts` — programas completos

## Probar localmente

1. Abrí el repo en VS Code
2. F5 para lanzar una nueva ventana de "Extension Development Host"
3. En esa ventana, abrí o creá un archivo `.psc` y probá la extensión

## Empaquetar

```bash
pnpm exec vsce package --no-dependencies
```

Genera un `.vsix` que podés instalar localmente con `code --install-extension <archivo>.vsix`.

## Convenciones

- TypeScript estricto (no `any` en código de producción).
- Mensajes de error en español, formato `PSeIntError(message, line, column?)`.
- pnpm exclusivamente (sin `npm install` ni `yarn`).
- Tests obligatorios para cualquier cambio de comportamiento.
- Sin firmas AI ni `Co-Authored-By` en commits.

## Reportar bugs

Usá la plantilla de issue [bug report](.github/ISSUE_TEMPLATE/bug_report.yml). Incluí:
- Versión de VS Code y de la extensión
- Sistema operativo
- Código PSeInt mínimo que reproduce el bug
- Comportamiento esperado vs observado

## Solicitar features

Usá la plantilla [feature request](.github/ISSUE_TEMPLATE/feature_request.yml). Si la feature ya existe en el PSeInt clásico, incluí referencia.

## Código de conducta

Este proyecto sigue el [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, aceptás respetarlo.

## Licencia

Al contribuir, aceptás que tu código se licencie bajo MIT, igual que el resto del proyecto.
