export class PSeIntError extends Error {
  constructor(
    message: string,
    public readonly line: number,
    public readonly column: number = 0
  ) {
    super(`Error en línea ${line}: ${message}`);
    this.name = "PSeIntError";
  }
}
