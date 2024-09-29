import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Config = {
  autoRun: boolean;
  setAutoRun: (autoRun: boolean) => void;

  layout: "horizontal" | "vertical";
  setLayout: (layout: "horizontal" | "vertical") => void;

  autoSave: boolean;
  setAutoSave: (autoSave: boolean) => void;
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
    }),
    {
      name: "eval-config",
    },
  ),
);
