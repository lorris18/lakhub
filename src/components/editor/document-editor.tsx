"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Download, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  documentId: string;
  title: string;
  content: unknown;
};

export function DocumentEditor({ documentId, title, content }: Props) {
  const [documentTitle, setDocumentTitle] = useState(title);
  const [status, setStatus] = useState("Prêt");
  const lastSaved = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialContent = useMemo(
    () =>
      content || {
        type: "doc",
        content: [{ type: "paragraph" }]
      },
    [content]
  );

  const autosave = useCallback(async (payload: { title: string; contentJson: unknown; plainText: string }) => {
    setStatus("Enregistrement...");

    const response = await fetch(`/api/documents/${documentId}/autosave`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Échec de l’enregistrement");
      return;
    }

    lastSaved.current = new Date().toLocaleTimeString();
    setStatus(`Enregistré à ${lastSaved.current}`);
  }, [documentId]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        openOnClick: false
      }),
      Placeholder.configure({
        placeholder: "Commencez votre rédaction, vos notes ou votre chapitre."
      })
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "editor-prose min-h-[50svh] rounded-2xl border border-border-subtle bg-surface-panel px-5 py-5 shadow-sm focus:outline-none"
      }
    },
    onUpdate({ editor: currentEditor }) {
      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(() => {
        void autosave({
          title: documentTitle,
          contentJson: currentEditor.getJSON(),
          plainText: currentEditor.getText()
        });
      }, 1000);
    }
  });

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-panel p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-text-muted" htmlFor="document-title">
            Titre du document
          </label>
          <Input
            id="document-title"
            onChange={(event) => setDocumentTitle(event.target.value)}
            value={documentTitle}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">{status}</span>
          <Button
            onClick={() =>
              editor
                ? autosave({
                    title: documentTitle,
                    contentJson: editor.getJSON(),
                    plainText: editor.getText()
                  })
                : undefined
            }
            variant="secondary"
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
          <Link href={`/api/documents/${documentId}/export?format=pdf`}>
            <Button variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </Link>
          <Link href={`/api/documents/${documentId}/export?format=docx`}>
            <Button variant="ghost">
              <Download className="mr-2 h-4 w-4" />
              DOCX
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-border-subtle bg-surface-elevated p-3">
        {[
          { label: "Gras", action: () => editor?.chain().focus().toggleBold().run() },
          { label: "Italique", action: () => editor?.chain().focus().toggleItalic().run() },
          { label: "Souligné", action: () => editor?.chain().focus().toggleUnderline().run() },
          { label: "Titre", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
          { label: "Liste", action: () => editor?.chain().focus().toggleBulletList().run() },
          { label: "Citation", action: () => editor?.chain().focus().toggleBlockquote().run() }
        ].map((item) => (
          <Button key={item.label} onClick={() => item.action()} size="sm" variant="ghost">
            {item.label}
          </Button>
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
