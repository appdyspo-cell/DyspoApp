---
description: Initialize and summarize the DyspoApp project context for a new session
---

# /init — DyspoApp Session Initialization

Follow these steps to get fully up to speed on the project at the start of any session.

## 1. Confirm the dev server is running
Check if `npm start` is already running in `d:\DYSPO\APP\DyspoApp`.
If not, run it:
```bash
npm start
```
The app is served on **http://localhost:8101** via `ionic serve`.

## 2. Read project documentation
Read `CLAUDE.md` at the project root — it contains the full architecture, service map, routing, data models, and important constraints.  
Read `CHANGELOG_ANTIGRAVITY.md` for recent changes made in previous sessions.

## 3. Stack summary (from memory)
- **Framework**: Angular 20 + Ionic 8 + Capacitor 7
- **Backend**: Firebase (Firestore + Realtime DB + Auth + Storage + FCM)
- **Environment**: `environment.ts` (staging) / `environment.prod.ts` (prod)
- **Language**: French (UI hardcoded in French, ngx-translate for i18n keys)

## 4. Key service chain (initialized after login)
```
AuthService → UserService → FriendsService → AgendaService → ChatService → NotificationService
```
All initialized in `app.component.ts` on auth state change.

## 5. Key directories
| Path | Contents |
|---|---|
| `src/app/pages/` | All page components (agenda, friends, chat, login, register…) |
| `src/app/components/` | Shared components (modals, selectors, profile…) |
| `src/app/services/` | All services |
| `src/app/models/models.ts` | All TypeScript interfaces and enums |
| `src/assets/i18n/` | Translation files (fr.json, en.json, es.json…) |
| `src/global.scss` | Global design tokens + utility styles |

## 6. Design system tokens (in `global.scss`)
| Token | Usage |
|---|---|
| `--d-brand` | Primary teal color |
| `--d-surface-1/2/3` | Background layers |
| `--d-text-primary/secondary/tertiary` | Text hierarchy |
| `--d-radius-md/lg/pill` | Border radius |
| `--d-space-*` | Spacing scale |

## 7. Main tab routes
```
/tabs/agenda   → Agenda page (calendar + events)
/tabs/friends  → Friends, groups, invitations
/tabs/chat     → Discussions (group-list page)
/tabs/profile  → User profile + settings
```

## 8. Firestore data paths (most common)
```
users/{uid}                           → AppUser profile
friends/{uid}/friend_list/{fuid}      → Friend relationships
agenda_events/{event_uid}             → AgendaEvent documents
agenda_dyspos/{uid}/dyspo_list/{date} → Daily availability (Dyspo)
friend_groups/{uid}/friend_group_list/{gid} → Friend groups
```

## 9. Current known state
- `npm start` runs continuously on port 8101 (hot-reload active)
- All new UI text must be in **French**
- Never manually edit `capacitor.config.ts` — use npm scripts
- Recurrence is capped at 1 year max (Firestore write limit protection)
- Firestore `onSnapshot` may run outside Angular zone — use `ChangeDetectorRef.detectChanges()` if the view doesn't update

## 10. Confirm readiness
After reading the above, confirm:
- [ ] Dev server is running
- [ ] CLAUDE.md and CHANGELOG_ANTIGRAVITY.md have been reviewed
- [ ] Active document context is noted (from user's open editor tabs)
- [ ] Ready to assist — ask the user what they want to build or fix today
