import { Button } from "@/components/ui/button";
import { useSaves } from "@/lib/saves";
import { FaCheck, FaSave } from "react-icons/fa";
import React from "react";
import SaveNewDialog from "@/components/saves/save/save-new-dialog";
import { useAppState } from "@/App";

const SaveButton = () => {
  const saves = useSaves();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saveCheck, setSaveCheck] = React.useState(false);
  const [saveBounce, setSaveBounce] = React.useState(false);
  return (
    <>
      <SaveNewDialog dialogState={[dialogOpen, setDialogOpen]} />
      <Button round="left" variant="outline"
        onClick={() => {
          const current = saves.getCurrentSave();
          if (!current) {
            setDialogOpen(true);
          } else {
            saves.save(current.id, useAppState.getState().input);
            setSaveBounce(true);
            setTimeout(() => { // jank but it works and looks good
              setSaveBounce(false);
              setSaveCheck(true);
              setTimeout(() => {
                setSaveCheck(false);
              }, 1000);
            }, 1000);
          }
        }}
        disabled={saveBounce || saveCheck}
      >
        {saveBounce ? <FaSave className="animate-bounce" /> : saveCheck ? <FaCheck /> : <FaSave />}
      </Button>
    </>
  );
}
export default SaveButton;