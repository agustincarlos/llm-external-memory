// Gemini Memory – public example
// Simple LLM memory persistence using Google Docs

const DOC_MAP = {
  LOG:            "DOC_ID_LOG",
  RULES:          "DOC_ID_RULES",
  ERRORS:         "DOC_ID_ERRORS",
  WORKFLOWS:      "DOC_ID_WORKFLOWS",
  MASTER_CONTEXT: "DOC_ID_MASTER_CONTEXT"
};

const TOKEN = "YOUR_SECURE_TOKEN";

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents)
    return jsonResponse({ status: "error", message: "empty request" });

  let payload;
  try { payload = JSON.parse(e.postData.contents); }
  catch (err) { return jsonResponse({ status: "error", message: "invalid JSON" }); }

  if (!payload.token || payload.token !== TOKEN)
    return jsonResponse({ status: "error", message: "invalid token" });

  const action  = (payload.action  || "").trim().toUpperCase();
  const content = (payload.content || "").trim();

  if (!action)
    return jsonResponse({ status: "error", message: "missing action" });

  switch (action) {
    case "APPEND_LOG":    return writeToDoc("LOG", content, false);
    case "ADD_RULE":      return writeToDoc("RULES", content, false);
    case "ADD_ERROR":     return writeToDoc("ERRORS", content, false);
    case "ADD_WORKFLOW":  return writeToDoc("WORKFLOWS", content, false);
    case "UPDATE_MASTER": return writeToDoc("MASTER_CONTEXT", content, true);
    case "GET_LAST":      return readLast(content);
    case "READ_DOC":      return readDoc(content);
    case "SUMMARIZE_DOC": return summarizeDoc(content);
    default: return jsonResponse({ status: "error", message: "unknown action" });
  }
}

function writeToDoc(docKey, text, insertTop) {
  const id = DOC_MAP[docKey];
  if (!id) return jsonResponse({ status: "error", message: "document not mapped" });
  try {
    const doc  = DocumentApp.openById(id);
    const body = doc.getBody();
    const line = "[" + new Date().toISOString() + "] " + text;
    if (insertTop) { body.insertParagraph(0, line); }
    else           { body.appendParagraph(line); }
    doc.saveAndClose();
    return jsonResponse({ status: "success", action: docKey });
  } catch (err) { return jsonResponse({ status: "error", message: err.toString() }); }
}

function readLast(docKey) {
  const id = DOC_MAP[docKey];
  if (!id) return jsonResponse({ status: "error", message: "document not mapped" });
  try {
    const body  = DocumentApp.openById(id).getBody();
    const total = body.getNumChildren();
    let last = "";
    for (let i = total - 1; i >= 0; i--) {
      const el = body.getChild(i);
      if (el.getType() === DocumentApp.ElementType.PARAGRAPH) {
        const txt = el.asParagraph().getText().trim();
        if (txt) { last = txt; break; }
      }
    }
    return jsonResponse({ status: "success", action: "GET_LAST", result: last || "no content" });
  } catch (err) { return jsonResponse({ status: "error", message: err.toString() }); }
}

function readDoc(docKey) {
  const id = DOC_MAP[docKey];
  if (!id) return jsonResponse({ status: "error", message: "document not mapped" });
  try {
    const text = DocumentApp.openById(id).getBody().getText().trim();
    return jsonResponse({ status: "success", action: "READ_DOC", result: text || "no content" });
  } catch (err) { return jsonResponse({ status: "error", message: err.toString() }); }
}

function summarizeDoc(docKey) {
  const id = DOC_MAP[docKey];
  if (!id) return jsonResponse({ status: "error", message: "document not mapped" });
  try {
    const body  = DocumentApp.openById(id).getBody();
    const total = body.getNumChildren();
    const lines = [];
    for (let i = 0; i < total && lines.length < 10; i++) {
      const el = body.getChild(i);
      if (el.getType() === DocumentApp.ElementType.PARAGRAPH) {
        const txt = el.asParagraph().getText().trim();
        if (txt) lines.push(txt);
      }
    }
    return jsonResponse({ status: "success", action: "SUMMARIZE_DOC",
      result: lines.length ? lines.join("\n") : "no content" });
  } catch (err) { return jsonResponse({ status: "error", message: err.toString() }); }
}
