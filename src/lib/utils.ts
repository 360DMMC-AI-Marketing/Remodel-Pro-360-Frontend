import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BASE_IMAGE_URL = "https://rp360-uploads.s3.us-east-1.amazonaws.com/";

export function getImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${BASE_IMAGE_URL}${path}`;
}
