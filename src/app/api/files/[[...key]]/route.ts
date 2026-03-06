import { decode } from "@/lib/jwt";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { getFileStream } from "@/server/file-storage";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key?: string[] }> },
) {
  try {
    const { key: keySegments } = await params;
    if (!keySegments?.length) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const key = keySegments.join("/");
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    let allowed = false;

    if (token) {
      try {
        const decoded = await decode(token);
        const payload = decoded.payload as {
          companyId?: string;
          dataRoomId?: string;
          recipientId?: string;
        };
        const { companyId, dataRoomId } = payload;
        if (companyId && dataRoomId) {
          const docWithRoom = await db.document.findFirst({
            where: {
              bucket: { key },
              companyId,
              dataRooms: { some: { dataRoomId } },
            },
            select: { id: true },
          });
          allowed = !!docWithRoom;
        }
      } catch {
        // invalid token
      }
    }

    if (!allowed) {
      const session = await getServerSession(authOptions);

      if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const bucket = await db.bucket.findFirst({
        where: { key },
        select: {
          id: true,
          documents: { take: 1, select: { companyId: true } },
          templates: { take: 1, select: { companyId: true } },
        },
      });

      if (!bucket) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const companyId =
        bucket.documents[0]?.companyId ?? bucket.templates[0]?.companyId;

      if (!companyId || companyId !== session.user.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const stream = getFileStream(key);
    const bucketRecord = await db.bucket.findFirst({
      where: { key },
      select: { mimeType: true },
    });
    const mimeType = bucketRecord?.mimeType || "application/octet-stream";

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("File serve error:", err);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 },
    );
  }
}
