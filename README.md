# External Memory Layer for LLMs using Google Drive

> Technical architecture, setup, and Apps Script example

## The Problem

LLMs have no memory between sessions by default. Every conversation starts from zero. Projects, decisions, rules, and errors disappear when the chat closes.

Common solutions — vector databases, RAG pipelines, embeddings — are powerful but complex. For personal or professional use, there is a simpler approach that requires no infrastructure beyond what you already have.

## Architecture

Three components:

- **Client bridge** — captures structured lines and sends POST requests
- **Google Apps Script (GAS)** — receives JSON, validates the token, routes to the correct document. GAS is Google's lightweight scripting environment for automating Docs, Sheets, and Drive, and exposing simple web endpoints. No server setup required.
- **Google Drive** — 5 Google Docs as persistent segmented memory

In practice, the LLM outputs a structured memory line, a small bridge sends it as JSON, and GAS routes it to the right Google Doc.

## Setup

Anyone can replicate this in a few steps with tools they probably already use:

1. Create 5 documents in Google Docs: LOG, RULES, ERRORS, WORKFLOWS, MASTER_CONTEXT
2. Copy their IDs into `DOC_MAP` in the script
3. Create your own token
4. Deploy → Web App → Access: Anyone

## Memory Documents

| Document | Purpose |
|---|---|
| LOG | Chronological general log |
| RULES | Validated rules and principles |
| ERRORS | Detected failures and resolutions |
| WORKFLOWS | Processes and systems |
| MASTER_CONTEXT | Current state and master context |

## Instruction for the Model

The key is not just giving the model memory, but giving it the judgment to decide when to read and when to write:

    Your external memory is in Google Drive.
    Documents: LOG / RULES / ERRORS / WORKFLOWS / MASTER_CONTEXT

    Write rules:
    - Validated principle or decision   → ADD_RULE
    - Resolved failure                  → ADD_ERROR
    - Defined process or system         → ADD_WORKFLOW
    - Context change                    → UPDATE_MASTER
    - General event                     → APPEND_LOG

    Read rules:
    - Last entry in a document          → GET_LAST
    - Full document content             → READ_DOC
    - Quick overview                    → SUMMARIZE_DOC

    Autonomy:
    - Write when you detect something durable and useful for future sessions.
    - Read when you need prior context to answer better.
    - Never invent memory content if it has not been consulted.

## Call Examples

**Write — add rule**

    {
      "token": "YOUR_SECURE_TOKEN",
      "action": "ADD_RULE",
      "content": "Always deploy a new version after editing — never edit the active deployment"
    }

**Read — get last entry**

    {
      "token": "YOUR_SECURE_TOKEN",
      "action": "GET_LAST",
      "content": "RULES"
    }

**Response**

    {
      "status": "success",
      "action": "GET_LAST",
     "doc": "RULES",
      "result": "Always deploy a new version after editing"
    }

## Client Bridge

The model generates a structured memory line.
The client bridge converts it into a POST request to your Apps Script endpoint.

### iOS — Apple Shortcuts

Use Apple Shortcuts as a lightweight bridge between the model output and the Apps Script API.

Typical flow:
1. Capture the structured memory line (via input, clipboard, or share sheet)
2. Extract the action and content
3. Send a POST request to the Apps Script endpoint with a JSON body

Example JSON body:

    {
      "token": "YOUR_TOKEN",
      "action": "ADD_RULE",
      "content": "your text"
    }

### Android — HTTP Shortcuts

Use HTTP Shortcuts from the Play Store as the Android equivalent.

Typical setup:
1. Create a new shortcut
2. Method: POST
3. URL: your Apps Script endpoint
4. Request body: JSON

Example JSON body:

    {
      "token": "YOUR_TOKEN",
      "action": "ADD_RULE",
      "content": "your text"
    }

### Desktop

Not strictly required.

On desktop, the same request can be sent manually with any HTTP client.

Example with curl:

    curl -X POST YOUR_URL \
      -H "Content-Type: application/json" \
      -d '{"token":"YOUR_TOKEN","action":"ADD_RULE","content":"your text"}'

Example with Postman: create a POST request with the same JSON body shown above.


## Decision Workflow

| Situation | Action |
|---|---|
| Validated principle or decision | ADD_RULE → RULES |
| Resolved failure | ADD_ERROR → ERRORS |
| Defined process or system | ADD_WORKFLOW → WORKFLOWS |
| Context change | UPDATE_MASTER → MASTER_CONTEXT |
| General event | APPEND_LOG → LOG |
| Need last rule or error | GET_LAST → document |
| Need full context | READ_DOC → selected document |
| Quick overview | SUMMARIZE_DOC → any doc |

## License

MIT License


