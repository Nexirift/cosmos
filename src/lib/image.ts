"use server";

import * as fs from "fs/promises";
import * as path from "path";
import { checkCache } from "./actions";
import { SettingKey } from "./defaults";

export async function convertDbImage(
  input: string,
  output: string,
): Promise<void> {
  // Input validation
  if (!input || typeof input !== "string") {
    throw new Error("Invalid input: image data must be a non-empty string");
  }

  if (!output || typeof output !== "string") {
    throw new Error("Invalid output: file path must be a non-empty string");
  }

  // Validate base64 format
  if (!input.startsWith("data:image/png;base64,")) {
    throw new Error("An image is required in the Base64 format!");
  }

  // Sanitize output path to prevent directory traversal
  const normalizedOutput = path.normalize(output);
  if (
    normalizedOutput.includes("..") ||
    path.isAbsolute(normalizedOutput) === false
  ) {
    // Only allow relative paths that don't traverse up directories
    if (normalizedOutput.includes("..")) {
      throw new Error("Invalid output path: directory traversal not allowed");
    }
  }

  // Validate output file extension
  const allowedExtensions = [".ico", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(normalizedOutput).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error(
      `Invalid file extension: ${ext}. Allowed extensions: ${allowedExtensions.join(", ")}`,
    );
  }

  const base64Data = input.replace("data:image/png;base64,", "");

  // Validate base64 data
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64Data)) {
    throw new Error("Invalid base64 data format");
  }

  // Limit file size (e.g., 10MB)
  const maxSizeBytes = 10 * 1024 * 1024;
  const estimatedSize = (base64Data.length * 3) / 4;
  if (estimatedSize > maxSizeBytes) {
    throw new Error(
      `File size too large: ${Math.round(estimatedSize / 1024 / 1024)}MB exceeds 10MB limit`,
    );
  }

  try {
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure output directory exists
    const outputDir = path.dirname(normalizedOutput);
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(normalizedOutput, buffer);
  } catch (error) {
    throw new Error(
      `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function findImagesAndConvert() {
  const images = [
    { input: SettingKey.appLogo, output: "src/app/favicon.ico" },
    { input: SettingKey.appHeader, output: "public/assets/images/banner.png" },
  ];

  for (const image of images) {
    try {
      const imageBuffer = await checkCache(image.input);
      if (
        imageBuffer &&
        typeof imageBuffer === "string" &&
        imageBuffer.startsWith("data:image/png;base64,")
      ) {
        await convertDbImage(imageBuffer, image.output);
      }
    } catch (error) {
      console.error(
        `Failed to process image ${image.input}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
      // Continue processing other images even if one fails
    }
  }
}
