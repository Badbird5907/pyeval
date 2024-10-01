import { PythonSessionOptions } from "@/components/editor/lsp/clients/python";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Config = {
  autoRun: boolean;
  setAutoRun: (autoRun: boolean) => void;

  layout: "horizontal" | "vertical";
  setLayout: (layout: "horizontal" | "vertical") => void;

  terminal: {
    overrideCtrlC: boolean;
    setOverrideCtrlC: (overrideCtrlC: boolean) => void;

    overrideCtrlV: boolean;
    setOverrideCtrlV: (overrideCtrlV: boolean) => void;
  };

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

      terminal: {
        overrideCtrlC: true,
        setOverrideCtrlC: (overrideCtrlC: boolean) =>
          set((state) => ({
            terminal: { ...state.terminal, overrideCtrlC },
          })),

        overrideCtrlV: true,
        setOverrideCtrlV: (overrideCtrlV: boolean) =>
          set((state) => ({
            terminal: { ...state.terminal, overrideCtrlV },
          })),
      },

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
