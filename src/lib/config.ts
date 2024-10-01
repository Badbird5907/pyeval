import { PythonSessionOptions } from "@/components/editor/lsp/clients/python";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Config = {
  autoRun: boolean;
  setAutoRun: (autoRun: boolean) => void;

  layout: "horizontal" | "vertical";
  setLayout: (layout: "horizontal" | "vertical") => void;

  autoSave: boolean;
  setAutoSave: (autoSave: boolean) => void;

  pyrightSettings: PythonSessionOptions;
  setPyrightSettings: (settings: PythonSessionOptions) => void;
};
export const useConfig = create<Config>()(
  persist(
    (set) => ({
      autoRun: true,
      errorHighlighting: true,
      aggressiveErrorHighlighting: true,
      layout: "horizontal",

      setAutoRun: (autoRun: boolean) => set({ autoRun }),
      setLayout: (layout: "horizontal" | "vertical") => set({ layout }),

      autoSave: true,
      setAutoSave: (autoSave: boolean) => set({ autoSave }),

      pyrightSettings: {
        typeCheckingMode: "standard",
      },
      setPyrightSettings: (pyrightSettings: PythonSessionOptions) =>
        set({ pyrightSettings }),
    }),
    {
      name: "eval-config",
    },
  ),
);
