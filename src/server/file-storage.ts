"use server";

import fs from "node:fs";
import path from "node:path";
import { customId } from "@/common/id";
import { env } from "@/env";
import slugify from "@sindresorhus/slugify";

const storagePath = () => path.resolve(env.UPLOAD_STORAGE_PATH);

export type TypeKeyPrefixes =
  | "new-safes"
  | "existing-safes"
  | "signed-esign-doc"
  | "unsigned-esign-doc"
  | "stock-option-docs"
  | "company-logos"
  | "profile-avatars"
  | "generic-documents"
  | "shares-docs"
  | `data-room/${string}`;

export interface GenerateUploadKeyOptions {
  fileName: string;
  keyPrefix: TypeKeyPrefixes;
  identifier: string;
}

export interface getPresignedUrlOptions extends GenerateUploadKeyOptions {
  contentType: string;
  expiresIn?: number;
  bucketMode: "privateBucket" | "publicBucket";
}

export function generateUploadKey({
  fileName,
  keyPrefix,
  identifier,
}: GenerateUploadKeyOptions): string {
  const { name, ext } = path.parse(fileName);
  return `${identifier}/${keyPrefix}-${slugify(name)}-${customId(12)}${ext}`;
}

function resolveKeyPath(key: string): string {
  const base = storagePath();
  const resolved = path.resolve(base, key);
  if (!resolved.startsWith(base)) {
    throw new Error("Invalid key: path traversal not allowed");
  }
  return resolved;
}

export async function saveFile(
  key: string,
  body: Buffer | Uint8Array,
): Promise<void> {
  const filePath = resolveKeyPath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, body);
}

export function getFileStream(key: string): fs.ReadStream {
  const filePath = resolveKeyPath(key);
  return fs.createReadStream(filePath);
}

export async function getFileBuffer(key: string): Promise<Uint8Array> {
  const filePath = resolveKeyPath(key);
  const buf = await fs.promises.readFile(filePath);
  return new Uint8Array(buf);
}

export async function deleteFile(key: string): Promise<void> {
  const filePath = resolveKeyPath(key);
  await fs.promises.unlink(filePath);
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    const filePath = resolveKeyPath(key);
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
