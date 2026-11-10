export interface CompressedImage {
  dataUrl: string;
  sizeKb: number;
  name: string;
}

/**
 * Compresses an uploaded/pasted image in the browser before sending or saving.
 * Keeps images around ~50-150 KB instead of multi-MB originals.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1024,
  quality = 0.78
): Promise<CompressedImage> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode image"));
      el.src = imageUrl;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }

    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64Bytes = Math.ceil(((dataUrl.split(",")[1] || "").length * 3) / 4);
    const sizeKb = Math.max(1, Math.round(base64Bytes / 1024));

    return {
      dataUrl,
      sizeKb,
      name: file.name || "screenshot.jpg",
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

