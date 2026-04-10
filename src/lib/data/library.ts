import { randomUUID } from "node:crypto";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { insertAuditLog, normalizeOptionalString, requireUser } from "@/lib/data/helpers";
import { validateLibraryImportFile } from "@/lib/library/import-validation";
import type {
  CollectionInput,
  LibraryClassificationInput,
  LibraryImportInput,
  LibraryItemInput,
  TagInput
} from "@/lib/validation/shared";

function normalizeAuthors(authors?: string | null) {
  return normalizeOptionalString(authors)
    ?.split(",")
    .map((author) => author.trim())
    .filter(Boolean) ?? [];
}

function inferLibraryItemType(fileName: string, mimeType?: string | null) {
  const extension = path.extname(fileName).toLowerCase();

  if (mimeType?.includes("pdf") || extension === ".pdf") {
    return "pdf" as const;
  }

  if (
    mimeType?.includes("word") ||
    extension === ".docx" ||
    extension === ".doc"
  ) {
    return "docx" as const;
  }

  return "note" as const;
}

function extractNamedRelation(value: unknown) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function listLibraryItems(search?: string) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("library_items")
    .select("id, title, authors, publication_year, doi, summary, item_type, updated_at, project_id, metadata")
    .order("updated_at", { ascending: false });

  if (search?.trim()) {
    query = query.or(
      `title.ilike.%${search.trim()}%,doi.ilike.%${search.trim()}%,summary.ilike.%${search.trim()}%`
    );
  }

  const { data, error } = await query.limit(16);

  if (error) throw error;
  if (!data.length) {
    return [];
  }

  const itemIds = data.map((item) => item.id);
  const [itemCollections, itemTags] = await Promise.all([
    supabase
      .from("item_collections")
      .select("item_id, collection_id, collections(id, name)")
      .in("item_id", itemIds),
    supabase
      .from("item_tags")
      .select("item_id, tag_id, tags(id, name)")
      .in("item_id", itemIds)
  ]);

  if (itemCollections.error) throw itemCollections.error;
  if (itemTags.error) throw itemTags.error;

  const collectionsByItem = new Map<string, Array<{ id: string; name: string }>>();
  const tagsByItem = new Map<string, Array<{ id: string; name: string }>>();

  for (const relation of itemCollections.data) {
    const collection = extractNamedRelation(relation.collections) as { id: string; name: string } | null;

    if (!collection) {
      continue;
    }

    const entries = collectionsByItem.get(relation.item_id) ?? [];
    entries.push(collection);
    collectionsByItem.set(relation.item_id, entries);
  }

  for (const relation of itemTags.data) {
    const tag = extractNamedRelation(relation.tags) as { id: string; name: string } | null;

    if (!tag) {
      continue;
    }

    const entries = tagsByItem.get(relation.item_id) ?? [];
    entries.push(tag);
    tagsByItem.set(relation.item_id, entries);
  }

  return data.map((item) => ({
    ...item,
    collections: collectionsByItem.get(item.id) ?? [],
    tags: tagsByItem.get(item.id) ?? []
  }));
}

export async function createLibraryItem(input: LibraryItemInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("library_items")
    .insert({
      owner_user_id: user.id,
      title: input.title,
      authors: normalizeAuthors(input.authors),
      publication_year: input.publicationYear ?? null,
      doi: normalizeOptionalString(input.doi),
      summary: normalizeOptionalString(input.summary),
      abstract: normalizeOptionalString(input.abstract),
      item_type: input.itemType,
      project_id: normalizeOptionalString(input.projectId),
      url: normalizeOptionalString(input.url)
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("library.create", "library_item", data.id, { title: input.title });
}

export async function listLibraryTaxonomy() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const [collections, tags] = await Promise.all([
    supabase
      .from("collections")
      .select("id, name, description, updated_at")
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("id, name")
      .order("name", { ascending: true })
  ]);

  if (collections.error) throw collections.error;
  if (tags.error) throw tags.error;

  return {
    collections: collections.data,
    tags: tags.data
  };
}

export async function createCollection(input: CollectionInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("collections")
    .insert({
      owner_user_id: user.id,
      name: input.name,
      description: normalizeOptionalString(input.description)
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("library.collection.create", "collection", data.id, {
    name: input.name
  });
}

export async function createTag(input: TagInput) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tags")
    .insert({
      owner_user_id: user.id,
      name: input.name
    })
    .select("id")
    .single();

  if (error) throw error;

  await insertAuditLog("library.tag.create", "tag", data.id, {
    name: input.name
  });
}

export async function updateLibraryClassification(input: LibraryClassificationInput) {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const collectionIds = Array.from(new Set(input.collectionIds));
  const tagIds = Array.from(new Set(input.tagIds));

  if (collectionIds.length) {
    const collections = await supabase.from("collections").select("id").in("id", collectionIds);

    if (collections.error) throw collections.error;
    if (collections.data.length !== collectionIds.length) {
      throw new Error("Au moins une collection sélectionnée est introuvable.");
    }
  }

  if (tagIds.length) {
    const tags = await supabase.from("tags").select("id").in("id", tagIds);

    if (tags.error) throw tags.error;
    if (tags.data.length !== tagIds.length) {
      throw new Error("Au moins un tag sélectionné est introuvable.");
    }
  }

  const [deleteCollections, deleteTags] = await Promise.all([
    supabase.from("item_collections").delete().eq("item_id", input.itemId),
    supabase.from("item_tags").delete().eq("item_id", input.itemId)
  ]);

  if (deleteCollections.error) throw deleteCollections.error;
  if (deleteTags.error) throw deleteTags.error;

  if (collectionIds.length) {
    const insertCollections = await supabase.from("item_collections").insert(
      collectionIds.map((collectionId) => ({
        item_id: input.itemId,
        collection_id: collectionId
      }))
    );

    if (insertCollections.error) throw insertCollections.error;
  }

  if (tagIds.length) {
    const insertTags = await supabase.from("item_tags").insert(
      tagIds.map((tagId) => ({
        item_id: input.itemId,
        tag_id: tagId
      }))
    );

    if (insertTags.error) throw insertTags.error;
  }

  await insertAuditLog("library.classification.update", "library_item", input.itemId, {
    collections: collectionIds.length,
    tags: tagIds.length
  });
}

export async function importLibraryFile(input: LibraryImportInput, file: File) {
  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  validateLibraryImportFile(file);

  const fileName = file.name || `source-${randomUUID()}`;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileType = inferLibraryItemType(fileName, file.type);
  const assetPath = `${user.id}/library/${randomUUID()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const upload = await admin.storage.from("documents").upload(assetPath, Buffer.from(arrayBuffer), {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (upload.error) {
    throw upload.error;
  }

  const title = normalizeOptionalString(input.title) ?? fileName.replace(path.extname(fileName), "");

  try {
    const itemInsert = await admin
      .from("library_items")
      .insert({
        owner_user_id: user.id,
        title,
        authors: normalizeAuthors(input.authors),
        doi: normalizeOptionalString(input.doi),
        summary: normalizeOptionalString(input.summary),
        abstract: normalizeOptionalString(input.abstract),
        item_type: fileType,
        project_id: normalizeOptionalString(input.projectId),
        metadata: {
          uploaded_file_name: fileName,
          uploaded_mime_type: file.type || null,
          storage_path: assetPath,
          source_kind: "uploaded_file"
        }
      })
      .select("id, title")
      .single();

    if (itemInsert.error) {
      throw itemInsert.error;
    }

    const assetInsert = await admin.from("assets").insert({
      owner_user_id: user.id,
      library_item_id: itemInsert.data.id,
      bucket: "documents",
      path: assetPath,
      mime_type: file.type || null,
      size_bytes: file.size
    });

    if (assetInsert.error) {
      throw assetInsert.error;
    }

    await insertAuditLog("library.import", "library_item", itemInsert.data.id, {
      fileName,
      fileType
    });

    return {
      id: itemInsert.data.id,
      title: itemInsert.data.title,
      fileName
    };
  } catch (error) {
    await admin.storage.from("documents").remove([assetPath]);
    throw error;
  }
}
