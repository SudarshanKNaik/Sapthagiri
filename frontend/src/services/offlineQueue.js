import { deleteItem, getAll, putItem } from "./indexedDb";

export async function queueUpload({ sessionId, reuse, ocrLang, file }) {
  const buf = await file.arrayBuffer();
  const id = `upl-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  await putItem("uploads", {
    id,
    sessionId,
    reuse,
    ocrLang,
    fileName: file.name,
    mime: file.type,
    buf,
    createdAt: new Date().toISOString(),
  });

  return id;
}

export async function listQueuedUploads() {
  return getAll("uploads");
}

export async function removeQueuedUpload(id) {
  return deleteItem("uploads", id);
}

export async function queueSubmission({ sessionId, schemeId, phone }) {
  const id = `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await putItem("submissions", {
    id,
    sessionId,
    schemeId,
    phone,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function listQueuedSubmissions() {
  return getAll("submissions");
}

export async function removeQueuedSubmission(id) {
  return deleteItem("submissions", id);
}
