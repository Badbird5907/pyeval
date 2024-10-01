/*
 * Copyright (c) Eric Traut
 * Wrapper interface around the monaco editor component. This class
 * handles language server interactions, the display of errors, etc.
 */

import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
/*
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
*/

import {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Diagnostic,
  DiagnosticSeverity,
  InsertReplaceEdit,
  MarkupContent,
  Range,
  SignatureInformation,
  TextDocumentEdit,
} from "vscode-languageserver-types";
import { LspClient } from "@/components/editor/lsp/lsp-client";
import { useTheme } from "@/components/theme-provider";

loader
  .init()
  .then((monaco) => {
    monaco.languages.registerHoverProvider("python", {
      provideHover: handleHoverRequest,
    });
    monaco.languages.registerSignatureHelpProvider("python", {
      provideSignatureHelp: handleSignatureHelpRequest,
      signatureHelpTriggerCharacters: ["(", ","],
    });
    monaco.languages.registerCompletionItemProvider("python", {
      provideCompletionItems: handleProvideCompletionRequest,
      resolveCompletionItem: handleResolveCompletionRequest,
      triggerCharacters: [".", "[", '"', "'"],
    });
    monaco.languages.registerRenameProvider("python", {
      provideRenameEdits: handleRenameRequest,
    });
  })
  .catch((error) =>
    console.error("An error occurred during initialization of Monaco: ", error),
  );

const options: monaco.editor.IStandaloneEditorConstructionOptions = {
  selectOnLineNumbers: true,
  minimap: { enabled: false },
  fixedOverflowWidgets: true,
  tabCompletion: "on",
  hover: { enabled: true },
  scrollBeyondLastLine: false,
  autoClosingOvertype: "always",
  autoSurround: "quotes",
  autoIndent: "full",
  // The default settings prefer "Menlo", but "Monaco" looks better
  // for our purposes. Swap the order so Monaco is used if available.
  // fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  showUnused: true,
  wordBasedSuggestions: "off",
  overviewRulerLanes: 0,
  renderWhitespace: "none",
  guides: {
    indentation: false,
  },
  renderLineHighlight: "none",
};

interface RegisteredModel {
  model: monaco.editor.ITextModel;
  lspClient: LspClient<never>;
}
const registeredModels: RegisteredModel[] = [];

export interface MonacoEditorProps {
  lspClient: LspClient<never>;
  code: string;
  diagnostics: Diagnostic[];

  onUpdateCode: (code: string) => void;
}

export interface MonacoEditorRef {
  focus: () => void;
  selectRange: (range: Range) => void;
}

export const MonacoEditor = forwardRef(function MonacoEditor(
  props: MonacoEditorProps,
  ref: ForwardedRef<MonacoEditorRef>,
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const { theme } = useTheme();

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
  ) {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    editor.focus();
  }

  useImperativeHandle(ref, () => {
    return {
      focus: () => {
        const editor = editorRef.current;
        if (editor) {
          editor.focus();
        }
      },
      selectRange: (range: Range) => {
        const editor = editorRef.current;
        if (editor) {
          const monacoRange = convertRange(range);
          editor.setSelection(monacoRange);
          editor.revealLineInCenterIfOutsideViewport(
            monacoRange.startLineNumber,
          );
        }
      },
    };
  });

  useEffect(() => {
    if (monacoRef?.current && editorRef?.current) {
      const model = editorRef.current.getModel()!;
      setFileMarkers(monacoRef.current, model, props.diagnostics);

      // Register the editor and the LSP Client so they can be accessed
      // by the hover provider, etc.
      registerModel(model, props.lspClient);
    }
  }, [props.diagnostics]);

  return (
    <Editor
      options={options}
      language={"python"}
      height={"100%"}
      width={"100%"}
      value={props.code}
      theme={theme === "dark" ? "vs-dark" : "vs"}
      onChange={(value) => {
        props.onUpdateCode(value ?? "");
      }}
      onMount={handleEditorDidMount}
    />
  );
});

function setFileMarkers(
  monacoInstance: typeof monaco,
  model: monaco.editor.ITextModel,
  diagnostics: Diagnostic[],
) {
  const markers: monaco.editor.IMarkerData[] = [];

  diagnostics.forEach((diag) => {
    const markerData: monaco.editor.IMarkerData = {
      ...convertRange(diag.range),
      severity: convertSeverity(diag.severity!),
      message: diag.message,
    };

    if (diag.tags) {
      markerData.tags = diag.tags;
    }
    markers.push(markerData);
  });

  monacoInstance.editor.setModelMarkers(model, "pyright", markers);
}

function convertSeverity(severity: DiagnosticSeverity): monaco.MarkerSeverity {
  switch (severity) {
    case DiagnosticSeverity.Error:
    default:
      return monaco.MarkerSeverity.Error;

    case DiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;

    case DiagnosticSeverity.Information:
      return monaco.MarkerSeverity.Info;

    case DiagnosticSeverity.Hint:
      return monaco.MarkerSeverity.Hint;
  }
}

function convertRange(range?: Range): monaco.IRange {
  if (!range) {
    return {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    };
  }
  return {
    startLineNumber: range.start.line + 1,
    startColumn: range.start.character + 1,
    endLineNumber: range.end.line + 1,
    endColumn: range.end.character + 1,
  };
}

async function handleHoverRequest(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): Promise<monaco.languages.Hover | null> {
  const lspClient = getLspClientForModel(model);
  if (!lspClient) {
    return null;
  }
  try {
    const hoverInfo = await lspClient.getHoverInfo(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    });

    return {
      contents: [
        {
          value: (hoverInfo?.contents as MarkupContent).value,
        },
      ],
      range: convertRange(hoverInfo?.range),
    };
  } catch {
    return null;
  }
}

async function handleRenameRequest(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  newName: string,
): Promise<monaco.languages.WorkspaceEdit | null> {
  const lspClient = getLspClientForModel(model);
  if (!lspClient) {
    return null;
  }

  try {
    const renameEdits = await lspClient.getRenameEdits(
      model.getValue(),
      {
        line: position.lineNumber - 1,
        character: position.column - 1,
      },
      newName,
    );

    const edits: monaco.languages.IWorkspaceTextEdit[] = [];

    if (renameEdits?.documentChanges) {
      for (const docChange of renameEdits.documentChanges) {
        if (TextDocumentEdit.is(docChange)) {
          for (const textEdit of docChange.edits) {
            edits.push({
              resource: model.uri,
              versionId: undefined,
              textEdit: {
                range: convertRange(textEdit.range),
                text: textEdit.newText,
              },
            });
          }
        }
      }
    }

    return { edits };
  } catch {
    return null;
  }
}

async function handleSignatureHelpRequest(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): Promise<monaco.languages.SignatureHelpResult | null> {
  const lspClient = getLspClientForModel(model);
  if (!lspClient) {
    return null;
  }

  try {
    const sigInfo = await lspClient.getSignatureHelp(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    });

    return {
      value: {
        signatures: sigInfo?.signatures.map((sig: SignatureInformation) => {
          return {
            label: sig.label,
            documentation: sig.documentation,
            parameters: sig.parameters,
            activeParameter: sig.activeParameter,
          };
        }) as monaco.languages.SignatureInformation[], // fuck it x2
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        activeSignature: sigInfo?.activeSignature!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        activeParameter: sigInfo?.activeParameter!,
      },
      dispose: () => {},
    };
  } catch {
    return null;
  }
}

async function handleProvideCompletionRequest(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): Promise<monaco.languages.CompletionList | null> {
  const lspClient = getLspClientForModel(model);
  if (!lspClient) {
    return null;
  }

  try {
    const completionInfo = (await lspClient.getCompletion(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    })) as CompletionList;

    return {
      suggestions: completionInfo.items.map((item) => {
        return convertCompletionItem(item, model);
      }),
      incomplete: completionInfo.isIncomplete,
      dispose: () => {},
    };
  } catch {
    return null;
  }
}

type CompletionItemWithModelAndOriginal = monaco.languages.CompletionItem & {
  model: monaco.editor.ITextModel;
  __original: CompletionItem;
};
async function handleResolveCompletionRequest(
  item: monaco.languages.CompletionItem,
): Promise<monaco.languages.CompletionItem | null> {
  const model = (item as CompletionItemWithModelAndOriginal).model as
    | monaco.editor.ITextModel
    | undefined;
  const original = (item as CompletionItemWithModelAndOriginal).__original as
    | CompletionItem
    | undefined;
  if (!model || !original) {
    return null;
  }

  const lspClient = getLspClientForModel(model);
  if (!lspClient) {
    return null;
  }

  try {
    const result = await lspClient.resolveCompletion(original);
    return convertCompletionItem(result!);
  } catch {
    return null;
  }
}

function convertCompletionItem(
  item: CompletionItem,
  model?: monaco.editor.ITextModel,
): monaco.languages.CompletionItem {
  const converted: monaco.languages.CompletionItem = {
    label: item.label,
    kind: convertCompletionItemKind(item.kind),
    tags: item.tags,
    detail: item.detail,
    documentation: item.documentation,
    sortText: item.sortText,
    filterText: item.filterText,
    preselect: item.preselect,
    insertText: item.label,
    range: undefined as unknown as monaco.IRange, // hack
  };

  if (item.textEdit) {
    converted.insertText = item.textEdit.newText;
    if (InsertReplaceEdit.is(item.textEdit)) {
      converted.range = {
        insert: convertRange(item.textEdit.insert),
        replace: convertRange(item.textEdit.replace),
      };
    } else {
      converted.range = convertRange(item.textEdit.range);
    }
  }

  if (item.additionalTextEdits) {
    converted.additionalTextEdits = item.additionalTextEdits.map((edit) => {
      return {
        range: convertRange(edit.range),
        text: edit.newText,
      };
    });
  }

  // Stash a few additional pieces of information.
  (converted as CompletionItemWithModelAndOriginal).__original = item;
  if (model) {
    (converted as CompletionItemWithModelAndOriginal).model = model;
  }

  return converted;
}
function convertCompletionItemKind(
  itemKind: CompletionItemKind | undefined,
): monaco.languages.CompletionItemKind {
  switch (itemKind) {
    case CompletionItemKind.Constant:
      return monaco.languages.CompletionItemKind.Constant;

    case CompletionItemKind.Variable:
      return monaco.languages.CompletionItemKind.Variable;

    case CompletionItemKind.Function:
      return monaco.languages.CompletionItemKind.Function;

    case CompletionItemKind.Field:
      return monaco.languages.CompletionItemKind.Field;

    case CompletionItemKind.Keyword:
      return monaco.languages.CompletionItemKind.Keyword;

    default:
      return monaco.languages.CompletionItemKind.Reference;
  }
}

// Register an instantiated text model (which backs a monaco editor
// instance and its associated LSP client. This is a bit of a hack,
// but it's required to support the various providers (e.g. hover).
function registerModel(
  model: monaco.editor.ITextModel,
  lspClient: LspClient<never>,
) {
  if (registeredModels.find((m) => m.model === model)) {
    return;
  }

  registeredModels.push({ model, lspClient });
}

function getLspClientForModel(
  model: monaco.editor.ITextModel,
): LspClient<never> | undefined {
  return registeredModels.find((m) => m.model === model)?.lspClient;
}
