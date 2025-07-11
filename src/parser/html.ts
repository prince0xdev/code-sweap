import * as vscode from "vscode";

// Removes HTML-style comments <!-- comment --> from document
export function removeHtmlComments(
  document: vscode.TextDocument,
  edit: vscode.WorkspaceEdit
) {
  const startPattern = "<!--";
  const endPattern = "-->";

  let insideComment = false;
  let commentStartPos: vscode.Position | null = null;

  for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
    const line = document.lineAt(lineIndex);
    const text = line.text;

    if (!insideComment) {
      const startIdx = text.indexOf(startPattern);
      if (startIdx !== -1) {
        const endIdx = text.indexOf(endPattern, startIdx + 4);
        if (endIdx !== -1) {
          // Comment starts and ends on same line
          const startPos = new vscode.Position(lineIndex, startIdx);
          const endPos = new vscode.Position(lineIndex, endIdx + 3);
          edit.delete(document.uri, new vscode.Range(startPos, endPos));
        } else {
          // Start of multi-line comment
          commentStartPos = new vscode.Position(lineIndex, startIdx);
          insideComment = true;
        }
      }
    } else {
      const endIdx = text.indexOf(endPattern);
      if (endIdx !== -1 && commentStartPos) {
        const endPos = new vscode.Position(lineIndex, endIdx + 3);
        edit.delete(document.uri, new vscode.Range(commentStartPos, endPos));
        insideComment = false;
        commentStartPos = null;
      }
    }
  }
}
