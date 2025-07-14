import * as vscode from "vscode";
import { Parser } from "./parser/parser";

// Called when the extension is activated
export function activate(context: vscode.ExtensionContext) {
  const parser = new Parser();

  // Command to remove all comments
  const removeAllCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeAllComments",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      parser.SetRegex(editor, editor.document.languageId);
      parser.FindSingleLineComments(editor);
      parser.FindMultilineComments(editor);
      vscode.workspace.applyEdit(parser.edit);
    }
  );

  // Command to remove single-line comments only
  const removeSingleLineCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeSingleLineComments",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      parser.SetRegex(editor, editor.document.languageId);
      parser.FindSingleLineComments(editor);
      vscode.workspace.applyEdit(parser.edit);
    }
  );

  // Command to remove multiline comments only
  const removeMultilineCommentsCommand = vscode.commands.registerCommand(
    "codesweep.removeMultilineComments",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      parser.SetRegex(editor, editor.document.languageId);
      parser.FindMultilineComments(editor);
      vscode.workspace.applyEdit(parser.edit);
    }
  );

  const removeDebugLogsCommand = vscode.commands.registerCommand(
    "codesweep.removeDebugLogs",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      parser.SetRegex(editor, editor.document.languageId);
      parser.FindDebugStatements(editor);
      vscode.workspace.applyEdit(parser.edit);
    }
  );


  const cleanCode = vscode.commands.registerCommand("codesweep.cleanCode", async () => {
  await vscode.commands.executeCommand("codesweep.removeMultilineComments");
  await vscode.commands.executeCommand("codesweep.removeDebugLogs");
});


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
