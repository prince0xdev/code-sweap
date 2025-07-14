import * as vscode from "vscode";
import { Parser } from "./parser/parser";

// Called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  const parser = new Parser();

  async function applyEditAndFormat(editor: vscode.TextEditor) {
    await vscode.workspace.applyEdit(parser.edit);
    await vscode.commands.executeCommand("editor.action.formatDocument");
  }

  // Command to remove all comments
  const removeAllCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeAllComments",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      parser.SetRegex(editor, editor.document.languageId);
      parser.FindSingleLineComments(editor);
      parser.FindMultilineComments(editor);

      await applyEditAndFormat(editor);
    }
  );

  // Command to remove single-line comments only
  const removeSingleLineCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeSingleLineComments",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      parser.SetRegex(editor, editor.document.languageId);
      parser.FindSingleLineComments(editor);

      await applyEditAndFormat(editor);
    }
  );

  // Command to remove multiline comments only
  const removeMultilineCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeMultilineComments",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      parser.SetRegex(editor, editor.document.languageId);
      parser.FindMultilineComments(editor);

      await applyEditAndFormat(editor);
    }
  );

  // Command to remove debug logs only
  const removeDebugLogsCommand = vscode.commands.registerCommand(
    "codesweep.removeDebugLogs",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      parser.SetRegex(editor, editor.document.languageId);
      parser.FindDebugStatements(editor);

      await applyEditAndFormat(editor);
    }
  );

  // Command to clean code (multiline comments + debug logs)
  const cleanCode = vscode.commands.registerCommand(
    "codesweep.cleanCode",
    async () => {
      await vscode.commands.executeCommand("codesweep.removeMultilineComments");
      await vscode.commands.executeCommand("codesweep.removeDebugLogs");
    }
  );

  // Push commands to context
  context.subscriptions.push(
    cleanCode,
    removeAllCommentsCommand,
    removeSingleLineCommentsCommand,
    removeMultilineCommentsCommand,
    removeDebugLogsCommand
  );
}

export function deactivate() {}
