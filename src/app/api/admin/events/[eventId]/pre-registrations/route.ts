import { NextRequest, NextResponse } from "next/server";
import { importController } from "@/server/controllers/import.controller";
import { deskEventGuard, guardStatus } from "@/server/auth/request";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const numericId = Number(eventId);
  if (!numericId || isNaN(numericId)) {
    return NextResponse.json(
      { success: false, error: "Invalid event ID" },
      { status: 400 }
    );
  }

  const denied = await deskEventGuard(req, numericId);
  if (denied) {
    return NextResponse.json({ success: false, error: denied }, { status: guardStatus(denied) });
  }

  const { searchParams } = new URL(req.url);
  const result = await importController.handleListPreRegistrations({
    eventId: numericId,
    search: searchParams.get("search") || undefined,
    responseStatus: searchParams.get("responseStatus") || undefined,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const numericId = Number(eventId);
    if (!numericId || isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: "Invalid event ID" },
        { status: 400 }
      );
    }

    let csvText = "";
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (file instanceof File) {
        csvText = await file.text();
      } else if (typeof formData.get("csvText") === "string") {
        csvText = formData.get("csvText") as string;
      }
    } else {
      const body = await req.json();
      csvText = body.csvText || "";
    }

    const result = await importController.handleImportPreRegistrationsCsv(
      numericId,
      csvText
    );
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to import pre-registrations CSV";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
