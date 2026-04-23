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
| `API_URL`    | Typeform API base URL                    |

## API Route: `GET /api/forms`

Two modes controlled by query param:

| Param         | Behavior                                           |
|---------------|----------------------------------------------------|
| `workspaceId` | Fetches all forms in workspace, then all responses |
| `formId`      | Fetches responses for a single form directly       |

Both params accept comma-separated IDs from the frontend (each becomes a separate `/api/forms` call).

### Pagination

`getForms` paginates via the `before` cursor (last item's `token` field) until `allItems.length >= total_items`. Max `page_size=1000` per request. This is critical — without it, forms with >1000 responses are silently truncated.

### Response normalization

Every response is normalized against the form's field definition so all rows have the same columns in the same order, with `'—'` for unanswered fields.

## UI Modes

The UI has a **Workspace / Formulario** toggle:
- **Workspace mode**: input accepts one or more workspace IDs (comma-separated), calls `/api/forms?workspaceId=`
- **Formulario mode**: input accepts one or more form IDs (comma-separated), calls `/api/forms?formId=`

Switching modes resets input, data, and error state.

## Known Constraints

- The table header uses `data[0].answers` for column headers — all forms in a single query must have the same fields/order (enforced in workspace mode by design).
- In form ID mode, mixing forms with different field sets will produce misaligned columns.
- Typeform API rate limits are not handled — for very large workspaces, parallel `Promise.all` over many forms may hit rate limits.
