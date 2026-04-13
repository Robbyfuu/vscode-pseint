import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, InterpreterIO } from "./interpreter";

export { InterpreterIO } from "./interpreter";
export { PSeIntError } from "./errors";

export async function interpretSource(
  source: string,
  io: InterpreterIO
): Promise<void> {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const program = parser.parse();
  const interpreter = new Interpreter(io);
  await interpreter.execute(program);
}
