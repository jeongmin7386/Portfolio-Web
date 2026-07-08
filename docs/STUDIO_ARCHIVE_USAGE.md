# Studio Archive Usage

Live site:

- Home: https://studio-archive.onrender.com
- Archive: https://studio-archive.onrender.com/archive
- Projects: https://studio-archive.onrender.com/projects
- About: https://studio-archive.onrender.com/about

## Archive Page

`/archive` is the working-notes area of Studio Archive. Use it like a lightweight
Notion database for material that supports portfolio work.

Good archive entries include:

- process notes
- research summaries
- reference lists
- case study outlines
- image caption rules
- layout experiments
- short observations from ongoing work

The deployed archive currently shows entries such as:

- `Grid Density Research`
- `Case Study Outline`
- `Image Caption Rules`

## Add an Archive Note

Create a JSON file in `content/notes`.

Example:

```json
{
  "slug": "brand-reference-notes",
  "title": "Brand Reference Notes",
  "date": "2026-07-08",
  "category": "Research",
  "tags": ["Branding", "Reference"],
  "excerpt": "Brand system references and direction notes collected before a case study."
}
```

After pushing to GitHub, Render redeploys the site and the note appears at:

```text
https://studio-archive.onrender.com/archive
```

## Add a Project

Create a JSON file in `content/projects`.

Important fields:

- `slug`: detail page URL, for example `/projects/my-project`
- `title`: project title
- `category`: one of `Branding`, `UI/UX`, `Editorial`, `Motion`, `Art Direction`
- `coverImage`: image path from `public/images`
- `featured`: set to `true` to allow the project to appear on the home page
- `blocks`: case study content blocks

Images should be added under `public/images` and referenced like this:

```json
"coverImage": "/images/my-project-cover.jpg"
```

## Local Development

From the repository root:

```powershell
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Useful checks:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## Deployment

Studio Archive is deployed as the `studio-archive` service in `render.yaml`.

Render build settings:

```yaml
buildCommand: npm ci --include=dev && npm run build
startCommand: npm run start -- -p $PORT
```

Push changes to GitHub `main` to trigger a Render redeploy.
