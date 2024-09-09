import React, { useState } from 'react';
import { Button, Popover, Typography } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";

type ShareButtonProps = {
  shareApiEndpoint: string;
  input: string;
}
const ShareButton = ({ input, shareApiEndpoint }: ShareButtonProps) => {
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [shareProcessing, setShareProcessing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [shareButton, setShareButton] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <Button
        variant="contained"
        color="info"
        onClick={(e) => {
          setShareButton(e.currentTarget)
          setSharePopoverOpen(true);
          setShareProcessing(true);
          fetch("https://corsproxy.io/?" + encodeURIComponent(shareApiEndpoint + "post"), {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "User-Agent": "PyEval - Badbird5907",
            },
            body: input,
          }).then((res) => {
            console.log({res});
            if (res.status >= 200 && res.status < 300){
              res.json().then((data) => {
                const key = data.key;
                if (key){
                  // create a new url with the encoded input
                  const url = new URL(window.location.href);
                  url.searchParams.set("share", key);
                  console.log(url.toString())
                  // copy the url to the clipboard
                  navigator.clipboard.writeText(url.toString());
                  setShareProcessing(false);
                } else {
                  setShareError(true);
                }
              });
            } else {
              setShareError(true);
            }
          }).catch((err) => {
            console.error(err);
            setShareError(true);
          });
        }}
        endIcon={<IosShareIcon/>}
        aria-describedby={"share-popover"}
      >
        Share
      </Button>
      <Popover
        id={"share-popover"}
        open={sharePopoverOpen}
        anchorEl={shareButton}
        onClose={() => {
          setSharePopoverOpen(false);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Typography
          sx={{p: 2}}>{shareError ? "Error!" : shareProcessing ? "Processing..." : "Link copied to clipboard"}</Typography>
      </Popover>
    </>
  );
};

export default ShareButton;