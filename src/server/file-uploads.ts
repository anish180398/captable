"use server";

import { env } from "@/env";
import { deleteFile } from "@/server/file-storage";

export type {
  TypeKeyPrefixes,
  getPresignedUrlOptions,
} from "@/server/file-storage";

export const getPresignedGetUrl = (key: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "";
  const url = `${baseUrl}/api/files/${encodeURIComponent(key)}`;
  return { key, url };
};

export const deleteBucketFile = (key: string) => {
  return deleteFile(key);
};
