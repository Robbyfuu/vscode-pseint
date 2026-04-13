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
  index: ExpressionNode;
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
  index: ExpressionNode;
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
  size: ExpressionNode;
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
  | DimensionNode;
