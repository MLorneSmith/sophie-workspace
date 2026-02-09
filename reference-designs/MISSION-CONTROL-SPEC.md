# Mission Control - Reference Design Spec

**Source:** Henry AI / yourhenry.ai screenshots (Feb 2026)
**Goal:** Redesign our Mission Control to match this polished second-brain dashboard aesthetic.

## Reference Images
- `mission-control-tasks-view.png` - Kanban task board
- `mission-control-docs-view.png` - Document browser/viewer

---

## Layout Structure

### Top Navigation Bar
- Left: Mission Control logo + icon
- Center: Tab navigation
  - Tasks (kanban icon)
  - Projects (folder icon)
  - Memory (brain icon)
  - Captures (camera icon)
  - Docs (document icon)
  - People (users icon)
- Right: Pause button, "Ping [Agent]" button, refresh icon

### Theme
- Dark background (deep blue-black, ~#0a0f1a)
- Card backgrounds slightly lighter (~#141b2d)
- Accent colors: green for primary actions, colored badges for projects
- Good contrast, clean typography

---

## Tasks View

### Stats Bar (below nav)
- "X This week" | "X In progress" | "X Total" | "X% Completion"
- Clean horizontal layout

### Filter Row
- "+ New task" button (green, prominent)
- User filter pills (Alex, Henry, etc.)
- "All projects" dropdown

### Kanban Board
Columns:
1. **Recurring** - Repeating tasks
2. **Backlog** - Queue
3. **In Progress** - Active work
4. **Review** - Needs review/approval

Each column has:
- Column header with name + count
- "+" button to add task
- Task cards (vertically stacked)

### Task Card Design
- Red/orange dot for priority indicator
- **Title** (bold, truncated if long)
- Description (2 lines max, muted color)
- Linked resource (icon + path/name)
- Project badge (colored pill, e.g., "YouTube", "Clawdbot")
- Timestamp (relative, e.g., "8 days ago")

### Activity Sidebar (right side)
- Header: "ACTIVITY"
- Timeline of actions:
  - User avatar/name
  - Action verb (completed, created, working, moved, deleted, started)
  - **Item name** (bold, linked)
  - Relative timestamp

---

## Docs View

### Left Sidebar
- Search input ("Search documents...")
- Tag filter pills (Journal, Other, Newsletters, Content, Notes, YouTube Scripts)
- File type filter pills (.md, .json, .mobi, .epub)
- Filter icon button

### File List
Each item shows:
- File icon
- Filename
- Tag badge (colored pill)
- Timestamp (relative)
- Selected state: highlighted background

### Main Content Panel
- Document header:
  - Filename
  - Tag badge
  - Metadata: file size, word count, "Modified X ago"
- Date header (e.g., "2026-01-29 — Wednesday")
- Rendered markdown content:
  - Time-stamped sections (e.g., "02:00 AM — Overnight Initiative: Obsidian Research")
  - Bold labels ("What I did:", "Output:", "Key findings:")
  - Bullet lists
  - Clean typography

---

## Design Tokens (estimated)

### Colors
- Background: #0a0f1a
- Card/Panel: #141b2d
- Border/Divider: #1e2a3d
- Text Primary: #e1e4e8
- Text Muted: #6b7280
- Accent Green: #22c55e
- Accent Blue: #3b82f6
- Accent Orange: #f59e0b
- Accent Red: #ef4444

### Typography
- Font: System/Inter-like sans-serif
- Headings: Bold, larger
- Body: Regular, good line height
- Timestamps: Small, muted

### Spacing
- Card padding: 16px
- Column gap: 16px
- Consistent 4px/8px grid

---

## Implementation Notes

This should replace/upgrade the current Mission Control in `slideheroes-internal-tools`.

Priority:
1. Tasks view with kanban board
2. Activity feed
3. Docs view with file browser
4. Navigation structure

Could be built with:
- React + Tailwind (matches current stack)
- @dnd-kit for drag-and-drop kanban
- Markdown rendering (react-markdown or similar)
