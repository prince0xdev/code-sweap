import * as vscode from "vscode";
import { removeHtmlComments } from "./html";

export class Parser {
  private delimiters: string[] = [];
  private removeRanges: boolean[] = [];
  private multilineComments: boolean = false;
  private languageCode: string = "";

  private config: any =
    vscode.workspace.getConfiguration("remove-comments").multilineComments;

  public edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
  public uri: any;
  public supportedLanguage = true;

  public SetRegex(activeEditor: vscode.TextEditor, languageCode: string) {
    this.languageCode = languageCode;
    if (this.setDelimiter(languageCode)) {
      this.edit = new vscode.WorkspaceEdit();
      this.uri = activeEditor.document.uri;
    } else {
      vscode.window.showInformationMessage(
        "Cannot remove comments : unknown language (" + languageCode + ")"
      );
    }
  }

  public FindSingleLineComments(activeEditor: vscode.TextEditor): any {
    for (let l = 0; l < activeEditor.document.lineCount; l++) {
      const line = activeEditor.document.lineAt(l);
      const lineText = line.text;

      let matched = false;
      for (let i = 0; i < this.delimiters.length && !matched; i++) {
        const delimiter = this.delimiters[i];

        const cleanedLine = this.removeCommentOutsideString(
          lineText,
          delimiter
        );

        if (cleanedLine !== lineText) {
          const startPos = new vscode.Position(l, cleanedLine.length);
          const endPos = new vscode.Position(l, lineText.length);
          const range = new vscode.Range(startPos, endPos);
          this.edit.delete(this.uri, range);
          matched = true;
        }
      }
    }
  }

  public removeCommentOutsideString(
    lineText: string,
    commentDelimiter: string
  ): string {
    let insideString = false;
    let stringChar = "";
    for (let i = 0; i < lineText.length; i++) {
      const char = lineText[i];
      const next = lineText[i + 1];

      // Gérer ouverture/fermeture de chaînes : ", ', `
      if (!insideString && (char === '"' || char === "'" || char === "`")) {
        insideString = true;
        stringChar = char;
      } else if (insideString && char === stringChar) {
        insideString = false;
        stringChar = "";
      }

      // Si on trouve `//` et qu’on est hors chaîne → c’est un commentaire
      if (
        !insideString &&
        char === commentDelimiter[0] &&
        next === commentDelimiter[1]
      ) {
        return lineText.slice(0, i).trimEnd(); // on supprime le commentaire et ce qui suit
      }
    }

    return lineText; // rien à supprimer
  }

  public FindMultilineComments(activeEditor: vscode.TextEditor): void {
  if (this.languageCode === "html" || this.languageCode === "xml" || this.languageCode === "markdown" || this.languageCode === "vue" || this.languageCode === "svelte") {
    this.FindHtmlComments(activeEditor.document);
    return;
  }
  if (!this.multilineComments) {
    return;
  }

  let text = activeEditor.document.getText();
  let uri = activeEditor.document.uri;
  let regEx: RegExp = /\/\*[\s\S]*?\*\//gm; // Regex plus correcte pour /* ... */
  let match: RegExpExecArray | null;

  while ((match = regEx.exec(text))) {
    let startPos = activeEditor.document.positionAt(match.index);
    let endPos = activeEditor.document.positionAt(match.index + match[0].length);
    let range = new vscode.Range(startPos, endPos);
    this.edit.delete(uri, range);
  }
}

  private FindHtmlComments(document: vscode.TextDocument): void {
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
        const endIdx = text.indexOf(endPattern, startIdx + startPattern.length);
        if (endIdx !== -1) {
          // Commentaire sur une seule ligne
          const startPos = new vscode.Position(lineIndex, startIdx);
          const endPos = new vscode.Position(lineIndex, endIdx + endPattern.length);
          this.edit.delete(this.uri, new vscode.Range(startPos, endPos));
        } else {
          // Début de commentaire multi-lignes
          commentStartPos = new vscode.Position(lineIndex, startIdx);
          insideComment = true;
        }
      }
    } else {
      const endIdx = text.indexOf(endPattern);
      if (endIdx !== -1 && commentStartPos) {
        const endPos = new vscode.Position(lineIndex, endIdx + endPattern.length);
        this.edit.delete(this.uri, new vscode.Range(commentStartPos, endPos));
        insideComment = false;
        commentStartPos = null;
      }
    }
  }
}


  public FindDebugStatements(activeEditor: vscode.TextEditor): void {
    const text = activeEditor.document.getText();
    const uri = activeEditor.document.uri;

    // Expressions à supprimer par langage (tu pourras en ajouter)
    const debugPatterns: { [key: string]: RegExp[] } = {
      javascript: [
        /console\.(log|warn|error|debug|info|trace)\s*\(.*?\);?/g,
        /\bdebugger\b;?/g,
      ],
      typescript: [
        /console\.(log|warn|error|debug|info|trace)\s*\(.*?\);?/g,
        /\bdebugger\b;?/g,
      ],
      javascriptreact: [
        /console\.(log|warn|error|debug|info|trace)\s*\(.*?\);?/g,
        /\bdebugger\b;?/g,
      ],
      typescriptreact: [
        /console\.(log|warn|error|debug|info|trace)\s*\(.*?\);?/g,
        /\bdebugger\b;?/g,
      ],
      python: [/\bprint\s*\(.*?\)/g, /\bpprint\.pprint\s*\(.*?\)/g],
      java: [
        /System\.out\.println\s*\(.*?\);?/g,
        /System\.err\.println\s*\(.*?\);?/g,
      ],
      c: [/printf\s*\(.*?\);?/g],
      cpp: [/printf\s*\(.*?\);?/g, /std::cout\s*<<[^;]+;/g],
      csharp: [
        /Console\.Write(Line)?\s*\(.*?\);?/g,
        /Debug\.Write(Line)?\s*\(.*?\);?/g,
      ],
      php: [
        /echo\s+["'`].*?["'`];?/g,
        /print\s*\(?.*?\)?;?/g,
        /var_dump\s*\(.*?\);?/g,
        /print_r\s*\(.*?\);?/g,
      ],
      ruby: [/\bputs\s+.*$/g, /\bp\s+.*$/g],
      go: [
        /fmt\.Println\s*\(.*?\)/g,
        /fmt\.Printf\s*\(.*?\)/g,
        /log\.(Print|Printf|Println|Fatal|Fatalf|Fataln|Panic|Panicf|Panicln)\s*\(.*?\)/g,
      ],
      dart: [/print\s*\(.*?\);?/g, /debugPrint\s*\(.*?\);?/g],
      kotlin: [/println\s*\(.*?\)/g, /Log\.(d|e|i|v|w)\s*\(.*?\)/g],
      swift: [/print\s*\(.*?\)/g, /NSLog\s*\(.*?\)/g],
      rust: [/println!\s*!\s*\(.*?\);?/g, /eprintln!\s*!\s*\(.*?\);?/g],
      scala: [/println\s*\(.*?\)/g],
      shellscript: [/echo\s+.*$/g],
      powershell: [
        /Write-Host\s+.*$/g,
        /Write-Output\s+.*$/g,
        /Write-Debug\s+.*$/g,
      ],
    };

    const language = this.languageCode;
    const patterns = debugPatterns[language];

    if (!patterns) {
      vscode.window.showInformationMessage(
        `No debug logs defined for language "${language}"`
      );
      return;
    }

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(
          match.index + match[0].length
        );
        const range = new vscode.Range(startPos, endPos);
        this.edit.delete(uri, range);
      }
    }
  }

  private setDelimiter(languageCode: string): boolean {
    this.supportedLanguage = true;
    this.delimiters = [];
    this.removeRanges = [];

    const doubleSlashLanguages = [
      "al",
      "c",
      "cpp",
      "csharp",
      "dart",
      "fsharp",
      "go",
      "haxe",
      "java",
      "javascript",
      "javascriptreact",
      "jsonc",
      "kotlin",
      "less",
      "pascal",
      "objectpascal",
      "php",
      "rust",
      "scala",
      "swift",
      "typescript",
      "typescriptreact",
      "vue",
      "svelte",
    ];

    const hashLanguages = [
      "coffeescript",
      "dockerfile",
      "elixir",
      "graphql",
      "julia",
      "makefile",
      "perl",
      "perl6",
      "powershell",
      "python",
      "r",
      "ruby",
      "shellscript",
      "yaml",
    ];

    const dashDashLanguages = ["ada", "haskell", "plsql", "sql", "lua"];
    const quoteLanguages = ["vb"];
    const percentLanguages = ["erlang", "latex"];
    const semicolonLanguages = ["clojure", "racket", "lisp"];
    const htmlLikeLanguages = ["html", "xml", "markdown", "vue", "svelte"];

    if (doubleSlashLanguages.includes(languageCode)) {
      this.delimiters.push("//");
      this.removeRanges.push(true);
      this.multilineComments = this.config;
    } else if (hashLanguages.includes(languageCode)) {
      this.delimiters.push("#");
      this.removeRanges.push(true);
    } else if (dashDashLanguages.includes(languageCode)) {
      this.delimiters.push("--");
      this.removeRanges.push(true);
    } else if (quoteLanguages.includes(languageCode)) {
      this.delimiters.push("'");
      this.removeRanges.push(true);
    } else if (percentLanguages.includes(languageCode)) {
      this.delimiters.push("%");
      this.removeRanges.push(true);
    } else if (semicolonLanguages.includes(languageCode)) {
      this.delimiters.push(";");
      this.removeRanges.push(true);
    } else if (htmlLikeLanguages.includes(languageCode)) {
      this.delimiters.push("<!--");
      this.removeRanges.push(true);
      this.multilineComments = true;
    } else if (languageCode === "css" || languageCode === "scss") {
      this.multilineComments = true;
      // Single-line non supporté nativement en CSS
    } else if (
      languageCode === "ACUCOBOL" ||
      languageCode === "OpenCOBOL" ||
      languageCode === "COBOL"
    ) {
      this.delimiters.push("\\*>");
      this.removeRanges.push(true);
      this.delimiters.push("^......\\*");
      this.removeRanges.push(false);
      this.multilineComments = false;
    } else {
      this.supportedLanguage = false;
    }

    return this.supportedLanguage;
  }
}
