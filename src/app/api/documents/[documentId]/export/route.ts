import { NextResponse } from "next/server";

import { getDocumentDetail } from "@/lib/data/documents";
import { renderDocxBuffer } from "@/lib/exporters/docx";
import { renderPdfBuffer } from "@/lib/exporters/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  const detail = await getDocumentDetail(documentId);
  const title = detail.document.title;
  const body = detail.document.plain_text;

  if (format === "docx") {
    const buffer = await renderDocxBuffer(title, body);
    return new NextResponse(buffer, {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${title}.docx"`
      }
    });
  }

  const buffer = await renderPdfBuffer(title, body);
  return new NextResponse(buffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${title}.pdf"`
    }
  });
}

