import * as vscode from "vscode";
import { InterpreterIO } from "./interpreter";

export class VSCodeIO implements InterpreterIO {
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  write(text: string): void {
    this.outputChannel.append(text);
  }

  async read(prompt: string): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt: `PSeInt - Ingrese valor para: ${prompt}`,
      placeHolder: "Escriba su respuesta aquí...",
      ignoreFocusOut: true,
    });
  }

  clear(): void {
    this.outputChannel.clear();
  }

  async waitForKey(): Promise<void> {
    await vscode.window.showInputBox({
      prompt: "Presiona Enter para continuar...",
      ignoreFocusOut: true,
    });
  }
}
