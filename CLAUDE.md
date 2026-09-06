# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                  # Dev server (ionic serve, port 8101)
npm run build              # Production build → www/
npm test                   # Karma/Jasmine unit tests
npm run lint               # ESLint + Angular ESLint

# Mobile builds (swaps capacitor config via configure.js, then syncs)
npm run ios-prod           # Production → iOS
npm run ios-stg            # Staging → iOS
npm run android-prod       # Production → Android
npm run android-stg        # Staging → Android
npm run web-prod           # Production → ionic serve
npm run web-stg            # Staging → ionic serve

# npm install requires --legacy-peer-deps due to @angular-eslint/schematics peer conflict
npm install --legacy-peer-deps
npm uninstall <pkg> --legacy-peer-deps
```

## Android Release Builds

The signed AAB must be generated from Android Studio (not CLI) — the keystore is at `D:\DYSPO\keystores\dyspo-upload-key.jks`, alias `dyspo-upload`. Workflow:
1. Bump `versionCode` and `versionName` in `android/prod/app/build.gradle`
2. Run `npm run android-prod` to build web assets and sync
3. Android Studio → `android/prod/` → **Build > Generate Signed Bundle** → release variant
4. Upload `android/prod/app/release/app-release.aab` to Play Console

Current versionCode: **61** (v1.3.9). Always check Play Console for the last used versionCode before bumping — Play Console rejects codes already submitted even if unpublished.

## Architecture

**Stack**: Angular 20 + Ionic 8 + Capacitor 7, targeting iOS/Android/web. Firebase handles all backend (Auth, Firestore, Realtime DB, Storage, Functions, FCM).

**Key split**: Firestore pour toutes les données structurées (users, events, friends, dyspos, chat messages). Les messages de chat sont stockés dans `agenda_events/{uid}/messages_list` (Firestore), pas dans Realtime Database.

**Environment management**: `src/environments/environment.ts` (staging) / `environment.prod.ts` (production). `configure.js` copies environment-specific Capacitor configs from `cap-configs/{platform}/` to `capacitor.config.ts`. Never manually edit `capacitor.config.ts` — use the npm scripts.

## Service Layer

All services use `providedIn: 'root'` and are initialized after login via `initService(uid)`. `app.component.ts` orchestrates this chain on auth state change: `UserService → FriendsService → AgendaService → ChatService → NotificationService`. On logout, `killAllServices()` cancels all Firestore listeners and clears local state.

| Service | Responsibility |
|---|---|
| `AuthService` | Firebase Auth (login, register, logout, delete) |
| `UserService` | Current user profile, Firestore `users/{uid}` subscription |
| `FriendsService` | Friend list with BehaviorSubject (`friends$`), friend groups, device contacts |
| `AgendaService` | Event CRUD, recurrence, Dyspo status, invite logic |
| `ChatService` | Group chat, messages Firestore (`agenda_events/{uid}/messages_list`), pagination |
| `NotificationService` | FCM, local notifications, notification routing |
| `MediaService` | Camera/gallery, Firebase Storage uploads. `saveToGallery()` uses `Filesystem` (write to cache) + `Share` (system share sheet) — **not** `@capacitor-community/media` (removed, see constraints) |
| `CalendarService` | Export events to Google Calendar (URL) or ICS file; includes event description, location, and `dyspo://event/<uid>` deep link |
| `UtilsService` | Toast/Alert/Loading UI, Firebase error → French message mapping |
| `LoggerService` | Debug logging, error submission to Firestore |

**Reactive state**: Services expose BehaviorSubjects (e.g. `FriendsService.friends$`, `friendGroups$`). Components must **subscribe** to these Observables — never read the backing arrays synchronously in `ngOnInit`, as Firestore data may not have arrived yet. Firestore `onSnapshot` callbacks may run outside the Angular zone in `@angular/fire` v20 — call `ChangeDetectorRef.detectChanges()` after mutating component state from a subscription if the view doesn't update.

**AgendaService** sets up four persistent `onSnapshot` listeners in `initService()`: `eventsOnSnapshotCancel` (own events via `members_uid`), `eventInvitationsOnSnapshotCancel` (pending invites via `members_invited_uid`), `dysposOnSnapshotCancel` (daily availability), `holidaysOnSnapshotCancel` (global holidays). All are cancelled in `unsubscribeAllAfterLogoutEvent()`.

## Routing

Tab-based shell at `/tabs` with child routes: `agenda/:dataMode`, `friends`, `chat`, `profile`. All pages are lazy-loaded modules. Deep links use route state (via `router.getCurrentNavigation()?.extras.state`) rather than URL params for complex objects like `AgendaEvent`.

## Key Data Models (`src/app/models/models.ts`)

- **`AgendaEvent`**: Central model. Date storage is deliberately redundant — `startISO`/`endISO` hold the actual datetime (with hours/minutes), `start_date_ts`/`end_date_ts` are normalized to day boundaries (00:00:00 / 23:59:59.999) for Firestore range queries, and `ref_start_ISO`/`ref_end_ISO` are the YYYY-MM-DD strings used for calendar dot rendering. Always populate all three sets when creating or updating events.
- **`Friend`**: Extends `AppUser` with `friend_status`. `FRIEND` = mutual, `SUGGESTED` = invitation received, `INVITED` = invitation sent, `NOFRIEND` = no relation. `PENDING` is defined but unused. Friend data (name, avatar) is nested under `userData: AppUser` — access as `friend.userData?.firstname`, not top-level fields.
- **`UserDyspoStatus`**: Availability enum (`DYSPO | NODYSPO | DYSPOWITHKIDS | UNDEFINED`) stored at `agenda_dyspos/{uid}/dyspo_list/{date_key}`.
- **`AppUser`**: Full user profile with `appSettings` (notification/privacy prefs), stored at `users/{uid}`.

## Pages & Components

**Create-event** (`src/app/pages/agenda/create-event/`) handles both create and edit via the route segment `new` vs `edit`. In `new` mode it generates a UID as `agev_${Date.now()}` and reads `tsDate` from router state. In `edit` mode it loads the full `AgendaEvent` from router state. Includes Google Places autocomplete (debounced 300ms) for location.

**AgendaEventInfoComponent** (shared, opened as modal) is the primary action surface for events: edit, quit, accept/decline invitation, open chat, view member conflicts, and add to device calendar. `isInvitation: boolean` controls which actions are shown.

**Shared components** live in `src/app/components/` and are declared/exported by `src/app/modules/shared/shared.module.ts`: `AgendaEventInfoComponent`, `AgendaEventMiniComponent`, `FriendsSelectorComponent`, `FriendProfileComponent`, `StatusPickerComponent`, `HelperComponent`, and others. Feature modules import `SharedModule` to access these — they are not re-exported from `CoreModule`.

**Calendar** (`src/app/calendar/`) is a local component library (not an npm package). `CalendarComponent` (`ion-calendar`) wraps `MonthComponent` (`ion-calendar-month`). Orange event dots are driven by `[eventDates]="calendarEventDates"` — a `Set<string>` of `YYYY-MM-DD` strings built in `agenda.page.ts:buildCalendarEventDates()` from `agendaEvents` and passed through `CalendarComponent` → `MonthComponent`, where `hasEventOn(time)` does a `Set.has()` lookup. Do not use `day.isEvent` mutation for this — it is unreliable across change detection cycles.

## Firestore Indexes

Several queries require composite indexes created manually in each Firebase project:

- `agenda_events`: `members_uid` (Arrays) + `start_date_ts` (Ascending) — used by the friends-selector participant availability check
- When an index is missing, Firebase logs an error with a direct Console link to create it

## Deep Links (`dyspo://event/<uid>`)

The `dyspo://` custom URL scheme lets external links open the app at a specific event. Registration:
- **Android**: intent filter in `android/prod/app/src/main/AndroidManifest.xml` and `android/stg/...`
- **iOS**: `CFBundleURLTypes` entry in `ios/prod/App/App/Info.plist` and `ios/stg/...`

Runtime flow: `app.component.ts` registers `App.addListener('appUrlOpen', ...)` which parses the UID and stores it in `AgendaService.pendingDeepLinkEventUid`. `agenda.page.ts:ionViewWillEnter()` calls `handlePendingDeepLink()` which reads and clears the pending UID, then opens the matching event modal.

Cold-start limitation: if the app was not running when the link was tapped, `agendaEvents` may not yet be populated from Firestore when `ionViewWillEnter` fires — the modal won't open, but the user lands on the agenda page.

## Safe Area (Android 15 Edge-to-Edge)

Android 15 enforces edge-to-edge display. Use `env(safe-area-inset-bottom)` at the **footer/container level**, not on individual toolbar paddings. The global rules in `src/global.scss` cover standard `ion-toolbar` / `ion-tab-bar` / `ion-content` cases. Per-component fixes are needed for:
- Custom footers without `ion-toolbar` child — add `padding-bottom: env(safe-area-inset-bottom)` to the footer container
- Chat input: handled on `.wa-footer` background container, not `ion-toolbar --padding-bottom`
- Non-standard footer padding: use `max(Xpx, env(safe-area-inset-bottom))` to keep a minimum padding

## Important Constraints

- **Recurrence** is capped at 1 year maximum to limit Firestore writes (enforced in `AgendaService.saveOrUpdateEvent`).
- **Dyspo batch writes** split at 490 operations per batch (Firestore hard limit is 500).
- **Firestore `added` vs `modified`**: when a user accepts an event invitation, their UID moves from `members_invited_uid` to `members_uid`, so the event appears as `added` (not `modified`) in the `queryAgendaEvents` listener. The `acceptEventInvitation()` method also immediately pushes the event to the local `agendaEvents` array before Firestore responds, so the calendar updates without waiting for the snapshot.
- **`@capacitor-community/media` is removed** — Google Play rejected the app because `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` permissions were flagged as not core to the app's purpose. The plugin also cannot be stripped via `tools:node="remove"` in the manifest (Play's APK analyzer scans embedded AAR manifests). Do not re-add this plugin. Use `@capacitor/filesystem` + `@capacitor/share` for saving images instead.
- **Android manifest — storage/media permissions must be fully removed** — `@capacitor/camera` v7 declares `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` via `@Permission` annotations. On Android 13+, Google Play's static analyzer treats these as equivalent to `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO` and rejects the app. The `AndroidManifest.xml` (prod and stg) uses `tools:node="remove"` to strip all five permissions: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`. Do not add any of these back — the app uses exclusively the Android Photo Picker (no permissions required on Android 11+).
- **`proguard-android.txt` is no longer supported** by Android Gradle Plugin 8+. Always use `getDefaultProguardFile('proguard-android-optimize.txt')` in `build.gradle` files. A `postinstall` script (`scripts/fix-proguard.js`) patches Capacitor plugin `build.gradle` files in `node_modules` automatically — re-run `npm install` or `node scripts/fix-proguard.js` if adding new Android plugins.
- **`Contacts.requestPermissions()`** must always be wrapped in a `platform.is('ios') || platform.is('android')` check before calling — the Capacitor web implementation throws `Not implemented on web` which propagates to Angular's error handler even inside try/catch via Zone.js.
- **`@angular/fire` v20 injection context warnings** — Firebase APIs (`getDoc`, `onSnapshot`, etc.) called inside Firestore snapshot callbacks run outside Angular's injection context. These appear as `console.warn` in `angular-fire.mjs`. They don't crash the app but indicate calls should be wrapped with `runInInjectionContext` or moved to service constructors. This is a known systemic issue — do not silence the warnings by patching `angular-fire.mjs`.

## i18n

`ngx-translate` with HTTP loader. Default language: French. Translation files in `src/assets/i18n/`. UI strings are predominantly hardcoded in French rather than using translation keys — use French for any new user-facing text.
