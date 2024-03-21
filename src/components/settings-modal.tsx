import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  Switch,
  TextField
} from "@mui/material";
import { Config } from "@/types/config";
import AppVersion from "@/components/app-version";
import React from "react";

type SettingsModalProps = {
  open: boolean;
  close: () => void;
  config: Config;
  saveConfig: (config: Config) => void;
}
export const SettingsModal = ({open, close, config, saveConfig}: SettingsModalProps) => {
  return (
    <Modal
      open={open}
      onClose={() => {
        close();
      }}
    >
      <Box sx={{
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 550,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      }}>
        <div className={"grid grid-rows-8 h-full gap-4"}>
          <Stack direction={"column"} gap={2}>
            <FormControlLabel control={<Switch checked={config.errorHighlighting} onChange={() => {
              saveConfig({
                ...config,
                errorHighlighting: !config.errorHighlighting
              })
            }}/>} label="Error Highlighting"/>
            {config.errorHighlighting && (
              <div style={{marginLeft: 20}}>
                <FormControlLabel
                  control={<Switch checked={config.aggressiveErrorHighlighting} onChange={() => {
                    saveConfig({
                      ...config,
                      aggressiveErrorHighlighting: !config.aggressiveErrorHighlighting
                    })
                  }}/>}
                  label="Aggressive Error Highlighting (may cause performance issues? & buggy)"/>
              </div>
            )}
            <FormControl fullWidth>
              <InputLabel id="layout-select-label">Layout</InputLabel>
              <Select
                labelId="layout-select-label"
                id="layout-select"
                value={config.layout || "horizontal"}
                defaultValue={config.layout || "horizontal"}
                label="Layout"
                onChange={(e) => {
                  saveConfig({
                    ...config,
                    layout: e.target.value as "vertical" | "horizontal"
                  })
                }}
              >
                <MenuItem value={"vertical"}>Vertical</MenuItem>
                <MenuItem value={"horizontal"}>Horizontal</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </div>
        <AppVersion/>
      </Box>
    </Modal>
  );
};
