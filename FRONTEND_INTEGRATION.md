# Frontend integration contract

Follow `ARCHITECTURE_SKELETON.md` as placement authority.

For a server-backed feature trace end-to-end: route -> screen -> feature hook -> service -> apiClient -> endpoint -> response mapper -> domain model -> UI state. Synchronize request/response types with `../docs/API_CONTRACT.md`.

Don't automatically put fetched server entities into Zustand; prefer existing server-state solution where available, while honoring the skeleton's shared-state guidance. No direct MongoDB access from mobile for this Express-backed app.

Expo Router note: route file names in `app` or `src/app` create URLs; sample `app/screens/example/ExampleScreen.tsx` can accidentally create an extra route. Prefer a thin `index.tsx` or intended route filename and import `features/<feature>/<Feature>Screen.tsx`. This clarifies rather than silently rewrites the original skeleton.

Require loading, empty, populated, validation, error, permission and retry behavior appropriate for each feature. Update relevant feature documentation with actual routes.
