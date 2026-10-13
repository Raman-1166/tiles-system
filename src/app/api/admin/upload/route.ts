import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { jsonSuccess, jsonError, AppError, ERROR_CODES } from "@/lib/api-response";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "No image file provided in upload", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        `Invalid image format (${file.type}). Supported formats: JPEG, PNG, WebP`,
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "File size exceeds maximum allowed limit of 5MB",
        400
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const ext =
      path.extname(file.name).toLowerCase() || (file.type === "image/png" ? ".png" : ".jpg");
    const sanitizedBase = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 32);
    const fileName = `${Date.now()}-${sanitizedBase}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "images", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/images/products/${fileName}`;

    return jsonSuccess({
      ok: true,
      url: publicUrl,
      fileName,
      sizeBytes: file.size,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.code, error.message, error.status, error.details);
    }
    console.error("Admin image upload error:", error);
    return jsonError(ERROR_CODES.INTERNAL_ERROR, "Image upload failed", 500);
  }
}
