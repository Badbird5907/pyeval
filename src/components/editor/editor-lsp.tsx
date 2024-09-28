import { useAppState } from "@/app";
import { MonacoEditor } from "@/components/editor/editor";
import {
  PythonLspClient,
  PythonSessionOptions,
} from "@/components/editor/lsp/clients/python";
import { LspClient } from "@/components/editor/lsp/lsp-client";
import { useEffect } from "react";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver-types";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

const lspClient: LspClient<PythonSessionOptions> = new PythonLspClient();

type LspDataStore = {
  diagnostics: Diagnostic[];
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
};
export const useLspData = create<LspDataStore>((set) => ({
  diagnostics: [],
  setDiagnostics: (diagnostics: Diagnostic[]) => set({ diagnostics }),
}));

export const MonacoLSPEditor = () => {
  const lspData = useLspData();

  const { input, setInput, setLspLoading } = useAppState(
    useShallow((state) => ({
      input: state.input,
      setInput: state.setInput,
      setLspLoading: state.setLspLoading,
    })),
  );

  useEffect(() => {
    lspClient.requestNotification({
      onDiagnostics: (diags: Diagnostic[]) => {
        lspData.setDiagnostics(diags);
      },
      onError: (message: string) => {
        console.error(message);
        lspData.setDiagnostics([
          {
            message: `An error occurred when attempting to contact the language server.\n    ${message}`,
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            },
          },
        ]);
      },
      onWaitingForInitialization: (isWaiting: boolean) => {
        setLspLoading(isWaiting);
      },
    });
  });

  useEffect(() => {
    lspClient.updateSettings({
      typeCheckingMode: "standard",
    });
  }, []);

  return (
    <MonacoEditor
      code={input}
      lspClient={lspClient}
      diagnostics={lspData.diagnostics}
      onUpdateCode={(code: string) => {
        lspClient.updateTextDocument(code);
        lspClient.updateCode(code);

        setInput(code);
      }}
    />
  );
};
