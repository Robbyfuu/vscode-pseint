import type { InterpreterIO } from "../interpreter";
import { Lexer } from "../lexer";
import { Parser } from "../parser";
import { Interpreter } from "../interpreter";

export class MockIO implements InterpreterIO {
  output: string[] = [];
  inputs: (string | undefined)[] = [];
  private inputIndex = 0;

  write(text: string): void {
    this.output.push(text);
  }

  async read(_prompt: string): Promise<string | undefined> {
    return this.inputs[this.inputIndex++];
  }

  getFullOutput(): string {
    return this.output.join("");
  }
}

export async function run(
  source: string,
  inputs: (string | undefined)[] = []
): Promise<MockIO> {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const io = new MockIO();
  io.inputs = inputs;
  const interpreter = new Interpreter(io);
  await interpreter.execute(program);
  return io;
}
