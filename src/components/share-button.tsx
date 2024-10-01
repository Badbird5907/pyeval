import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAppState } from "@/App";
import { FaShareAlt } from "react-icons/fa";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";

type ShareButtonProps = {
  shareApiEndpoint: string;
};
const ShareButton = ({ shareApiEndpoint }: ShareButtonProps) => {
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [shareProcessing, setShareProcessing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const input = useAppState((state) => state.input);
  return (
    <>
      <Popover
        open={sharePopoverOpen}
        onOpenChange={(e) => {
          if (!e) {
            setShareProcessing(false);
            setShareError(false);
            setSharePopoverOpen(false);
          }
        }}
      >
        <PopoverTrigger>
          <Button
            variant={"outline"}
            onClick={() => {
              setSharePopoverOpen(true);
              setShareProcessing(true);
              fetch(
                "https://proxy.badbird.dev/?rewrite=cors&url=" +
                  encodeURIComponent(shareApiEndpoint + "post"),
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "text/plain",
                    "User-Agent": "PyEval - Badbird5907",
                  },
                  body: input,
                },
              )
                .then((res) => {
                  console.log({ res });
                  if (res.status >= 200 && res.status < 300) {
                    res.json().then((data) => {
                      const key = data.key;
                      if (key) {
                        // create a new url with the encoded input
                        const url = new URL(window.location.href);
                        url.searchParams.set("share", key);
                        console.log(url.toString());
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
                })
                .catch((err) => {
                  console.error(err);
                  setShareError(true);
                });
            }}
            aria-describedby={"share-popover"}
          >
            <FaShareAlt />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-4">
          <span>
            {shareError
              ? "Error!"
              : shareProcessing
                ? "Processing..."
                : "Link copied to clipboard"}
          </span>
          <span className="font-bold">
            Note: This link is not permanent and will expire in about 90 days.
          </span>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default ShareButton;
