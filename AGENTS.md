# Serviq Mobile — scoped Codex instructions

- Read `ARCHITECTURE_SKELETON.md` for placements before writing frontend changes. This user-authored contract is kept intact; consult current Expo Router docs where actual routing constraints override illustrative placeholder paths.
- React Native / Expo Router / TypeScript. Thin `app/` route files; real features live in `features/`; services isolate fetch; raw DTOs in models/api and mapped domain models in models/domain when warranted; Zustand only for shared/persisted **client** state.
- Check current Expo SDK and file locations (`app/` versus `src/app/`) before scaffolding; honor what the actual project uses. Do not create example files solely because skeleton shows them.
- Authenticated routes live in `src/app/(app)/`; shared navigation belongs to `features/navigation/` and role/permission/title configuration to `navigation.ts`. Layouts own `AppHeaderBar` and tabs; do not add page headers/navigation footers inside feature screens. Preserve active-exam navigation protection and session-keyed import handoff. See `../docs/UI_DESIGN_SYSTEM.md` for route integration.
- For any user-facing feature requiring backend change, coordinate with root cross-stack instructions. Never fake data as a real API integration. Implement loading, empty, success, error, access denied, retry and offline states when relevant.
- When adding packages use Expo-compatible install practice; report permissions, config plugins, native rebuild and lockfile changes.
- Update affected docs/specs and show real verification evidence. See `../docs/DELIVERY_REPORT_TEMPLATE.md`.
- This folder is its own Git repository for `ExamQuest-frontend`; commit and push frontend changes only from `frontend/`. Do not use the workspace root as a Git repository, and do not include `.env`, secrets, `node_modules`, generated builds, or cache files.

## Automatic synchronization / task closeout
- Automatically load the root `../AGENTS.md`, `../docs/PROJECT_STATE.md`, and task-relevant docs selected from `../docs/DOCS_INDEX.md` (do not reread every document in full).
- On any changed feature update verified status in `../docs/PROJECT_STATE.md`, related feature spec, API contract and changelog as applicable; coordinate opposite layer for cross-stack implementation.
- Update this scoped `AGENTS.md` **only** if enduring coding/agent rules or documentation paths change, not for each feature. If root or other scoped agent also needs a policy change, synchronize only the relevant instruction sections.
- Final answer must say what changed in *both* layers or why a layer is unaffected, dependencies/install/rebuild commands and evidence, plus Bangla viewer demo instructions. Do not say COMPLETE when a required integration is missing.
