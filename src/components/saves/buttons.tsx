import { LoadButton } from "@/components/saves/load/dialog";
import SaveButton from "@/components/saves/save/button";
import { useSaves } from "@/lib/saves";
import { useMemo } from "react";
import ReactTimeAgo from "react-time-ago";
import { NewButton } from "@/components/saves/save/new";

export const SavesButton = () => {
  const saves = useSaves();
  const currentSave = useMemo(() => saves.getCurrentSave(), [saves]);
  return (
    <div className="flex flex-row">
      <SaveButton />
      {currentSave && (
        <NewButton />
      )}
      <LoadButton />

      {currentSave && (
        <>
        <span className="text-xs text-gray-400 ml-2 content-center">Last saved <ReactTimeAgo date={currentSave.lastModified} locale="en-US" /></span>
        </>
      )}
    </div>
  )
}