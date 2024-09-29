import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { savesColumns, useSaves } from "@/lib/saves";
import { FaChevronDown } from "react-icons/fa";

export const LoadButton = () => {
  const saves = useSaves((state) => state.saves);
  return (
    <Dialog>
      <DialogTrigger>
        <Button round="right" variant="outline" size="icon">
          <FaChevronDown />
        </Button>
      </DialogTrigger>
      <DialogContent width={"fourxl"}>
        <DialogHeader>
          <DialogTitle>Load Save</DialogTitle>
        </DialogHeader>
        <DataTable columns={savesColumns} data={saves} />
        <DialogClose>
          <Button variant="outline" className="w-full">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}