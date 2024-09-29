import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSaves } from "@/lib/saves";
import React from "react";
import { Button } from "@/components/ui/button";

type SaveNewDialogProps = {
  dialogState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}
const SaveNewDialog = ({ dialogState }: SaveNewDialogProps) => {
  const saves = useSaves();
  
  const [dialogOpen, setDialogOpen] = dialogState;
  const [name, setName] = React.useState("");
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        </div>
        <DialogFooter>
          <Button onClick={() => {
            saves.createSave(name);
            setDialogOpen(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default SaveNewDialog;