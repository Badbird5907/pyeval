import { FaCog } from "react-icons/fa";
import { Dialog, DialogDescription, DialogHeader, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/types/config";
import { Select , SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const SettingsButton = () => {
  const config = useConfig();
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"outline"}>
          <FaCog />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure the editor and other settings</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={config.layout} onValueChange={(val) => {
            config.setLayout(val as any);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
            </SelectContent>
          </Select>
          <DialogClose>
            <Button className="w-full">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default SettingsButton;
