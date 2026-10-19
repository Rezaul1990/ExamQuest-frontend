# ExamQuest frontend

Existing Expo React Native / Expo Router / TypeScript application for Member, Admin and Staff. Open the parent ExamQuest workspace for coordinated backend work; this folder is its own Git repository.

## Source map
- `src/app/_layout.tsx`: session restoration and protected route groups.
- `src/app/(app)/`: authenticated Home, Exams, Results, Papers, Staff, Profile and nested Management routes.
- `src/features/navigation/navigation.ts`: role/permission rules, titles and workspace destinations; `src/constants/Routes.ts`: shared home/auth/profile URLs.
- `src/features/`: feature UI and hooks; `src/services/`: API boundary; `src/models/`: contracts; `src/store/`: shared auth state.
- [Architecture mapping](ARCHITECTURE_SKELETON.md), [scoped instructions](AGENTS.md), [project docs](../docs/DOCS_INDEX.md).

## Local commands
From `frontend/`, use `npm ci` when dependencies need installing, then `npm start` (or `npm run web` / `npm run android`). These are setup instructions, not evidence that installation or a device launch ran.

The API base URL resolves from `EXPO_PUBLIC_API_BASE_URL`, then Expo `extra.apiBaseUrl`, then the localhost fallback in `src/constants/Config.ts`. Device localhost is the device itself; use the reachable development backend address. Restart Expo after changing its environment/configuration. Never put server secrets in Expo public configuration.

Run `npm run typecheck`, `npm run lint` and `npm test`. See [workspace setup](../docs/INSTALLATION_GUIDE.md) and [release runbook](../docs/RELEASE_RUNBOOK.md) for verification limits. This is an existing app: the starter `reset-project` script is not a setup step.