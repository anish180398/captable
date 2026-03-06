import { env } from "@/env";
import { authOptions } from "@/server/auth";
import {
  type TypeKeyPrefixes,
  generateUploadKey,
  saveFile,
} from "@/server/file-storage";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const KEY_PREFIXES: TypeKeyPrefixes[] = [
  "new-safes",
  "existing-safes",
  "signed-esign-doc",
  "unsigned-esign-doc",
  "stock-option-docs",
  "company-logos",
  "profile-avatars",
  "generic-documents",
  "shares-docs",
];

function isValidKeyPrefix(value: string): value is TypeKeyPrefixes {
  if (value.startsWith("data-room/")) return true;
  return KEY_PREFIXES.includes(value as TypeKeyPrefixes);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const identifier = formData.get("identifier") as string | null;
    const keyPrefix = formData.get("keyPrefix") as string | null;
    const bucketMode =
      (formData.get("bucketMode") as string) || "privateBucket";

    if (!file || !identifier || !keyPrefix) {
      return NextResponse.json(
        { error: "Missing file, identifier, or keyPrefix" },
        { status: 400 },
      );
    }

    if (!isValidKeyPrefix(keyPrefix)) {
      return NextResponse.json({ error: "Invalid keyPrefix" }, { status: 400 });
    }

    const key = generateUploadKey({
      fileName: file.name,
      keyPrefix: keyPrefix as TypeKeyPrefixes,
      identifier,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    await saveFile(key, buffer);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || env.NEXT_PUBLIC_BASE_URL || "";
    const fileUrl =
      bucketMode === "publicBucket" && baseUrl
        ? `${baseUrl}/api/files/${encodeURIComponent(key)}`
        : "";

    return NextResponse.json({
      key,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      fileUrl: fileUrl || undefined,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
