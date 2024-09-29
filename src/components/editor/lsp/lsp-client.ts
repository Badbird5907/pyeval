// Based on https://github.com/DetachHead/basedpyright-playground/blob/main/client/LspClient.ts

import { SessionOptions } from "@/components/editor/lsp/lsp-session";
import "remote-web-worker";
import {
  CompletionItem,
  CompletionList,
  Diagnostic,
  Hover,
  Position,
  SignatureHelp,
  WorkspaceEdit,
} from "vscode-languageserver-types";

export interface LspClientNotifications {
  onWaitingForInitialization?: (isWaiting: boolean) => void;
  onDiagnostics?: (diag: Diagnostic[]) => void;
  onError?: (message: string) => void; // TODO
}

export abstract class LspClient<T extends SessionOptions> {
  public abstract requestNotification(
    notifications: LspClientNotifications,
  ): void;
  public abstract updateCode(code: string): void;
  public abstract initialize(sessionOptions?: T): Promise<void>;
  public abstract updateSettings(sessionOptions: T): Promise<void>;
  public abstract getHoverInfo(
    code: string,
    position: Position,
  ): Promise<Hover | null>;
  public abstract getRenameEdits(
    code: string,
    position: Position,
    newName: string,
  ): Promise<WorkspaceEdit | null>;
  public abstract getSignatureHelp(
    code: string,
    position: Position,
  ): Promise<SignatureHelp | null>;
  public abstract getCompletion(
    code: string,
    position: Position,
  ): Promise<CompletionList | CompletionItem[] | null>;
  public abstract resolveCompletion(
    completionItem: CompletionItem,
  ): Promise<CompletionItem | null>;
  public abstract updateTextDocument(code: string): Promise<number>;
}
