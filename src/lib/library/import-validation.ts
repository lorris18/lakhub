const allowedExtensions = new Set([".pdf", ".docx", ".txt", ".md"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown"
]);

export const SUPPORTED_LIBRARY_IMPORT_FORMATS_LABEL = "PDF, DOCX, TXT et MD";
export const MAX_LIBRARY_IMPORT_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function getFileExtension(fileName: string) {
  const trimmed = fileName.trim();
  const separatorIndex = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  const baseName = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : trimmed;
  const dotIndex = baseName.lastIndexOf(".");

  if (dotIndex <= 0) {
    return "";
  }

  return baseName.slice(dotIndex).toLowerCase();
}

export function validateLibraryImportFile(file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier PDF, DOCX ou note requis.");
  }

  if (file.size > MAX_LIBRARY_IMPORT_FILE_SIZE_BYTES) {
    throw new Error("La taille maximale autorisée pour un import est de 25 Mo.");
  }

  const extension = getFileExtension(file.name);
  const mimeType = file.type.trim().toLowerCase();
  const matchesExtension = allowedExtensions.has(extension);
  const matchesMimeType = !mimeType || allowedMimeTypes.has(mimeType);

  if (!matchesExtension || !matchesMimeType) {
    throw new Error(`Formats acceptés: ${SUPPORTED_LIBRARY_IMPORT_FORMATS_LABEL}.`);
  }
}
