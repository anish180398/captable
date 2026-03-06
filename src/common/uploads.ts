import { env } from "@/env";
import type { getPresignedUrlOptions } from "@/server/file-uploads";

/**
 * usage
 * ```js
 * import { uploadFile } from '@/common/uploads'
 *
 * const handleUpload = async (file: File) => {
 *   const { key } = await uploadFile(file, { identifier, keyPrefix });
 *
 *   // save to the database
 *   saveDB({ key });
 * };
 * ```
 */

export const uploadFile = async (
  file: File,
  options: Pick<
    getPresignedUrlOptions,
    "expiresIn" | "keyPrefix" | "identifier"
  >,
  bucketMode: "publicBucket" | "privateBucket" = "privateBucket",
) => {
  if (typeof window === "undefined") {
    const { generateUploadKey, saveFile } = await import(
      "@/server/file-storage"
    );
    const key = generateUploadKey({
      fileName: file.name,
      keyPrefix: options.keyPrefix,
      identifier: options.identifier,
    });
    const buffer = new Uint8Array(await file.arrayBuffer());
    await saveFile(key, buffer);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "";
    const fileUrl =
      bucketMode === "publicBucket" && baseUrl
        ? `${baseUrl}/api/files/${encodeURIComponent(key)}`
        : "";
    return {
      key,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      fileUrl,
    };
  }

  const formData = new FormData();
  formData.set("file", file);
  formData.set("identifier", options.identifier);
  formData.set("keyPrefix", options.keyPrefix);
  formData.set("bucketMode", bucketMode);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "";
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ||
        `Failed to upload file "${file.name}", failed with status code ${res.status}`,
    );
  }

  const data = (await res.json()) as {
    key: string;
    name: string;
    mimeType: string;
    size: number;
    fileUrl?: string;
  };

  return {
    key: data.key,
    name: data.name,
    mimeType: data.mimeType,
    size: data.size,
    fileUrl: data.fileUrl ?? "",
  };
};

export type TUploadFile = Awaited<ReturnType<typeof uploadFile>>;
