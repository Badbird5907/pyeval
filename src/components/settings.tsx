import { FaCog, FaQuestionCircle } from "react-icons/fa";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/lib/config";
import {
  TypecheckMode,
  typecheckModes,
} from "@/components/editor/lsp/clients/python";
import { Label } from "@/components/ui/label";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
          <DialogDescription>
            Configure the editor and other settings
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Layout</Label>
            <Select
              value={config.layout}
              onValueChange={(val) => {
                config.setLayout(val as "horizontal" | "vertical");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* TODO: extract this to a seperate component to support other langs */}
          <div>
            <Label>Typecheck Mode</Label>
            <Select
              value={config.pyrightSettings.typeCheckingMode}
              onValueChange={(val) => {
                config.setPyrightSettings({
                  ...config.pyrightSettings,
                  typeCheckingMode: val as TypecheckMode,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                {typecheckModes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-save"
              checked={config.autoSave}
              onCheckedChange={() => config.setAutoSave(!config.autoSave)}
            />
            <label htmlFor="auto-save">Auto Save</label>
          </div>
          <div className="flex items-center flex-row gap-4 w-full">
            <div className="flex flex-row gap-2">
              <Switch
                id="override-c"
                checked={config.terminal.overrideCtrlC}
                onCheckedChange={() =>
                  config.terminal.setOverrideCtrlC(
                    !config.terminal.overrideCtrlC,
                  )
                }
              />
              <label htmlFor="override-c">Override Ctrl+C</label>
            </div>
            <div className="flex flex-row gap-2">
              <Switch
                id="override-v"
                checked={config.terminal.overrideCtrlV}
                onCheckedChange={() =>
                  config.terminal.setOverrideCtrlV(
                    !config.terminal.overrideCtrlV,
                  )
                }
              />
              <label htmlFor="override-v">Override Ctrl+V</label>
            </div>

            {/* Float FaQuestionCircle to the right */}
            <div className="ml-auto right-0">
              <HoverCard>
                <HoverCardTrigger>
                  <FaQuestionCircle />
                </HoverCardTrigger>
                <HoverCardContent className="flex flex-col w-[25vw] gap-2">
                  <b>
                    If you don&apos;t understand what this is, you probably
                    don&apos;t need to change it
                  </b>
                  <p>
                    <b>Ctrl+C: </b>
                    When enabled, the terminal will not send Ctrl+C to the
                    running process and instead copy the <b>selected text</b> to
                    clipboard. If no text is selected, it will send an interrupt
                    signal to the running process.
                  </p>
                  <p>
                    <b>Ctrl+V: </b>
                    When enabled, the terminal will not pass the Ctrl+V key
                    press to the process running in the terminal and instead
                    paste the text from the clipboard.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <DialogClose>
            <Button className="w-full">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default SettingsButton;
