// Scene utilities for safe property access and image array handling
import type { ScenePublic } from "@/client";

/**
 * Generic utility for safe property access on scene objects
 */
export const getSceneProperty = (
  item: ScenePublic,
  key: string,
  fallback: any = ""
) => {
  return (item as any)?.[key] ?? fallback;
};

/**
 * Generic utility for safe property access on image objects
 */
export const getImageProperty = (
  image: any,
  key: string,
  fallback: any = ""
) => {
  return image?.[key] ?? fallback;
};

/**
 * Safely get image array from a scene, always returns an array
 */
export const getImageArray = (item: ScenePublic): any[] => {
  try {
    const nvDocument = getSceneProperty(item, "nv_document", {});
    const imageArray = nvDocument?.imageOptionsArray;
    return Array.isArray(imageArray) ? imageArray : [];
  } catch (error) {
    console.warn("Error accessing imageOptionsArray:", error);
    return [];
  }
};

/**
 * Get the count of images in a scene
 */
export const getImageCount = (item: ScenePublic): number => {
  return getImageArray(item).length;
};

/**
 * Get display name for an image with multiple fallbacks
 */
export const getImageDisplayName = (image: any, index: number = 0): string => {
  const possibleNameKeys = ["name", "customData"];

  for (const key of possibleNameKeys) {
    const value = getImageProperty(image, key, "");
    if (value && typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return `Image ${index + 1}`;
};

/**
 * Get original image ID (from url property)
 */
export const getOriginalImageId = (image: any, index: number = 0): string => {
  const originalUrl = getImageProperty(image, "url", "");
  if (originalUrl && typeof originalUrl === "string" && originalUrl.trim()) {
    const id = originalUrl.split("/").pop()?.split(".")[0];
    if (id && id.trim()) {
      return `original_${id}`;
    }
  }
  return `original_image_${index}`;
};

/**
 * Get processed image ID (from resultUrl property)
 */
export const getProcessedImageId = (image: any, index: number = 0): string => {
  const resultUrl = getImageProperty(image, "resultUrl", "");
  if (resultUrl && typeof resultUrl === "string" && resultUrl.trim()) {
    const id = resultUrl.split("/").pop()?.split(".")[0];
    if (id && id.trim()) {
      return `processed_${id}`;
    }
  }
  return `processed_image_${index}`;
};

/**
 * Get downloadable files for an image object
 */
export const getDownloadableFiles = (
  image: any,
  index: number = 0
): Array<{
  id: string;
  type: "original" | "processed";
  url: string;
  filename: string;
  displayName: string;
}> => {
  const files = [];

  // Original file
  const originalUrl = getImageProperty(image, "url", "");
  if (originalUrl) {
    const originalName = getImageProperty(image, "name", `image_${index + 1}`);
    files.push({
      id: getOriginalImageId(image, index),
      type: "original" as const,
      url: originalUrl,
      filename: originalName,
      displayName: `${originalName} (Original)`,
    });
  }

  // Processed file (if exists)
  const resultUrl = getImageProperty(image, "resultUrl", "");
  if (resultUrl) {
    const originalName = getImageProperty(image, "name", `image_${index + 1}`);
    const processedName = originalName.includes(".")
      ? originalName.replace(/(\.[^.]+)$/, "_processed$1")
      : `${originalName}_processed`;

    files.push({
      id: getProcessedImageId(image, index),
      type: "processed" as const,
      url: resultUrl,
      filename: processedName,
      displayName: `${processedName} (Processed)`,
    });
  }

  return files;
};

/**
 * Get image URL with multiple fallbacks
 */
export const getImageUrl = (image: any): string => {
  const possibleUrlKeys = ["resultUrl", "url", "downloadUrl", "src"];

  for (const key of possibleUrlKeys) {
    const value = getImageProperty(image, key, "");
    if (value && typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
};

/**
 * Get all searchable text from a scene for search functionality
 */
export const getSearchableText = (item: ScenePublic): string[] => {
  const searchableTexts: string[] = [];

  // Add basic scene properties
  const basicProperties = ["tool_name", "status", "id", "error"];
  basicProperties.forEach((prop) => {
    const value = getSceneProperty(item, prop, "");
    if (value && typeof value === "string" && value.trim()) {
      searchableTexts.push(value);
    }
  });

  // Add image-related searchable text
  const imageArray = getImageArray(item);
  imageArray.forEach((image, index) => {
    // Add display name
    const displayName = getImageDisplayName(image, index);
    if (displayName) {
      searchableTexts.push(displayName);
    }

    // Add all other string properties from images
    Object.keys(image || {}).forEach((key) => {
      const value = image[key];
      if (typeof value === "string" && value.trim()) {
        searchableTexts.push(value);
      }
    });
  });

  // Add searchable text from result object
  const result = getSceneProperty(item, "result", {});
  if (result && typeof result === "object") {
    Object.values(result).forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        searchableTexts.push(value);
      }
    });
  }

  return searchableTexts.filter((text) => text.trim().length > 0);
};

/**
 * Format duration from timestamp
 */
export const formatDuration = (startTime: string): string => {
  const endTime = new Date();
  const duration = endTime.getTime() - new Date(startTime).getTime();
  const seconds = Math.floor(duration / 1000);

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format date for display
 */
export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

/**
 * Generate processing message based on scene status
 */
export const getProcessingMessage = (item: ScenePublic): string => {
  if (!getSceneProperty(item, "timestamp")) {
    return "Processing status unknown";
  }

  const imageCount = getImageCount(item);
  const toolName = getSceneProperty(item, "tool_name", "Unknown Tool");
  const timestamp = getSceneProperty(item, "timestamp", "");

  switch (item.status) {
    case "pending":
      return `Processing ${imageCount} image(s) with ${toolName}...`;
    case "completed":
      return `Successfully processed ${imageCount} image(s) in ${formatDuration(timestamp)}`;
    case "failed":
      return `Failed to process ${imageCount} image(s). Please check your inputs and try again.`;
    default:
      return "Processing status unknown";
  }
};
