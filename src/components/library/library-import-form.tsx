"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  importLibraryFileAction,
  type LibraryImportActionState
} from "@/app/(workspace)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  validateLibraryImportFile,
  MAX_LIBRARY_IMPORT_FILE_SIZE_BYTES,
  SUPPORTED_LIBRARY_IMPORT_FORMATS_LABEL
} from "@/lib/library/import-validation";

type LibraryImportFormProps = {
  projects: Array<{
    id: string;
    title: string;
  }>;
};

const initialState: LibraryImportActionState = {
  status: "idle"
};

export function LibraryImportForm({ projects }: LibraryImportFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(importLibraryFileAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setClientMessage(null);
      router.refresh();
    }
  }, [router, state.status]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setClientMessage(null);

    const fileInput = formRef.current?.elements.namedItem("file");
    const file =
      fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;

    try {
      validateLibraryImportFile(file as File);
    } catch (error) {
      event.preventDefault();
      setClientMessage(error instanceof Error ? error.message : "Import impossible.");
    }
  }

  const message = clientMessage ?? state.message;
  const isError = Boolean(clientMessage) || state.status === "error";

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="rounded-2xl border border-border-subtle bg-surface-panel p-4">
        <label className="block text-sm font-medium text-text-secondary" htmlFor="file">
          Fichier source
        </label>
        <input
          accept=".pdf,.docx,.txt,.md"
          className="mt-3 block w-full rounded-xl border border-border-subtle bg-surface-base p-3 text-sm"
          id="file"
          name="file"
          onChange={() => setClientMessage(null)}
          required
          type="file"
        />
        <p className="mt-2 text-xs text-text-muted">
          Formats acceptés: {SUPPORTED_LIBRARY_IMPORT_FORMATS_LABEL}. Taille maximale:{" "}
          {Math.round(MAX_LIBRARY_IMPORT_FILE_SIZE_BYTES / (1024 * 1024))} Mo.
        </p>
      </div>
      <Input name="title" placeholder="Titre optionnel (sinon nom du fichier)" />
      <Input name="authors" placeholder="Auteurs séparés par des virgules" />
      <Input name="doi" placeholder="DOI optionnel" />
      <Textarea name="summary" placeholder="Résumé ou note de lecture courte" />
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="importProjectId">
          Projet lié
        </label>
        <Select defaultValue="" id="importProjectId" name="projectId">
          <option value="">Aucun projet pour le moment</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </Select>
      </div>
      {message ? (
        <div
          className={
            isError
              ? "rounded-2xl border border-status-danger/20 bg-status-danger-soft/55 p-4 text-sm text-text-primary"
              : "rounded-2xl border border-status-success/20 bg-status-success-soft/60 p-4 text-sm text-text-primary"
          }
          role="status"
        >
          {message}
        </div>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit" variant="secondary">
        {isPending ? "Import en cours..." : "Importer le fichier"}
      </Button>
    </form>
  );
}
