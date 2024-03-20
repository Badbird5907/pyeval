import { Box, FormControlLabel, FormGroup, Modal, Switch, TextField } from "@mui/material";
import { Config } from "@/types/config";

type SettingsModalProps = {
    open: boolean;
    close: () => void;
    config: Config;
    saveConfig: (config: Config) => void;
}
export const SettingsModal = ({ open, close, config, saveConfig }: SettingsModalProps) => {
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
                width: 400,
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 4,
            }}>
                <FormGroup>
                    <FormControlLabel control={<Switch checked={config.errorHighlighting} onChange={() => {
                        saveConfig({
                            ...config,
                            errorHighlighting: !config.errorHighlighting
                        })
                    }} />} label="Error Highlighting" />
                </FormGroup>
                {config.errorHighlighting && (
                    <div style={{ marginLeft: 20 }}>
                        <FormGroup>
                            <FormControlLabel
                                control={<Switch checked={config.aggressiveErrorHighlighting} onChange={() => {
                                    saveConfig({
                                        ...config,
                                        aggressiveErrorHighlighting: !config.aggressiveErrorHighlighting
                                    })
                                }} />}
                                label="Aggressive Error Highlighting (may cause performance issues? & buggy)" />
                        </FormGroup>
                    </div>
                )}
                <FormGroup>
                    <FormControlLabel control={<Switch checked={config.useFallbackEditor} onChange={() => {
                        saveConfig({
                            ...config,
                            useFallbackEditor: !config.useFallbackEditor
                        })
                    }} />} label="Use fallback editor" />
                </FormGroup>
                <FormGroup>
                    <TextField type={"number"} label={"Tab Spaces (Virtual Keyboard)"} value={config.tabSpaces} onChange={(e) => {
                        saveConfig({
                            ...config,
                            tabSpaces: parseInt(e.target.value)
                        })
                    }} />
                </FormGroup>
            </Box>
        </Modal>
    );
};
