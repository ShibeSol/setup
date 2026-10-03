"use client";

/** Resize a photo in the browser so uploads stay small (long edge 1600px, JPEG). */
export async function compressPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That file isn't an image we can read."));
      i.src = url;
    });
    let edge = 1600, quality = 0.85;
    for (let tries = 0; tries < 6; tries++) {
      const scale = Math.min(1, edge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/jpeg", quality));
      if (blob && blob.size < 1_500_000) return blob;
      edge = Math.round(edge * 0.8); quality = Math.max(0.6, quality - 0.07);
    }
    throw new Error("That photo is too large even after shrinking. Try a different one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
