import { defaultInput, useAppState } from "@/App";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useSaves } from "@/lib/saves";
import { DialogClose } from "@radix-ui/react-dialog";
import React from "react";
import { FaPlus } from "react-icons/fa";

export const NewButton = () => {
  const saves = useSaves();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const doTheThing = () => {
    saves.clearCurrentSave();
    useAppState.getState().setInput(defaultInput);
  };
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>Unsaved Changes!</DialogHeader>
          <div className="flex flex-col gap-4">
            <p>
              Are you sure you want to create a new project? Your current
              changes will be lost.
            </p>
            <DialogClose>
              <div className="flex flex-col gap-2">
                <Button onClick={doTheThing} variant="destructive">
                  Yes
                </Button>
                <Button onClick={() => setDialogOpen(false)} variant="outline">
                  No
                </Button>
              </div>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <Button
        round="none"
        variant={"outline"}
        size="icon"
        onClick={() => {
          // something changed
          if (saves.isCurrentInputDirty()) {
            setDialogOpen(true);
            return;
          }
          // not dirty, just do it
          doTheThing();
        }}
      >
        <FaPlus />
      </Button>
    </>
  );
};
