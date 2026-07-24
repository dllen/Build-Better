# Repository Guidelines

This is a React + TypeScript + Vite application deployed on Cloudflare Pages. It includes tools for code formatting, PDF processing, and algorithm visualization.

## Project Structure

```
├── src/               # React components, pages, hooks, and utilities
├── public/            # Static assets (built libs go here)
├── libs/              # External libraries (pdfcraft, algorithm-visualizer, etc.)
├── functions/         # Cloudflare Pages Functions (server-side)
├── tests/             # Node.js test files (*.test.mjs)
├── bin/               # CLI utilities (csv2json, format-json)
├── scripts/           # Build and utility scripts
└── docs/              # Documentation
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at localhost:5173 |
| `npm run build` | Full build (libs + TypeScript + Vite + sitemap) |
| `npm run build:pdf` | Build pdfcraft submodule |
| `npm run check` | TypeScript type checking |
| `npm run lint` | ESLint validation |
| `npm run format` | Prettier code formatting |
| `npm run test` | Run Node.js tests (csv2json.test.mjs) |
| `npm run pages:dev` | Preview with Cloudflare Pages Functions |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages |

## Coding Style

- **Formatter**: Prettier (2 spaces, semicolons, no single quotes, 100 char line width)
- **Linter**: ESLint with TypeScript-ESLint recommended rules
- **React**: Use functional components with hooks; follow `react-hooks` rules
- **TypeScript**: Strict mode enabled; avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for file names

Run `npm run format` before committing.

## Testing

Tests use Node.js built-in `--test` runner:

```bash
npm run test           # Run all tests
npm run bench:csv      # CSV to JSON benchmark
```

Test files must end with `.test.mjs`.

## Git Workflow

### Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci
Scope: module or feature area (e.g., code-formatter, pdf-tools)
```

Examples:
- `feat(code-formatter): add SQL formatting support`
- `fix(csv): resolve parsing edge case`
- `ci: update Cloudflare Pages workflow`

### Pull Requests

1. Run `npm run check && npm run lint && npm run test` before submitting
2. Describe changes in the PR body
3. Link related issues
4. Preview deployments are automatic for PRs

## Cloudflare Pages Deployment

- **Production**: Pushes to `main` trigger automatic deployment
- **Preview**: Each PR gets a preview URL
- **Functions**: Server-side logic lives in `functions/`
- **Submodules**: After cloning, run `git submodule update --init --recursive`

## Environment Variables

Configure in Cloudflare Pages dashboard under Settings > Environment variables, or locally in `.env`.

## New Features (v2)

### Command Palette
- Press `Cmd/Ctrl+K` anywhere to open the command palette
- Search for tools, games, and pages
- Click the search button in the navbar for mobile
- Star/favorite items appear at the top

### Theme Toggle
- Click the theme icon in the navbar to cycle through: Light → Dark → System
- Settings page also has a theme dropdown

### Favorites
- Star tools in the command palette to add to favorites
- Favorites appear at the top of the command palette
- Manage favorites in Settings page

### History
- Automatically tracks visited tool and game pages
- View history in Settings page
- Click to remove individual items or clear all

## E2E Testing (Playwright)

```bash
npm install           # Install dependencies (including @playwright/test)
npx playwright install # Install browsers
npm run test:e2e      # Run all e2e tests
npm run test:e2e:ui   # Run with UI mode
```

Test files are in `e2e/` directory and must end with `.spec.ts`.
