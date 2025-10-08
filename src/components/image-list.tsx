"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageFile } from "@/components/image-processor";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface ImageListProps {
  images: ImageFile[];
  currentImageIndex: number | null;
  handleVisibility: (id: number) => void;
}

export default function ImageList({
  images,
  currentImageIndex,
  handleVisibility,
}: ImageListProps) {
  console.log("Rendering ImageList with images:", currentImageIndex);
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {images.length > 0 ? (
          <div className="grid gap-2 p-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                  currentImageIndex === index
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  handleVisibility(index);
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-wrap">{image.name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2" />
            <p>No images uploaded yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
