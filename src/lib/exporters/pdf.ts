import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function renderPdfBuffer(title: string, body: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  let page = pdf.addPage([595.28, 841.89]);
  let { height } = page.getSize();

  const drawTitle = () => {
    page.drawText(title, {
      x: 60,
      y: height - 80,
      font: titleFont,
      size: 22,
      color: rgb(0.12, 0.18, 0.35)
    });
  };

  drawTitle();

  const lines = body.match(/.{1,90}(\s|$)/g) ?? [body];
  let y = height - 120;

  lines.forEach((line) => {
    if (y < 70) {
      page = pdf.addPage([595.28, 841.89]);
      ({ height } = page.getSize());
      drawTitle();
      y = height - 120;
    }

    page.drawText(line.trim(), {
      x: 60,
      y,
      font,
      size: 12,
      color: rgb(0.1, 0.12, 0.18),
      maxWidth: 475
    });
    y -= 18;
  });

  return Buffer.from(await pdf.save());
}
