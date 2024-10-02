import { create } from "zustand";
import { nanoid } from "nanoid";
import { defaultInput, useAppState } from "@/App";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { FaCheck, FaDownload, FaFileUpload, FaTrash } from "react-icons/fa";
import ReactTimeAgo from "react-time-ago";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import React from "react";
import { HoverCard } from "@/components/ui/hover-card";
import { persistNSync } from "persist-and-sync";

export type Save = {
  name: string;
  code: string;
  id: string;

  lastModified: Date;
  createdAt: Date;
};

export type Saves = {
  saves: Save[];

  save: (id: string, code: string) => void;
  loadSave: (id: string) => void;
  createSave: (name: string) => void;
  removeSave: (id: string) => void;
  getCurrentSave: () => Save | null;
  getSave: (id: string) => Save | null;
  isCurrentInputDirty: () => boolean;
  isCurrentInputDirtyIgnoreSave: () => boolean;
};

export const useSaves = create<Saves>()(
  persistNSync(
    (set, get) => ({
      saves: [],

      save: (id: string, code: string) => {
        const save = get().getSave(id);
        if (!save) {
          console.error("Save not found");
          return;
        }
        save.code = code;
        save.lastModified = new Date();
        set({ saves: get().saves.map((s) => (s.id === id ? save : s)) });
      },
      loadSave: (id: string) => {
        const save = get().getSave(id);
        if (!save) {
          console.error("Save not found");
          return;
        }
        // set({ currentSave: save.id });
        useAppState.getState().__INTERNAL__.setCurrentSave(save.id);
        useAppState.getState().setInput(save.code);
      },
      getCurrentSave: () => {
        const { currentSave } = useAppState.getState();
        if (!currentSave) {
          return null;
        }
        return get().getSave(currentSave);
      },
      createSave: (name: string) => {
        const newSave: Save = {
          name,
          code: useAppState.getState().input,
          id: nanoid(),
          lastModified: new Date(),
          createdAt: new Date(),
        };
        set({ saves: [...get().saves, newSave] });
        useAppState.getState().__INTERNAL__.setCurrentSave(newSave.id);
      },
      removeSave: (id: string) => {
        set({ saves: get().saves.filter((save) => save.id !== id) });
        const appState = useAppState.getState();
        if (appState.currentSave === id) {
          appState.__INTERNAL__.setCurrentSave(null);
        }
      },
      getSave: (id: string) => {
        return get().saves.find((save) => save.id === id) || null;
      },
      clearCurrentSave: () => {
        useAppState.getState().__INTERNAL__.setCurrentSave(null);
      },
      isCurrentInputDirty: () => {
        const currentInput = useAppState.getState().input;
        if (currentInput === defaultInput) {
          return false;
        }
        const current = get().getCurrentSave();
        if (!current) {
          return false;
        }
        return current.code !== currentInput;
      },
      isCurrentInputDirtyIgnoreSave: () => {
        const currentState = useAppState.getState();
        if (currentState.currentSave) {
          return get().isCurrentInputDirty();
        } else {
          const currentInput = useAppState.getState().input;
          return currentInput !== defaultInput;
        }
      },
    }),
    {
      name: "eval-saves",
    },
  ),
);

export const savesColumns: ColumnDef<Save>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => {
      const currentSave = useAppState((state) => state.currentSave);
      return currentSave === row.original.id && <FaCheck />;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <ReactTimeAgo date={row.original.createdAt} locale="en-US" />
    ),
  },
  {
    accessorKey: "lastModified",
    header: "Last Modified",
    cell: ({ row }) => (
      <ReactTimeAgo date={row.original.lastModified} locale="en-US" />
    ),
  },
  {
    accessorKey: "id",
    header: "Actions",
    cell: ({ row }) => {
      const [deleteConfirm, setDeleteConfirm] = React.useState(false);
      const currentSave = useAppState((state) => state.currentSave);
      const current = currentSave === row.original.id;
      const dirty = useSaves((state) => state.isCurrentInputDirty)();
      const [confirmDialog, setConfirmDialog] = React.useState(false);
      const loadButton = (
        <Button
          onClick={() => {
            if (!dirty) {
              useSaves.getState().loadSave(row.original.id);
              return;
            }
            setConfirmDialog(true);
          }}
          variant={current ? "success" : "outline"}
          name={current ? "Current Save!" : "Load"}
          disabled={current}
        >
          <FaFileUpload />
        </Button>
      );
      return (
        <div className="flex flex-row gap-2">
          <HoverCard>
            <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
              <DialogContent>
                <p>
                  Are you sure you want to load this save? You have unsaved
                  changes.
                </p>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => setConfirmDialog(false)}
                    variant="outline"
                  >
                    No
                  </Button>
                  <Button
                    onClick={() => {
                      useSaves.getState().loadSave(row.original.id);
                      setConfirmDialog(false);
                    }}
                    variant="destructive"
                  >
                    Yes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {dirty ? loadButton : <DialogClose>{loadButton}</DialogClose>}
          </HoverCard>
          <Button
            onClick={() => {
              const save = useSaves.getState().getSave(row.original.id);
              if (!save) {
                console.error("Save not found");
                return;
              }
              const blob = new Blob([save.code], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${save.name}.py`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant={"outline"}
            name="Download"
          >
            <FaDownload />
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => {
              if (deleteConfirm) {
                useSaves.getState().removeSave(row.original.id);
              }
              setDeleteConfirm(!deleteConfirm);
            }}
            name="Delete"
          >
            {deleteConfirm ? <FaCheck /> : <FaTrash />}
          </Button>
        </div>
      );
    },
  },
];
