import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const IMPORT_PATTERNS = [
  /import\s+.*\s+from\s+['"]([^'"]+\.(?:scss|css|sass|less|js|ts|jsx|tsx|json|vue))['"]/g,
  /import\s+['"]([^'"]+\.(?:scss|css|sass|less|js|ts|jsx|tsx|json|vue))['"]/g,
  /require\(['"]([^'"]+\.(?:scss|css|sass|less|js|ts|jsx|tsx|json|vue))['"]\)/g,
  /@import\s+['"]([^'"]+\.(?:scss|css|sass|less|js|ts|jsx|tsx|json|vue))['"]/g,
];

const translate = (ru: string, en: string) =>
  vscode.env.language.startsWith("ru") ? ru : en;

export function activate(context: vscode.ExtensionContext) {
  console.log(`Create Missing Files is now active! (locale: ${vscode.env.language})`);

  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      "javascript",
      "typescript",
      "javascriptreact",
      "typescriptreact",
      "vue",
      "html",
    ],
    {
      provideHover(document, position) {
        const lineText = document.lineAt(position.line).text;

        for (const pattern of IMPORT_PATTERNS) {
          const match = pattern.exec(lineText);
          if (match && match[1]) {
            const importPath = match[1];
            const filePath = getFullPath(document, importPath);

            if (filePath && !fs.existsSync(filePath)) {
              const hoverContent = new vscode.MarkdownString(
                `**${importPath}** ${translate("не существует", "does not exist")}.\n\n` +
                  `[✨ ${translate("Создать файл", "Create File")}](command:create-missing-files.createFile?${encodeURIComponent(
                    JSON.stringify({ filePath, importPath }),
                  )})`,
              );
              hoverContent.isTrusted = true;

              const wordRange = document.getWordRangeAtPosition(
                position,
                /[^\s'"]+\.(?:scss|css|sass|less|js|ts|jsx|tsx|json|vue)/,
              );
              return new vscode.Hover(hoverContent, wordRange);
            }
          }
        }
        return null;
      },
    },
  );

  const createFileCommand = vscode.commands.registerCommand(
    "create-missing-files.createFile",
    async (args) => {
      const { filePath, importPath } = args;

      try {
        const config = vscode.workspace.getConfiguration("createMissingFiles");
        const autoCreate = config.get("autoCreate", false);

        let shouldCreate = autoCreate;

        const alwaysCreateLabel = translate("Всегда создавать автоматически", "Always create automatically");

        if (!autoCreate) {
          const action = await vscode.window.showWarningMessage(
            `"${importPath}" ${translate("не существует. Создать?", "does not exist. Create?")}`,
            "Yes",
            "No",
            alwaysCreateLabel,
          );

          if (action === alwaysCreateLabel) {
            await config.update(
              "autoCreate",
              true,
              vscode.ConfigurationTarget.Global,
            );
            shouldCreate = true;
          } else if (action === "Yes") {
            shouldCreate = true;
          } else {
            return;
          }
        }

        if (shouldCreate) {
          await createFile(filePath, importPath);
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    },
  );

  const codeLensProvider = vscode.languages.registerCodeLensProvider(
    ["javascript", "typescript", "javascriptreact", "typescriptreact"],
    {
      provideCodeLenses(document) {
        const codeLenses: vscode.CodeLens[] = [];
        const text = document.getText();

        for (const pattern of IMPORT_PATTERNS) {
          let match;
          pattern.lastIndex = 0;

          while ((match = pattern.exec(text)) !== null) {
            const importPath = match[1];
            const filePath = getFullPath(document, importPath);

            if (filePath && !fs.existsSync(filePath)) {
              const startPos = document.positionAt(match.index);
              const endPos = document.positionAt(match.index + match[0].length);
              const range = new vscode.Range(startPos, endPos);

              const codeLens = new vscode.CodeLens(range, {
                title: `✨ ${translate("Создать файл", "Create File")}`,
                command: "create-missing-files.createFile",
                arguments: [{ filePath, importPath }],
              });
              codeLenses.push(codeLens);
            }
          }
        }
        return codeLenses;
      },
    },
  );

  context.subscriptions.push(
    hoverProvider,
    createFileCommand,
    codeLensProvider,
  );
}

function getFullPath(
  document: vscode.TextDocument,
  importPath: string,
): string | null {
  if (importPath.startsWith(".")) {
    const dir = path.dirname(document.uri.fsPath);
    return path.join(dir, importPath);
  }

  const config = vscode.workspace.getConfiguration("createMissingFiles");
  const aliases = config.get<Record<string, string>>("aliases", {});
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  for (const [alias, target] of Object.entries(aliases)) {
    if (!workspaceFolder) break;
    
    if (importPath.startsWith(alias + "/") || importPath === alias) {
      const relativePath = importPath.slice(alias.length + 1);
      return path.join(workspaceFolder, target, relativePath);
    }
  }

  return null;
}

async function createFile(filePath: string, importPath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  await fs.promises.writeFile(filePath, "");
  vscode.window.showInformationMessage(`✅ ${translate("Создано:", "Created:")} ${importPath}`);

  const document = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(document);
}

export function deactivate() {}
