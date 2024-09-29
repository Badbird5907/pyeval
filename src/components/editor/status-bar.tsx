import { useAppState } from "@/App";
import { useLspData } from "@/components/editor/editor-lsp";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { BiSolidErrorAlt } from "react-icons/bi";
import { IoIosWarning } from "react-icons/io";
import AppVersion from "@/components/app-version";

export const StatusBar = () => {
  const { interpreterLoading, lspLoading } = useAppState(
    useShallow((state) => ({
      interpreterLoading: state.interpreterLoading,
      lspLoading: state.lspLoading,
    })),
  );
  const diagnostics = useLspData((state) => state.diagnostics);

  const [errorCount, warningCount] = useMemo(() => {
    let errorCount = 0;
    let warningCount = 0;
    for (const diag of diagnostics) {
      if (diag.severity === 1) {
        errorCount++;
      } else if (diag.severity === 2) {
        warningCount++;
      }
    }
    return [errorCount, warningCount];
  }, [diagnostics]);

  return (
    <div className={"bg-white dark:bg-vsdarker gap-4 px-2 flex flex-row"}>
      {!lspLoading && (
        <>
          <span className="h-full flex gap-1">
            <BiSolidErrorAlt
              title={"Errors"}
              className="place-self-center text-vserror"
            />
            {errorCount}
          </span>
          <span className="h-full flex gap-1">
            <IoIosWarning
              title={"Warnings"}
              className="place-self-center text-vswarning"
            />
            {warningCount}
          </span>
        </>
      )}
      <span>
        {!interpreterLoading ? (
          "Interpreter ready"
        ) : (
          <>{"Loading Interpreter..."}</>
        )}
      </span>
      <span>
        {lspLoading ? "Loading language server..." : "Language server ready"}
      </span>
      <AppVersion />
    </div>
  );
};
