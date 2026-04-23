# type_form_next — Claude Instructions

## Project Overview

Internal tool for fetching and exporting Typeform responses. Supports querying by workspace ID or individual form ID. Results display in a table and can be exported as CSV.

## Stack

- **Next.js 15** (App Router for UI, Pages Router for API routes)
- **React 19**, JSX (not TSX — no TypeScript in src/app yet)
- **Tailwind v4** — CSS-first config in `globals.css`, no `tailwind.config.js`
- **papaparse** — CSV export
- **Node version**: see `.nvmrc`

## Project Structure

```
pages/api/
  forms.js       — API route: fetches workspace/form data from Typeform API
  gpt.js         — GPT integration (separate, unused in main flow)

src/app/
  page.jsx       — Main UI: mode toggle, input, results table, CSV export
  table.jsx      — ResponsesTable component
  layout.tsx     — Root layout
  globals.css    — Tailwind v4 theme config
```

## Environment Variables (`.env.local`)

| Variable     | Purpose                                  |
|--------------|------------------------------------------|
| `AUTH_TOKEN` | Typeform Personal Access Token (Bearer)  |
| `API_URL`    | Typeform API base URL (`https://api.typeform.com`) |

## API Route: `GET /api/forms`

Two modes controlled by query param:

| Param         | Behavior                                           |
|---------------|----------------------------------------------------|
| `workspaceId` | Fetches all forms in workspace, then all responses |
| `formId`      | Fetches responses for a single form directly       |

Both params accept comma-separated IDs from the frontend (each becomes a separate `/api/forms` call).

## Typeform API Pagination — Critical Details

**Two completely different pagination systems depending on endpoint:**

### Workspace forms listing (`GET /workspaces/{id}/forms`)
- **Offset-based** with `page` (integer) and `page_size` (max 200, default 10)
- Response envelope: `{ total_items, page_count, items }`
- To get all forms: increment `page` from 1 until `allForms.length >= total_items`
- The code in `getWorkspaceForms` handles this loop

### Form responses (`GET /forms/{id}/responses`)
- **Cursor-based** with `before={token}` or `after={token}` — does NOT support a `page` integer
- Max `page_size` is 1000 (default 25)
- Default sort order: `submitted_at,desc` (newest first)
- The `before` param is exclusive: returns responses submitted before the given token
- To paginate: use `before = lastItem.token` at the end of each page
- Cannot combine `before`/`after` with a custom `sort` parameter
- Response envelope: `{ total_items, page_count, items }`
- The code in `getForms` handles this loop

### Why both need pagination
A workspace can have >200 forms (missing forms = missing all their responses). Each form can have >1000 responses. Both loops are necessary; skipping either silently truncates data.

## UI Modes

The UI has a **Workspace / Formulario** toggle:
- **Workspace mode**: input accepts one or more workspace IDs (comma-separated), calls `/api/forms?workspaceId=`
- **Formulario mode**: input accepts one or more form IDs (comma-separated), calls `/api/forms?formId=`

Switching modes resets input, data, and error state.

## Known Constraints

- The table header uses `data[0].answers` for column headers — all forms queried together must have the same fields in the same order.
- In workspace mode this is enforced by design (same workspace). In form ID mode, mixing forms with different field sets will produce misaligned columns.
- Typeform API rate limits are not handled — parallel `Promise.all` over many forms may hit limits for very large workspaces.
- Responses with no `answers` (abandoned submissions) are safely handled by normalizing to an empty answer map (`(responseItem.answers || [])`) and filling all fields with `'—'`.
