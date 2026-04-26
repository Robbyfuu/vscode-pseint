// ── Operator Types ──────────────────────────────────────────────────

export type BinaryOperator =
  | "+" | "-" | "*" | "/" | "^" | "%" | "mod"
  | "=" | "<>" | "<" | ">" | "<=" | ">="
  | "y" | "o" | "&" | "|" | "and" | "or";

export type UnaryOperator = "-" | "+" | "no" | "!" | "~";

// ── Expression Nodes ────────────────────────────────────────────────

export interface NumberLiteralNode {
  kind: "number_literal";
  value: number;
  line: number;
}

export interface StringLiteralNode {
  kind: "string_literal";
  value: string;
  line: number;
}

export interface BooleanLiteralNode {
  kind: "boolean_literal";
  value: boolean;
  line: number;
}

export interface IdentifierNode {
  kind: "identifier";
  name: string;
  line: number;
}

export interface ArrayAccessNode {
  kind: "array_access";
  name: string;
  /** N-dimensional indices (1D = array of length 1, 2D matrix = length 2, etc.). */
  indices: ExpressionNode[];
  line: number;
}

export interface BinaryExpressionNode {
  kind: "binary_expression";
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
  line: number;
}

export interface UnaryExpressionNode {
  kind: "unary_expression";
  operator: UnaryOperator;
  operand: ExpressionNode;
  line: number;
}

export interface FunctionCallNode {
  kind: "function_call";
  name: string;
  args: ExpressionNode[];
  line: number;
}

// ── Statement Nodes ─────────────────────────────────────────────────

export interface ProgramNode {
  kind: "program";
  name: string;
  body: StatementNode[];
  subprograms: SubProcDeclNode[];
  line: number;
}

export interface ParamSpec {
  name: string;
  mode: "value" | "ref";
  /** Optional explicit type ("entero", "real", "cadena", "logico", "caracter") */
  type?: string;
}

export interface SubProcDeclNode {
  kind: "subproc_decl";
  name: string;
  /** Name of the return variable (Funcion). null if no return (SubProceso without return). */
  returnVar: string | null;
  /** Optional explicit return type, when declared with "Como X" */
  returnType?: string;
  params: ParamSpec[];
  body: StatementNode[];
  line: number;
}

export interface CallStatementNode {
  kind: "call_stmt";
  name: string;
  args: ExpressionNode[];
  line: number;
}

export interface ReturnNode {
  kind: "return";
  value: ExpressionNode | null;
  line: number;
}

export interface DefineNode {
  kind: "define";
  variables: string[];
  /** Normalized PSeInt type name from parser (e.g., "entero", "real", "cadena", "logico", "caracter") */
  type: string;
  line: number;
}

export interface AssignNode {
  kind: "assign";
  target: string;
  value: ExpressionNode;
  line: number;
}

export interface ArrayAssignNode {
  kind: "array_assign";
  name: string;
  /** N-dimensional indices (1D = array of length 1, 2D matrix = length 2, etc.). */
  indices: ExpressionNode[];
  value: ExpressionNode;
  line: number;
}

export interface WriteNode {
  kind: "write";
  expressions: ExpressionNode[];
  newline: boolean;
  line: number;
}

export interface ReadNode {
  kind: "read";
  variables: string[];
  line: number;
}

export interface IfNode {
  kind: "if";
  condition: ExpressionNode;
  thenBranch: StatementNode[];
  elseBranch: StatementNode[];
  line: number;
}

export interface WhileNode {
  kind: "while";
  condition: ExpressionNode;
  body: StatementNode[];
  line: number;
}

export interface ForNode {
  kind: "for";
  variable: string;
  from: ExpressionNode;
  to: ExpressionNode;
  step: ExpressionNode;
  body: StatementNode[];
  line: number;
}

export interface RepeatNode {
  kind: "repeat";
  body: StatementNode[];
  condition: ExpressionNode;
  line: number;
}

export interface SwitchCase {
  values: ExpressionNode[];
  body: StatementNode[];
}

export interface SwitchNode {
  kind: "switch";
  expression: ExpressionNode;
  cases: SwitchCase[];
  defaultCase: StatementNode[];
  line: number;
}

export interface DimensionNode {
  kind: "dimension";
  name: string;
  /** N-dimensional sizes (1D = array of length 1, 2D matrix = length 2, etc.). */
  sizes: ExpressionNode[];
  line: number;
}

export interface ClearScreenNode {
  kind: "clear_screen";
  line: number;
}

export interface WaitKeyNode {
  kind: "wait_key";
  line: number;
}

export interface WaitSecondsNode {
  kind: "wait_seconds";
  seconds: ExpressionNode;
  line: number;
}

// ── Union Types ─────────────────────────────────────────────────────

export type ExpressionNode =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | IdentifierNode
  | ArrayAccessNode
  | BinaryExpressionNode
  | UnaryExpressionNode
  | FunctionCallNode;

export type StatementNode =
  | DefineNode
  | AssignNode
  | ArrayAssignNode
  | WriteNode
  | ReadNode
  | IfNode
  | WhileNode
  | ForNode
  | RepeatNode
  | SwitchNode
  | DimensionNode
  | CallStatementNode
  | ReturnNode
  | ClearScreenNode
  | WaitKeyNode
  | WaitSecondsNode;
