import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execFile } from "child_process";

const PSEINT_TERMINAL_NAME = "PSeInt";

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
    const action = await vscode.window.showErrorMessage(
      "No se encontró el ejecutable de PSeInt. ¿Desea configurar la ruta manualmente?",
      "Configurar ruta",
      "Abrir con PSeInt App",
      "Cancelar"
    );

    if (action === "Configurar ruta") {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        title: "Seleccionar ejecutable de PSeInt",
      });
      if (selected?.[0]) {
        await config.update("executablePath", selected[0].fsPath, true);
        runPseintFile(uri);
      }
      return;
    }

    if (action === "Abrir con PSeInt App") {
      openWithPseintApp(filePath);
      return;
    }

    return;
  }

  const args = config.get<string[]>("runArgs") || ["--nouser"];
  const terminal = getOrCreateTerminal();

  if (config.get<boolean>("clearTerminalBeforeRun")) {
    terminal.sendText("clear");
  }

  const quotedPath = `"${filePath}"`;
  const command = `"${pseintPath}" ${args.join(" ")} ${quotedPath}`;

  terminal.show(true);
  terminal.sendText(command);
}

function openWithPseintApp(filePath: string) {
  const platform = process.platform;

  if (platform === "darwin") {
    const appPaths = [
      "/Applications/PSeInt.app",
      path.join(process.env.HOME || "", "Applications/PSeInt.app"),
    ];

    const appPath = appPaths.find((p) => fs.existsSync(p));

    if (appPath) {
      execFile("open", ["-a", appPath, filePath], (err) => {
        if (err) {
          vscode.window.showErrorMessage(`Error al abrir PSeInt: ${err.message}`);
        }
      });
    } else {
      vscode.window.showErrorMessage(
        "No se encontró PSeInt.app. Instala PSeInt desde: http://pseint.sourceforge.net/"
      );
    }
  } else if (platform === "linux") {
    execFile("xdg-open", [filePath], (err) => {
      if (err) {
        vscode.window.showErrorMessage(`Error al abrir archivo: ${err.message}`);
      }
    });
  } else if (platform === "win32") {
    execFile("cmd", ["/c", "start", "", filePath], (err) => {
      if (err) {
        vscode.window.showErrorMessage(`Error al abrir archivo: ${err.message}`);
      }
    });
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

  context.subscriptions.push(
    vscode.commands.registerCommand("pseint.run", (uri?: vscode.Uri) => {
      runPseintFile(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pseint.runSelection", () => {
      vscode.window.showInformationMessage(
        "Ejecutar selección aún no implementado."
      );
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
