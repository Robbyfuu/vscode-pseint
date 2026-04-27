import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { interpretSource, PSeIntError } from "./interpreter";
import { VSCodeIO } from "./interpreter/runtime";

const PSEINT_TERMINAL_NAME = "PSeInt";

let pseintOutputChannel: vscode.OutputChannel | undefined;
let runtimeDiagnostics: vscode.DiagnosticCollection | undefined;

const KNOWN_PATHS: Record<string, string[]> = {
  darwin: [
    "/Applications/PSeInt.app/Contents/MacOS/pseint",
    "/Applications/PSeInt.app/Contents/MacOS/PSeInt",
    path.join(process.env.HOME || "", "Applications/PSeInt.app/Contents/MacOS/pseint"),
  ],
  linux: [
    "/usr/bin/pseint",
    "/usr/local/bin/pseint",
    "/opt/pseint/pseint",
    path.join(process.env.HOME || "", "pseint/pseint"),
    path.join(process.env.HOME || "", ".local/bin/pseint"),
  ],
  win32: [
    "C:\\Program Files\\PSeInt\\pseint.exe",
    "C:\\Program Files (x86)\\PSeInt\\pseint.exe",
    path.join(process.env.LOCALAPPDATA || "", "PSeInt\\pseint.exe"),
  ],
};

function findPseintExecutable(): string | undefined {
  const config = vscode.workspace.getConfiguration("pseint");
  const configuredPath = config.get<string>("executablePath");

  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  const platform = process.platform;
  const paths = KNOWN_PATHS[platform] || [];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}

function getOrCreateTerminal(): vscode.Terminal {
  const existing = vscode.window.terminals.find(
    (t) => t.name === PSEINT_TERMINAL_NAME
  );
  if (existing) {
    return existing;
  }
  return vscode.window.createTerminal(PSEINT_TERMINAL_NAME);
}

async function runPseintFile(uri?: vscode.Uri) {
  const editor = vscode.window.activeTextEditor;
  if (!uri && !editor) {
    vscode.window.showErrorMessage("No hay archivo PSeInt abierto.");
    return;
  }

  const filePath = uri?.fsPath || editor!.document.uri.fsPath;

  if (!filePath.endsWith(".psc")) {
    vscode.window.showWarningMessage("El archivo no es un archivo PSeInt (.psc).");
    return;
  }

  const config = vscode.workspace.getConfiguration("pseint");

  if (config.get<boolean>("saveBeforeRun") && editor?.document.isDirty) {
    await editor.document.save();
  }

  const pseintPath = findPseintExecutable();

  if (!pseintPath) {
    // PSeInt no instalado — usar intérprete embebido automáticamente
    return runWithInterpreter(uri);
  }

  const args = config.get<string[]>("runArgs") || ["--nouser"];
  const terminal = getOrCreateTerminal();

  if (config.get<boolean>("clearTerminalBeforeRun")) {
    const isWin = process.platform === "win32";
    terminal.sendText(isWin ? "cls" : "clear");
  }

  const quotedPath = `"${filePath}"`;
  const command = `"${pseintPath}" ${args.join(" ")} ${quotedPath}`;

  terminal.show(true);
  terminal.sendText(command);
}

async function runWithInterpreter(uri?: vscode.Uri) {
  const editor = vscode.window.activeTextEditor;
  if (!uri && !editor) {
    vscode.window.showErrorMessage("No hay archivo PSeInt abierto.");
    return;
  }

  const document = uri
    ? await vscode.workspace.openTextDocument(uri)
    : editor!.document;

  if (!document.fileName.endsWith(".psc")) {
    vscode.window.showWarningMessage("El archivo no es un archivo PSeInt (.psc).");
    return;
  }

  const config = vscode.workspace.getConfiguration("pseint");
  if (config.get<boolean>("saveBeforeRun") && editor?.document.isDirty) {
    await editor.document.save();
  }

  if (!pseintOutputChannel) {
    pseintOutputChannel = vscode.window.createOutputChannel("PSeInt - Intérprete");
  }

  runtimeDiagnostics?.clear();
  pseintOutputChannel.clear();
  pseintOutputChannel.show(true);
  pseintOutputChannel.appendLine(
    "═══ Ejecutando: " + path.basename(document.fileName) + " ═══\n"
  );

  const source = document.getText();
  const io = new VSCodeIO(pseintOutputChannel);

  try {
    await interpretSource(source, io);
    pseintOutputChannel.appendLine("\n═══ Ejecución completada ═══");
  } catch (error) {
    if (error instanceof PSeIntError) {
      pseintOutputChannel.appendLine(`\n❌ ${error.message}`);
      if (runtimeDiagnostics) {
        const range = new vscode.Range(error.line - 1, 0, error.line - 1, 1000);
        runtimeDiagnostics.set(document.uri, [
          new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error),
        ]);
      }
    } else {
      pseintOutputChannel.appendLine(`\n❌ Error inesperado: ${error}`);
    }
  }
}

function provideDiagnostics(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  if (document.languageId !== "pseint") return;

  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  const blockStack: { keyword: string; line: number }[] = [];

  const openers: Record<string, string> = {
    proceso: "FinProceso",
    algoritmo: "FinAlgoritmo",
    funcion: "FinFuncion",
    subfuncion: "FinFuncion",
    subproceso: "FinSubProceso",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim().toLowerCase();

    if (!trimmed || trimmed.startsWith("//")) continue;

    if (/^(proceso|algoritmo)\s+/.test(trimmed)) {
      blockStack.push({ keyword: trimmed.split(/\s/)[0], line: i });
    } else if (/^(funcion|funci[oó]n)\s+/.test(trimmed)) {
      blockStack.push({ keyword: "funcion", line: i });
    } else if (/^(subproceso|sub\s*proceso)\s+/.test(trimmed)) {
      blockStack.push({ keyword: "subproceso", line: i });
    } else if (/\bentonces\s*$/.test(trimmed) && /^si\b/.test(trimmed)) {
      blockStack.push({ keyword: "si", line: i });
    } else if (/^mientras\b/.test(trimmed)) {
      blockStack.push({ keyword: "mientras", line: i });
    } else if (/^para\b/.test(trimmed)) {
      blockStack.push({ keyword: "para", line: i });
    } else if (/^repetir\s*$/.test(trimmed)) {
      blockStack.push({ keyword: "repetir", line: i });
    } else if (/^segun\b/.test(trimmed) || /^seg[uú]n\b/.test(trimmed)) {
      blockStack.push({ keyword: "segun", line: i });
    }

    const closerMatch = trimmed.match(
      /^(finproceso|finalgoritmo|finfuncion|finfunci[oó]n|finsubproceso|finsi|finmientras|finpara|finsegun|hasta\s+que)\b/
    );
    if (closerMatch) {
      const closer = closerMatch[1].replace(/\s+/g, "");
      const expectedOpener = getOpenerForCloser(closer);

      if (blockStack.length === 0) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, 0, i, line.length),
            `"${line.trim()}" sin bloque de apertura correspondiente`,
            vscode.DiagnosticSeverity.Error
          )
        );
      } else {
        const top = blockStack[blockStack.length - 1];
        if (top.keyword === expectedOpener) {
          blockStack.pop();
        } else {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, 0, i, line.length),
              `Se esperaba cierre para "${top.keyword}" (línea ${top.line + 1}), pero se encontró "${line.trim()}"`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
    }
  }

  for (const unclosed of blockStack) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(unclosed.line, 0, unclosed.line, lines[unclosed.line].length),
        `Bloque "${unclosed.keyword}" sin cerrar`,
        vscode.DiagnosticSeverity.Error
      )
    );
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

function getOpenerForCloser(closer: string): string {
  const map: Record<string, string> = {
    finproceso: "proceso",
    finalgoritmo: "algoritmo",
    finfuncion: "funcion",
    "finfunción": "funcion",
    finsubproceso: "subproceso",
    finsi: "si",
    finmientras: "mientras",
    finpara: "para",
    finsegun: "segun",
    hastaque: "repetir",
  };
  return map[closer] || closer;
}

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("pseint");

  runtimeDiagnostics = vscode.languages.createDiagnosticCollection("pseint-runtime");
  context.subscriptions.push(runtimeDiagnostics);

  context.subscriptions.push(
    vscode.commands.registerCommand("pseint.run", (uri?: vscode.Uri) => {
      return runPseintFile(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pseint.runInterpreter", (uri?: vscode.Uri) => {
      return runWithInterpreter(uri);
    })
  );

  context.subscriptions.push(diagnosticCollection);

  if (vscode.window.activeTextEditor) {
    provideDiagnostics(
      vscode.window.activeTextEditor.document,
      diagnosticCollection
    );
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      provideDiagnostics(e.document, diagnosticCollection);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      provideDiagnostics(doc, diagnosticCollection);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    })
  );
}

export function deactivate() {}
