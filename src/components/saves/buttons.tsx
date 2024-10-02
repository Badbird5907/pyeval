import { LoadButton } from "@/components/saves/load/dialog";
import SaveButton from "@/components/saves/save/button";
import { useSaves } from "@/lib/saves";
import { useMemo } from "react";
import ReactTimeAgo from "react-time-ago";
import { NewButton } from "@/components/saves/save/new";
import { useAppState } from "@/App";

export const SavesButton = () => {
  const currentSave = useAppState((state) => state.currentSave);
  const save = useMemo(
    () => (currentSave ? useSaves.getState().getSave(currentSave) : null),
    [currentSave],
  );
  return (
    <div className="flex flex-row">
      <SaveButton />
      {currentSave && <NewButton />}
      <LoadButton />

      {currentSave && save && (
        <>
          <span className="text-xs text-gray-400 ml-2 content-center">
            Last saved <ReactTimeAgo date={save.lastModified} locale="en-US" />
          </span>
        </>
      )}
    </div>
  );
};
