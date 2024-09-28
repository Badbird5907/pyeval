import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { ThemeToggler } from "@/components/theme-toggler";

const LinkIcons = () => {
  return (
    <>
      <a
        href={"https://github.com/Badbird5907/pyeval-web"}
        target="_blank"
        rel="noreferrer"
      >
        <Button variant="outline" size="icon">
          <FaGithub />
        </Button>
      </a>
      <ThemeToggler />
    </>
  );
};

export default LinkIcons;
