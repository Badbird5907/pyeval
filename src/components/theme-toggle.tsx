import { IconButton, useTheme } from "@mui/material";
import React from "react";
import { ColorModeContext } from "@/App";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

interface ThemeTogglerProps {
  onChange?: (theme: "light" | "dark") => void;
}
function ThemeToggler(props: ThemeTogglerProps) {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  return (
    <IconButton
      sx={{ ml: 1 }}
      onClick={() => {
        colorMode.toggleColorMode();
        if (props.onChange) {
          props.onChange(theme.palette.mode === "dark" ? "light" : "dark");
        }
      }}
      color="inherit"
    >
      {theme.palette.mode === "dark" ? (
        <Brightness7Icon />
      ) : (
        <Brightness4Icon />
      )}
    </IconButton>
  );
}
export default ThemeToggler;
