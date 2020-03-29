import { spawn } from 'child_process';
import * as vscode from 'vscode';

export class Configuration {
  readonly ccn: number;
  readonly length: number;
  readonly arguments: number;
  readonly modified: boolean;
  constructor(ccn: number, length: number, parameters: number, modified: boolean) {
    this.ccn = ccn;
    this.length = length;
    this.arguments = parameters;
    this.modified = modified;
  }
}

export async function lint_active_document(limits: Configuration, log_channel: vscode.OutputChannel) {
  if (vscode.window.activeTextEditor === undefined) {
    return { document: undefined, diagnostics: [] };
  }
  return {
    document: vscode.window.activeTextEditor.document,
    diagnostics: await lint_document(
      vscode.window.activeTextEditor.document,
      limits,
      log_channel)
  };
}

export async function lint_document(file: vscode.TextDocument, limits: Configuration, log_channel: vscode.OutputChannel) {
  // TODO Expand this list to include all the languages supported by Lizard.
  if (!['cpp'].includes(file.languageId) || file.uri.scheme !== 'file') {
    return [];
  }
  return create_diagnostics_for_all_output(
    await run_lizard(file.uri.fsPath, limits, log_channel),
    limits,
    file);
}

function run_lizard(file: string, limits: Configuration, log_channel: vscode.OutputChannel): Promise<string> {
  return new Promise((resolve, reject) => {
    const command_arguments = make_lizard_command(limits, file);
    const lizard = "lizard";
    log_channel.appendLine(`> ${lizard} ${command_arguments.join(' ')}`);
    log_channel.show();

    const process = spawn(lizard, command_arguments);
    if (process.pid) {
      let output = "";
      process.stdout.on("data", data => {
        output += data;
      });
      process.stdout.on("end", () => {
        // log_channel.appendLine(output);
        resolve(output);
      });
      process.on("error", err => {
        // log_channel.appendLine(err.message);
        reject(err);
      });
    }
    // else {
    //   log_channel.appendLine("Failed to run Lizard.");
    // }
  });
}

function make_lizard_command(limits: Configuration, file: string | undefined) {
  let command_arguments: string[] = ["--warnings_only"];
  if (limits.modified) {
    command_arguments.push("--modified");
  }
  if (limits.ccn !== 0) {
    command_arguments.push(`--CCN=${limits.ccn}`);
  }
  if (limits.length !== 0) {
    command_arguments.push(`--length=${limits.length}`);
  }
  if (limits.arguments !== 0) {
    command_arguments.push(`--arguments=${limits.arguments}`);
  }
  if (file !== undefined) {
    command_arguments.push(file);
  }
  return command_arguments;
}

function create_diagnostics_for_all_output(process_output: string, limits: Configuration, file: vscode.TextDocument): vscode.Diagnostic[] {
  const lines = process_output.split('\n');
  let diagnostics: vscode.Diagnostic[] = [];
  for (let line of lines) {
    if (line.length !== 0) {
      diagnostics = diagnostics.concat(
        create_diagnostics_for_one_line(extract_details(line), limits, file));
    }
  }
  for (let diagnostic of diagnostics) {
    diagnostic.source = "Lizard";
  }
  return diagnostics;
}

class Details {
  readonly full_function_name: string; // Function name with namespaces.
  readonly function_name: string; // Function name without namespaces.
  readonly line_number: number;
  readonly ccn: number;
  readonly length: number;
  readonly arguments: number;
  constructor(full_function_name: string, line_number: number, ccn: number, length: number, parameters: number) {
    this.full_function_name = full_function_name;
    this.function_name = extract_function_name(full_function_name);
    this.line_number = line_number;
    this.ccn = ccn;
    this.length = length;
    this.arguments = parameters;
  }
}

function extract_function_name(full_function_name: string): string {
  const index = full_function_name.lastIndexOf(":");
  if (index === undefined) {
    return full_function_name;
  }
  return full_function_name.substr(index + 1);
}

function create_diagnostics_for_one_line(details: Details, limits: Configuration, file: vscode.TextDocument): vscode.Diagnostic[] {
  let diagnostics: vscode.Diagnostic[] = [];
  if (limits.ccn !== undefined && details.ccn > limits.ccn) {
    diagnostics.push(create_ccn_diagnostic(details, file, limits.ccn));
  }
  if (limits.length !== undefined && details.length > limits.length) {
    diagnostics.push(create_length_diagnostic(details, file, limits.length));
  }
  if (limits.arguments !== undefined && details.arguments > limits.arguments) {
    diagnostics.push(create_parameters_diagnostic(details, file, limits.arguments));
  }
  return diagnostics;
}

function create_ccn_diagnostic(details: Details, file: vscode.TextDocument, limit: number) {
  return new vscode.Diagnostic(
    get_function_range(details, file),
    `${details.function_name} has ${details.ccn} CCN; the maximum is ${limit}.`,
    vscode.DiagnosticSeverity.Warning);
}

function create_length_diagnostic(details: Details, file: vscode.TextDocument, limit: number) {
  return new vscode.Diagnostic(
    get_function_range(details, file),
    `${details.function_name} has ${details.length} length; the maximum is ${limit}.`,
    vscode.DiagnosticSeverity.Warning);
}

function create_parameters_diagnostic(details: Details, file: vscode.TextDocument, limit: number) {
  return new vscode.Diagnostic(
    get_function_range(details, file),
    `${details.function_name} has ${details.arguments} parameters; the maximum is ${limit}.`,
    vscode.DiagnosticSeverity.Warning);
}

function extract_details(line: string): Details {
  return new Details(
    line.split(" ")[2],
    parseInt(line.split(":")[1]) - 1,
    extract_value(line, /[0-9]+ CCN/),
    extract_value(line, /[0-9]+ length/),
    extract_value(line, /[0-9]+ PARAM/)
  );
}

function get_function_range(details: Details, file: vscode.TextDocument): vscode.Range {
  const line_text = file.lineAt(details.line_number).text;
  const start_character = line_text.search(details.function_name);
  if (start_character >= line_text.length) {
    return new vscode.Range(details.line_number, 0, details.line_number, 0);
  }
  const range = file.getWordRangeAtPosition(
    new vscode.Position(details.line_number, start_character),
    RegExp(details.function_name));
  if (range === undefined) {
    return new vscode.Range(details.line_number, 0, details.line_number, 0);
  }
  return range;
}

function extract_value(text: string, parameter_regex: RegExp) {
  let matches = text.match(parameter_regex);
  if (matches === null) {
    return 0;
  }
  return parseInt(matches[0].split(' ')[0]);
}
