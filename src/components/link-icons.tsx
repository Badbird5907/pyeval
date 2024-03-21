import React from 'react';
import { IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import ThemeToggler from "@/components/theme-toggle";
import { Config } from '@/types/config';

type LinkIconsProps = {
  setConfig: (config: Config) => void;
  config: Config;
}
const LinkIcons = ({ config, setConfig }: LinkIconsProps) => {
  return (
    <div>
      <IconButton sx={{ml: 1}} target={"_blank"} href={"https://github.com/Badbird5907/pyeval-web"} color="inherit">
        <GitHubIcon/>
      </IconButton>
      <ThemeToggler onChange={(newTheme) => {
        console.log({newTheme});
        // setCustomTheme(newTheme as 'light' | 'dark');
        setConfig({...config, customTheme: newTheme as 'light' | 'dark'});
      }}/>
    </div>
  );
};

export default LinkIcons;