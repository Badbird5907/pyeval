import { IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import ThemeToggler from "@/components/theme-toggle";
import { useConfig } from "@/types/config";
import { useShallow } from "zustand/react/shallow";

const LinkIcons = () => {
  const config = useConfig(
    useShallow((state) => ({
      customTheme: state.customTheme,
      setCustomTheme: state.setCustomTheme,
    })),
  );
  return (
    <div>
      <IconButton
        sx={{ ml: 1 }}
        target={"_blank"}
        href={"https://github.com/Badbird5907/pyeval-web"}
        color="inherit"
      >
        <GitHubIcon />
      </IconButton>
      <ThemeToggler
        onChange={(newTheme) => {
          console.log({ newTheme });
          // setCustomTheme(newTheme as 'light' | 'dark');
          // setConfig({ ...config, customTheme: newTheme as "light" | "dark" });
          config.setCustomTheme(newTheme as "light" | "dark");
        }}
      />
    </div>
  );
};

export default LinkIcons;
