import { createImage } from "./createImage";

/**
 * Crop and return a blob from the image source and pixel crop area.
 * @param {string} imageSrc - Source URL of the image
 * @param {Object} pixelCrop - { x, y, width, height }
 * @param {string} [format="image/jpeg"] - Output format: "image/jpeg" or "image/png"
 * @returns {Promise<Blob>} - Cropped image as a blob
 */
export default async function getCroppedImg(imageSrc, pixelCrop, format = "image/jpeg") {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("❌ Failed to generate cropped image blob");
        return reject(new Error("Canvas blob is null"));
      }
      resolve(blob);
    }, format);
  });
}
