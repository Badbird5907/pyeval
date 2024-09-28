import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Config = {
  autoRun: boolean;
  setAutoRun: (autoRun: boolean) => void;

  errorHighlighting: boolean;
  setErrorHighlighting: (errorHighlighting: boolean) => void;

  aggressiveErrorHighlighting: boolean;
  setAggressiveErrorHighlighting: (
    aggressiveErrorHighlighting: boolean,
  ) => void;

  customTheme: "light" | "dark";
  setCustomTheme: (customTheme: "light" | "dark") => void;

  layout: "horizontal" | "vertical";
  setLayout: (layout: "horizontal" | "vertical") => void;
};
export const useConfig = create<Config>()(
  persist(
    (set) => ({
      autoRun: true,
      errorHighlighting: true,
      aggressiveErrorHighlighting: true,
      customTheme: "dark",
      layout: "horizontal",

      setAutoRun: (autoRun: boolean) => set({ autoRun }),
      setErrorHighlighting: (errorHighlighting: boolean) =>
        set({ errorHighlighting }),
      setAggressiveErrorHighlighting: (aggressiveErrorHighlighting: boolean) =>
        set({ aggressiveErrorHighlighting }),
      setCustomTheme: (customTheme: "light" | "dark") => set({ customTheme }),
      setLayout: (layout: "horizontal" | "vertical") => set({ layout }),
    }),
    {
      name: "eval-config",
    },
  ),
);
