// Based on https://github.com/DetachHead/basedpyright-playground/blob/main/client/LspSession.ts
import { LspClient } from "@/components/editor/lsp/lsp-client";

export type SessionId = string;

export type SessionOptions = unknown;
export interface Session {
  // A unique ID for this session.
  readonly id: SessionId;

  // Path to temp directory that contains the "project" for this session.
  tempDirPath: string;

  // Proxy language client that interacts with the server.
  langClient?: LspClient<unknown>;

  // Timestamp of last request to the session.
  lastAccessTime: number;

  // Options associated with the session.
  options?: SessionOptions;
}
