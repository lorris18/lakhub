import { Document, Packer, Paragraph, TextRun } from "docx";

export async function renderDocxBuffer(title: string, body: string) {
  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 34
              })
            ]
          }),
          ...body.split("\n").filter(Boolean).map(
            (paragraph) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                    size: 24
                  })
                ]
              })
          )
        ]
      }
    ]
  });

  return Buffer.from(await Packer.toBuffer(document));
}

