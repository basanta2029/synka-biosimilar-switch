# Repository Guidelines

## Project Structure & Module Organization
- `backend/` contains the Node.js + Express API written in TypeScript with Prisma models under `prisma/` and request logic in `src/{controllers,services,routes}`.
- `mobile/SynkaApp/` holds the React Native client (TypeScript) with views and hooks inside `src/`, Metro configs at the root, and Jest specs in `__tests__/`.
- `android/`, `mobile/`, and `web/` mirror platform-specific workspace assets; prioritize the app-specific README files in each tree for environment details.
- `docs/` centralizes PRDs, backlog specs, and meeting artifacts—update these alongside any functional change to keep product context accurate.

## Build, Test, and Development Commands
- **Backend**: `cd backend && npm install` sets dependencies, `npm run dev` starts ts-node-dev with hot reload, `npm run build && npm start` compiles and serves the production build, and Prisma helpers (`npm run prisma:generate | prisma:migrate | prisma:studio`) manage the PostgreSQL schema.
- **Mobile**: `cd mobile/SynkaApp && npm install` once per clone, `npm start` launches Metro, `npm run android` or `npm run ios` deploys to simulators/emulators, and `bundle install && bundle exec pod install` readies CocoaPods when touching iOS native code.
- Prefer running commands from each package root; do not mix workspaces inside a single terminal tab to avoid NODE_PATH confusion.

## Coding Style & Naming Conventions
- Use TypeScript in both backend and mobile layers; keep strict typing, avoid `any`, and prefer descriptive interfaces under `src/types`.
- Follow 2-space indentation in React Native components and 2- or 4-space (match file) indentation in backend services; keep imports sorted by module scope (external, internal, relative).
- React components adopt PascalCase filenames (`PatientList.tsx`), hooks & utilities use camelCase, and Express route modules use kebab-case files inside `routes/`.
- Run `npm run lint` (mobile) or `npx prettier --write` within each workspace before pushing; format Prisma schemas via `npx prisma format`.

## Testing Guidelines
- Mobile tests live in `mobile/SynkaApp/__tests__` and run with `npm test`, which invokes Jest; add component or hook-focused cases mirroring filenames (`MyScreen.test.tsx`).
- Backend currently has no automated suite—when adding tests, colocate under `backend/src/__tests__` and use Jest or Vitest; ensure Prisma migrations run against a disposable database during CI.
- Target >80% coverage on new modules and document any intentional gaps in the PR description.

## Commit & Pull Request Guidelines
- Follow the `<scope>: <imperative summary>` convention observed in `git log` (e.g., `backend: add appointment alerts API`); keep scope nouns aligned with directory names.
- Commits should be focused: database migrations, API changes, and UI updates should not share a single commit unless they are tightly coupled.
- Pull requests must include: summary of changes, testing evidence (`npm run dev`/`npm test` output or screenshots), related issue links, migration notes, and any docs updates performed.
- Request at least one reviewer owning the affected area (backend, mobile, docs) and wait for CI green lights before merging.
