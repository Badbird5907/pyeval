import React from 'react';
import { IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import ThemeToggler from "@/components/theme-toggle";
import { Config } from '@/types/config';

const LinkIcons = () => {
  return (
    <div>
      <IconButton sx={{ml: 1}} target={"_blank"} href={"https://github.com/Badbird5907/pyeval-web"} color="inherit">
        <GitHubIcon/>
      </IconButton>
      <ThemeToggler />
    </div>
  );
};

export default LinkIcons;