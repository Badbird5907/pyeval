import { Button } from "@/components/ui/button";
import { useSaves } from "@/lib/saves";
import { FaCheck, FaSave } from "react-icons/fa";
import React, { useCallback, useEffect } from "react";
import SaveNewDialog from "@/components/saves/save/save-new-dialog";
import { useAppState } from "@/App";

const SaveButton = () => {
  const saves = useSaves();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saveCheck, setSaveCheck] = React.useState(false);
  const [saveBounce, setSaveBounce] = React.useState(false);
  const save = useCallback(() => {
    const current = saves.getCurrentSave();
    if (!current) {
      setDialogOpen(true);
    } else {
      saves.save(current.id, useAppState.getState().input);
      setSaveBounce(true);
      setTimeout(() => {
        // jank but it works and looks good
        setSaveBounce(false);
        setSaveCheck(true);
        setTimeout(() => {
          setSaveCheck(false);
        }, 1000);
      }, 1000);
    }
  }, []);
  useEffect(() => {
    // catch ctrl + s
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
    };
  }, []);
  return (
    <>
      <SaveNewDialog dialogState={[dialogOpen, setDialogOpen]} />
      <Button
        round="left"
        variant="outline"
        onClick={save}
        disabled={saveBounce || saveCheck}
      >
        {saveBounce ? (
          <FaSave className="animate-bounce" />
        ) : saveCheck ? (
          <FaCheck />
        ) : (
          <FaSave />
        )}
      </Button>
    </>
  );
};
export default SaveButton;
