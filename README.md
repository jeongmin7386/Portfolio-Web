# Studio Archive

Notion-style content management and Adobe Portfolio-style case study presentation
for a personal design portfolio.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- JSON content files under `content/projects` and `content/notes`

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

On Windows PowerShell, if script execution blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

## Scripts

```bash
npm run lint
npm run build
npm run typecheck
```

## Content Structure

Projects are stored as JSON files in `content/projects`.
Each project file is loaded by `lib/content.ts`, so adding a new JSON file with a
unique `slug` automatically creates:

- a project card on `/projects`
- a detail page at `/projects/[slug]`
- a possible home feature if `featured` is `true`

Notes are stored in `content/notes` and appear on `/archive`.

## Project Model

```ts
type Project = {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  period: string;
  role: string;
  client: string;
  category: "Branding" | "UI/UX" | "Editorial" | "Motion" | "Art Direction";
  tags: string[];
  coverImage: string;
  description: string;
  tools: string[];
  deliverables: string[];
  blocks: ProjectBlock[];
  featured?: boolean;
};
```

Supported block types:

- `heading`
- `paragraph`
- `image`
- `imageGrid`
- `quote`
- `twoColumn`
- `stats`
- `process`
- `result`

## Adding a Project

1. Add images to `public/images`, preferably using a
   `/images/placeholder-*` path while drafting.
2. Copy one existing JSON file in `content/projects`.
3. Change `slug`, metadata, `coverImage`, and `blocks`.
4. Run `npm run dev` and visit `/projects/[slug]`.

## Key Files

- `lib/types.ts`: shared content types
- `lib/content.ts`: filesystem content loader, future CMS/Notion API boundary
- `components/block-renderer.tsx`: Notion-like case study block renderer
- `components/project-explorer.tsx`: project category filtering
- `app/projects/[slug]/page.tsx`: generated project detail route
