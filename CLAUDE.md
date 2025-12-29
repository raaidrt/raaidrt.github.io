# Raaid Tanveer's Personal Website

A static personal website with a blog powered by Bun. Uses the **Everforest medium** colorscheme for styling.

## Directory Structure

```
content/
├── posts/              # Blog post markdown files
└── projects/           # Project markdown files
src/                    # Static source files
├── about.html          # About page
├── favicon.svg         # Favicon
├── index.html          # Homepage template (with placeholders)
├── profile.png         # Profile picture
└── styles.css          # Stylesheets
dist/                   # Generated output (gitignored)
├── about.html          # Copied from src/
├── blog/               # Generated blog post HTML
├── blog.html           # Generated blog index
├── projects/           # Generated project detail pages
├── projects.html       # Generated projects index
└── index.html          # Generated from template
scripts/
├── build.ts            # Main build script
└── serve.ts            # Development server
```

## Build Commands

### `bun run build`

Compiles all Markdown content into HTML:

- Copies static files from `src/` to `dist/`
- Generates individual blog post pages in `dist/blog/`
- Generates blog index at `dist/blog.html`
- Generates project detail pages in `dist/projects/` (for expandable projects)
- Generates projects index at `dist/projects.html`
- Generates `dist/index.html` from `src/index.html` template with featured projects and recent posts

Uses `gray-matter` for frontmatter parsing and `marked` for Markdown conversion. Supports KaTeX (LaTeX math) and Mermaid diagrams.

### `bun run watch`

Runs the build in watch mode. Automatically rebuilds when any file changes (excluding `node_modules` and other gitignored paths). Useful during development.

### `bun run serve`

Builds the site and starts a local development server at `http://localhost:8000`. Automatically handles:

- Clean URLs (requests to `/about` serve `about.html`)
- Directory index (requests to `/` serve `index.html`)
- Custom 404 page if `404.html` exists

## Writing Blog Posts

Create a new Markdown file in `content/posts/` with frontmatter:

```markdown
---
title: My Post Title
description: A brief description for the blog index
date: 2024-12-28
---

Your content here...
```

### Blog Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `description` | Yes | Brief description shown in blog index |
| `date` | Yes | Publication date (YYYY-MM-DD) |

### Blog Build Output

- Individual post: `dist/blog/{filename-without-extension}.html`
- Blog index: `dist/blog.html` (posts sorted by date, newest first)

## Writing Projects

Create a new Markdown file in `content/projects/` with frontmatter:

```markdown
---
title: Project Name
description: Short description (supports `inline code`)
github: https://github.com/user/repo
featured: true
expandable: false
order: 1
---

Optional detailed content (only rendered for expandable projects)...
```

### Project Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Project name |
| `description` | Yes | Short description (supports inline markdown) |
| `github` | No | GitHub repository URL |
| `featured` | No | If `true`, appears in Featured Projects on homepage |
| `expandable` | No | If `true`, generates a detail page; otherwise card only |
| `order` | No | Sort order on projects page (lower = earlier) |

### Project Build Output

- Projects index: `dist/projects.html` (sorted by `order`, then alphabetically)
- Detail pages: `dist/projects/{slug}.html` (only if `expandable: true`)
- Featured projects are included in `dist/index.html` (generated from template)

### Project Card Behavior

- If `expandable: true`: Card links to detail page
- If `expandable: false` with `github`: Card links to GitHub
- Both link types can coexist on expandable projects

## Mermaid Diagrams

Mermaid diagrams are rendered client-side via the Mermaid.js library. To include a diagram, use raw HTML with `<pre class="mermaid">` tags (not markdown code blocks):

```html
<pre class="mermaid">
flowchart LR
    A[Start] --> B[Process]
    B --> C[End]
</pre>
```

**Important:** Do not use markdown ` ```mermaid ` code blocks. The `marked` library converts those into `<pre><code class="language-mermaid">` which Mermaid.js does not recognize. You must use raw `<pre class="mermaid">` HTML tags.

## Dependencies

- `marked` - Markdown to HTML conversion
- `gray-matter` - YAML frontmatter parsing
