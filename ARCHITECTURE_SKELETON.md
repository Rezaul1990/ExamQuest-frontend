# Reusable React Native App Architecture Skeleton

Purpose: ei file ta jekono new/basic React Native app e dile AI agent bujhte parbe app er folder structure, layer boundary, file placement, and feature add korar standard way. Eta kono specific product/app/domain er feature list na.

Use this as the app's architectural contract.

## Core Idea

App code layer wise thakbe:

```text
route -> feature screen/hook -> service/repository -> API/local data source
                         -> store when state is shared or persisted
                         -> models/types for data contracts
```

Rule: UI, business logic, data fetching, shared state, and types ek jaygay mix kora jabe na.

This skeleton is not a feature list. Example names are placeholders only. If the user says "implement X", first decide what kind of work X is, then place files by responsibility using the matrix below.

## Placement Decision Matrix

Use this table before creating or editing files.

```text
Thing to implement                         Put it here
----------------------------------------   -----------------------------------------
Navigable screen/page                      app/ thin route + features/<feature>/
Screen UI implementation                   features/<feature>/<Feature>Screen.tsx
Feature-only UI component                  features/<feature>/components/
Reusable UI component                      components/
Feature-only hook                          features/<feature>/hooks/
Reusable hook                              hooks/
API call / backend request                 services/<feature>Service.ts
API client wrapper                         services/apiClient.ts
API endpoint constants                     services/endpoints.ts or constants/Config.ts
Swagger/OpenAPI raw response type          models/api/
Frontend/domain data type                  models/domain/
Store type/interface                       models/store/
API-to-domain conversion                   services/<feature>Mapper.ts
Shared/persisted state                     store/stores/<feature>Store.ts
Store persistence/cache helper             store/utils/
Static config / feature flag               constants/Config.ts
Route name/path                            constants/Routes.ts
Route param type                           constants/RouteParams.ts
Theme color/spacing/type token             constants/
Pure formatter/validator/helper            utils/
Feature-specific helper                    features/<feature>/
Image/icon/font/static file                assets/
Build/generation/maintenance command       scripts/
Architecture/reference note                docs/
Tests for feature logic                    features/<feature>/__tests__/
Tests for service/mapper                   services/__tests__/
Tests for shared utility                   utils/__tests__/
Tests for store behavior                   store/__tests__/
```

If a file could fit in two places, choose the more local place first. Promote to shared folders only after more than one feature needs it.

## MVC-Style Frontend Mapping

For frontend apps, use this practical MVC-style mapping:

```text
Model       -> models/ + services/mappers + store state shape
View        -> app/ route entries + features/ screens + components/
Controller  -> feature hooks + service workflow functions
Data layer  -> services/apiClient + services/<feature>Service
State layer -> store/
```

Do not copy backend MVC folders directly into the frontend. Frontend architecture should stay screen/feature driven, with data access isolated in services.

## Recommended Root Structure

```text
app/                 Route entries and route layouts
features/            Feature modules and real screen implementations
components/          Shared reusable UI components
hooks/               Shared cross-feature React hooks
services/            API calls, repositories, data workflows, mappers
store/               Shared/persisted app state
models/              Types and data contracts
constants/           Routes, config, theme tokens, static app constants
utils/               Pure helpers and cross-cutting utilities
styles/              Global/shared style helpers
assets/              Images, icons, fonts, static files
scripts/             Build, validation, generation, maintenance scripts
docs/                Architecture/product/reference documentation
__tests__/           Optional root-level shared tests
```

Optional folders only if needed:

```text
android/             Native Android project
ios/                 Native iOS project
plugins/             Expo/config plugins
e2e/                 End-to-end tests
integration/         Integration tests
fixtures/            Test fixtures/mock data
```

## Copy-Ready Standard Skeleton

Fresh app start korle ei structure follow koro. Je file current task e dorkar nai, sheta pore add kora jabe; but placement standard ei thakbe.

```text
app/
  _layout.tsx
  index.tsx
  +not-found.tsx
  screens/
    _layout.tsx
    example/
      ExampleScreen.tsx

features/
  example/
    ExampleScreen.tsx
    Example.styles.ts
    example.helpers.ts
    example.mappers.ts
    example.types.ts
    hooks/
      useExample.ts
    components/
      ExampleHeader.tsx
      ExampleContent.tsx
      ExampleList.tsx
      ExampleItem.tsx
      ExampleEmptyState.tsx
      ExampleErrorState.tsx
    __tests__/
      example.helpers.test.ts
      example.mappers.test.ts
      useExample.test.ts

components/
  AppText.tsx
  AppButton.tsx
  AppTextInput.tsx
  AppScreenHeader.tsx
  ErrorBoundary.tsx
  ErrorState.tsx
  LoadingState.tsx
  EmptyState.tsx
  layout/
    AppSafeAreaView.tsx
    ScreenFooter.tsx
    screenLayoutStyles.ts
  ui/
    Button.tsx
    LoadingSpinner.tsx
    index.ts
  __tests__/

hooks/
  useAsyncData.ts
  useDebouncedValue.ts
  useModal.ts
  useRefreshControl.ts
  useSearch.ts
  useThemeColor.ts
  __tests__/

services/
  apiClient.ts
  endpoints.ts
  exampleService.ts
  exampleMapper.ts
  clients/
    externalClient.ts
  shared/
    requestUtils.ts
  __tests__/
    exampleService.test.ts
    exampleMapper.test.ts

store/
  index.ts
  stores/
    appStore.ts
    exampleStore.ts
    themeStore.ts
    __tests__/
      exampleStore.test.ts
  utils/
    storeCache.ts
    storeHydration.ts
    zustandStorage.ts
  __tests__/

models/
  api/
    ExampleApiRequest.ts
    ExampleApiResponse.ts
    index.ts
  domain/
    Example.ts
    index.ts
  store/
    ExampleStore.ts
    index.ts
  common/
    ApiResponse.ts
    LooseValue.ts
    index.ts
  shared/
    Id.ts
    index.ts
  index.ts

constants/
  Routes.ts
  RouteParams.ts
  Config.ts
  Colors.ts
  Spacing.ts
  Typography.ts
  Assets.ts
  routeManifest.ts
  __tests__/

utils/
  apiErrors.ts
  dateUtils.ts
  formatters.ts
  platformStyles.ts
  validation.ts
  __tests__/

styles/
  globalStyle.ts

assets/
  images/
  icons/
  fonts/

scripts/
  generate-routes.js
  check-maintainability.js

docs/
  architecture.md
```

## Base File Responsibilities

```text
app/_layout.tsx                 Root providers, navigation stack, global wrappers
app/index.tsx                   Initial redirect or first app screen
app/screens/_layout.tsx         Screen-group layout
app/screens/<feature>/*.tsx     Thin route entry only

features/<feature>/*Screen.tsx  Real screen implementation
features/<feature>/*.styles.ts  Feature-only styles
features/<feature>/*.helpers.ts Feature-only pure logic
features/<feature>/*.mappers.ts Feature-only UI/data mapper
features/<feature>/hooks/       Feature-only hooks
features/<feature>/components/  Feature-only components

components/                     Shared UI only
hooks/                          Shared hooks only
services/apiClient.ts           HTTP/client wrapper
services/endpoints.ts           Endpoint path builders/constants
services/*Service.ts            Data operations/workflows
services/*Mapper.ts             Raw data to domain conversion
services/clients/               External SDK/client setup
store/stores/*Store.ts          Zustand/shared state stores
store/utils/                    Store persistence/cache/hydration helpers
models/api/                     Raw API request/response types
models/domain/                  UI/app-facing domain types
models/store/                   Store state/action types
constants/Routes.ts             Route constants
constants/RouteParams.ts        Route param contracts
constants/Config.ts             App config and feature flags
utils/                          Shared pure helpers
```

## Naming Rules

Use these names consistently:

```text
Screen file                     <FeatureName>Screen.tsx
Feature styles                  <FeatureName>.styles.ts
Feature hook                    use<FeatureName>.ts
Feature service                 <featureName>Service.ts
Feature mapper                  <featureName>Mapper.ts
Feature helper                  <featureName>.helpers.ts
Feature local type              <featureName>.types.ts
API request type                <FeatureName>ApiRequest.ts
API response type               <FeatureName>ApiResponse.ts
Domain model                    <FeatureName>.ts
Store file                      <featureName>Store.ts
Component                       <FeatureName><Part>.tsx
Test file                       sameName.test.ts or sameName.test.tsx
```

Examples are naming patterns only. Replace `Example` with the actual feature/resource name.

## Folder Responsibilities

### `app/`

Owns routing only.

Put here:

- route files
- route layouts
- route-level redirects
- route-level loading/error wrappers if needed

Do not put here:

- large UI trees
- API calls
- business rules
- store-heavy logic

Route file should be small and delegate to `features/`.

Example:

```text
app/
  _layout.tsx
  index.tsx
  screens/
    example/
      ExampleScreen.tsx
```

### `features/`

Owns feature implementation.

Each feature should keep its screen, local components, hooks, helpers, and tests together.

```text
features/
  exampleFeature/
    ExampleFeatureScreen.tsx
    ExampleFeature.styles.ts
    exampleFeature.helpers.ts
    exampleFeature.mappers.ts
    hooks/
      useExampleFeature.ts
    components/
      ExampleFeatureHeader.tsx
      ExampleFeatureList.tsx
      ExampleFeatureItem.tsx
    __tests__/
      exampleFeature.helpers.test.ts
```

Use `features/` for app-specific screens and workflows.

### `components/`

Owns shared UI building blocks reused by more than one feature.

Examples:

```text
components/
  AppText.tsx
  AppButton.tsx
  AppTextInput.tsx
  ScreenHeader.tsx
  EmptyState.tsx
  ErrorState.tsx
  LoadingState.tsx
  layout/
  ui/
```

Rule: if a component is only used by one feature, keep it inside that feature. Promote it to `components/` only when it is genuinely shared.

### `hooks/`

Owns reusable hooks used across features.

Examples:

```text
hooks/
  useAsyncData.ts
  useDebouncedValue.ts
  useModal.ts
  useSearch.ts
  useThemeColor.ts
```

Feature-only hooks stay inside:

```text
features/<feature>/hooks/
```

### `services/`

Owns data access and app workflows.

Put here:

- API functions
- repository functions
- request payload builders
- response mappers
- local storage workflows
- domain workflow functions

Example:

```text
services/
  apiClient.ts
  endpoints.ts
  exampleService.ts
  exampleMapper.ts
```

UI should not call `fetch` directly. UI calls feature hook; feature hook calls service.

### `store/`

Owns shared or persisted state.

```text
store/
  index.ts
  stores/
    appStore.ts
    exampleStore.ts
  utils/
    persistence.ts
    hydration.ts
    cache.ts
```

Use store for:

- data shared by multiple screens
- persisted user/app state
- app-wide settings
- cached API data used in multiple places

Do not use global store for:

- one modal open/close state
- temporary form fields
- single-screen UI state

Local state stays local.

### `models/`

Owns TypeScript data contracts.

```text
models/
  api/
    ExampleApiResponse.ts
  domain/
    Example.ts
  store/
    ExampleStore.ts
  common/
    ApiResponse.ts
    Nullable.ts
  shared/
    Id.ts
```

Rule:

- `models/api/` is for raw backend/request/response shapes.
- `models/domain/` is for app-facing clean data.
- UI should prefer domain models, not raw API DTOs.

### `constants/`

Owns stable app constants.

```text
constants/
  Routes.ts
  RouteParams.ts
  Config.ts
  Colors.ts
  Spacing.ts
  Typography.ts
  Assets.ts
```

Use constants for route names, theme tokens, config keys, feature flags, and static option lists.

### `utils/`

Owns pure helpers and cross-cutting utilities.

```text
utils/
  date.ts
  format.ts
  validation.ts
  errors.ts
  platform.ts
```

Rules:

- Utilities should be small and testable.
- Avoid putting feature-specific business logic in `utils/`.
- If helper belongs to one feature, keep it in that feature folder.

### `assets/`

Owns static files.

```text
assets/
  images/
  icons/
  fonts/
```

Use a constants file to centralize asset references when the app grows.

## Naming Convention

Use consistent names:

```text
FeatureNameScreen.tsx
FeatureName.styles.ts
featureName.helpers.ts
featureName.mappers.ts
useFeatureName.ts
featureNameService.ts
featureNameStore.ts
FeatureName.ts
FeatureNameApiResponse.ts
```

Prefer clear names over clever names.

## Feature Module Template

When creating a new feature, start with:

```text
features/
  <featureName>/
    <FeatureName>Screen.tsx
    <FeatureName>.styles.ts
    <featureName>.helpers.ts
    hooks/
      use<FeatureName>.ts
    components/
      <FeatureName>Header.tsx
      <FeatureName>Content.tsx
    __tests__/
      <featureName>.helpers.test.ts
```

If the feature needs API/data access, add:

```text
services/
  <featureName>Service.ts
  <featureName>Mapper.ts

models/
  api/
    <FeatureName>ApiResponse.ts
  domain/
    <FeatureName>.ts
```

If the feature needs shared/persisted state, add:

```text
store/
  stores/
    <featureName>Store.ts
```

If the feature needs routing, add:

```text
app/
  screens/
    <featureName>/
      <FeatureName>Screen.tsx

constants/
  Routes.ts
  RouteParams.ts
```

## Data Flow Standard

Preferred data flow:

```text
Screen
  -> feature hook
    -> service/repository
      -> apiClient/local storage
      -> mapper
    -> store update if shared
  -> render UI
```

Screen responsibilities:

- compose UI
- call hooks
- handle route params
- trigger user actions

Hook responsibilities:

- loading/error/refresh state
- call services
- connect screen to store
- expose clean screen data/actions

Service responsibilities:

- fetch/save data
- normalize backend/local data
- hide API details from UI

Store responsibilities:

- shared state
- persisted state
- cache state
- app-wide state transitions

## API Pattern

Use one API client wrapper:

```text
services/apiClient.ts
```

It should own:

- base URL resolution
- headers
- timeout
- JSON parsing
- common error handling
- auth token injection if the app uses auth

Feature services call the API client.

```text
services/exampleService.ts
  -> apiClient.get(...)
  -> mapExampleApiResponse(...)
  -> return Example
```

Do not spread raw `fetch` calls across screens/components.

## Backend Contract / Swagger Pattern

When backend Swagger/OpenAPI/API documentation is provided, convert it into frontend layers like this:

```text
Swagger endpoint
  -> models/api/ raw request/response types
  -> services/endpoints.ts endpoint path or builder
  -> services/apiClient.ts common request behavior
  -> services/<feature>Service.ts endpoint function
  -> services/<feature>Mapper.ts raw API to domain conversion
  -> models/domain/ clean app-facing type
  -> features/<feature>/hooks/ screen data/action hook
  -> features/<feature>/ UI
  -> store/ only if data is shared, cached, or persisted
```

Rules:

- Keep backend response shape in `models/api/`.
- Keep UI-friendly shape in `models/domain/`.
- Keep URL building and HTTP methods in `services/`.
- Keep loading/error/refresh behavior in hooks.
- Keep rendering in screens/components.
- Do not let screens manually build API URLs.
- Do not let raw Swagger DTOs spread through UI.

## External Data Source Pattern

For any external provider or SDK, keep the SDK boundary outside UI.

```text
External SDK/client setup      -> services/clients/ or services/<provider>Client.ts
External read/write operations -> services/<provider>Service.ts
Provider config/env keys       -> constants/Config.ts or app environment config
Provider raw data types        -> models/api/ or models/external/
App-facing mapped types        -> models/domain/
Shared provider state          -> store/ only if shared or persisted
```

Examples of provider categories: REST API, GraphQL API, Firebase, Supabase, MongoDB client/data API, local database, secure storage, file storage, payment SDK, analytics SDK, push provider, map provider, auth provider.

Important:

- A database like MongoDB is usually accessed through the backend, not directly from a mobile frontend.
- If direct client SDK access is intentionally used, wrap it in `services/` and expose clean functions to hooks.
- UI components should never contain provider SDK setup code.

## State Pattern

Use global store only when state is shared or persisted.

Good store candidates:

- app settings
- logged-in session, if app has auth
- theme
- shared cache
- data needed by multiple screens

Bad store candidates:

- current input text in one form
- selected tab inside one screen
- one modal visibility flag
- temporary animation state

## Routing Pattern

Centralize route constants:

```text
constants/Routes.ts
constants/RouteParams.ts
```

Route files should be thin:

```tsx
import { ExampleFeatureScreen } from '@/features/exampleFeature/ExampleFeatureScreen';

export default ExampleFeatureScreen;
```

Avoid hard-coded route strings across the app. Import route constants instead.

## Styling Pattern

Keep shared design tokens in constants:

```text
constants/Colors.ts
constants/Spacing.ts
constants/Typography.ts
```

Feature styles can live beside the feature:

```text
features/<feature>/<Feature>.styles.ts
```

Rules:

- use shared colors/spacing/type tokens
- avoid magic numbers when a token exists
- keep screen layout responsive
- do not duplicate the same style object across many files

## Testing Pattern

Test pure logic close to the code:

```text
features/<feature>/__tests__/
services/__tests__/
utils/__tests__/
store/__tests__/
components/__tests__/
```

Prioritize tests for:

- mappers
- services
- store behavior
- validators
- policy logic if the app has it
- complex hooks

Common commands:

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Adding a New Feature Checklist

1. Create `features/<featureName>/`.
2. Add `<FeatureName>Screen.tsx`.
3. Add local `components/`, `hooks/`, helpers, and styles as needed.
4. Add thin route file under `app/` if it is navigable.
5. Add route constant in `constants/Routes.ts` if routing is used.
6. Add service files in `services/` if data fetching or persistence is needed.
7. Add API/domain models in `models/` if structured data is needed.
8. Add store only if state is shared or persisted.
9. Add tests for logic, mapping, service behavior, or store behavior.
10. Run relevant tests/type/lint checks.

## Adding a New Shared Component Checklist

1. Confirm it is used by more than one feature.
2. Put it in `components/`.
3. Keep business rules out of it.
4. Use shared theme tokens.
5. Add tests if it has logic or important states.

## Adding a New Service Checklist

1. Put data access in `services/<name>Service.ts`.
2. Use `services/apiClient.ts` or a repository/local storage helper.
3. Put raw response types in `models/api/`.
4. Map raw data to domain types from `models/domain/`.
5. Return clean app-facing data to hooks/screens.
6. Add tests for mapping, empty state, and error behavior.

## Adding a New Store Checklist

1. Confirm state is not local-only.
2. Create `store/stores/<name>Store.ts`.
3. Export it from `store/index.ts`.
4. Add persistence/hydration only when needed.
5. Add reset behavior if state is sensitive.
6. Add store tests for important transitions.

## AI Agent Read Order

Before changing code, an AI agent should read:

```text
ARCHITECTURE_SKELETON.md
package.json
README.md
app/_layout.tsx
constants/Routes.ts
store/index.ts
services/apiClient.ts
```

Then read the nearest similar feature in `features/`.

If a listed file does not exist yet, create it only when the current task needs it.

## Do Not Do

- Do not put full feature implementations in route files.
- Do not call APIs directly from UI components.
- Do not put local form/modal state into global store.
- Do not leak raw API DTOs into UI when domain models are needed.
- Do not create shared components before they are actually shared.
- Do not hard-code route strings everywhere.
- Do not scatter app config across random files.
- Do not mix unrelated refactors into a feature task.

## Minimal Bootstrap Skeleton

For a fresh app, start with this:

```text
app/
  _layout.tsx
  index.tsx
  screens/
features/
components/
hooks/
services/
  apiClient.ts
store/
  stores/
  utils/
  index.ts
models/
  api/
  domain/
  store/
  common/
constants/
  Routes.ts
  RouteParams.ts
  Config.ts
  Colors.ts
  Spacing.ts
  Typography.ts
utils/
styles/
assets/
docs/
scripts/
```

## Agent Handoff Prompt

Use this prompt with Codex/AI agent:

```text
Read ARCHITECTURE_SKELETON.md first and follow it as the architecture contract.
Treat example names as placeholders, not fixed app features.
For any requested implementation, decide the file location by responsibility.
Keep route files thin. Put real feature code in features/.
Use services for data access, models for data contracts, store only for shared/persisted state,
components for reusable UI, hooks for reusable behavior, and constants for routes/config/theme.
When Swagger/API docs are provided, create API models, service functions, mappers,
domain models, hooks, and UI in their correct layers.
Before editing, inspect the nearest similar feature and copy the existing pattern.
After changes, run the smallest relevant tests plus type/lint checks when applicable.
```
