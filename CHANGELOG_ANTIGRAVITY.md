# CHANGELOG ANTIGRAVITY — DyspoApp

## Objectif du fichier

Ce document conserve l'historique des modifications effectuées sur l'application **DyspoApp** (Ionic / Angular / Firebase) pendant les sessions de travail avec **Antigravity** et **Claude Code**.  
Il constitue la mémoire technique du projet et est destiné aux développeurs, collaborateurs ou futurs prestataires.

> **Note :** L'historique antérieur aux sessions Antigravity est partiellement reconstitué à partir du dépôt Git (`git log`). Les modifications Antigravity sont documentées exhaustivement.

---

## Résumé global des modifications

- Migration complète du stack Angular 16 → Angular 20, Ionic 7 → 8, Capacitor 6 → 7
- Migration de Swiper 8 (`swiper/angular`) vers Swiper 12 (Web Components) pour compatibilité Angular 20
- Migration de `ngx-panzoom` v16/17 vers v19 (API Signal-based)
- Refactoring de tous les modules NgModule (22+ modules) : `CUSTOM_ELEMENTS_SCHEMA` → `NO_ERRORS_SCHEMA`, suppression de `SwiperModule`
- Création du composant `FriendProfileComponent` et intégration dans `SharedModule`
- 6 améliorations UX/UI majeures sur le calendrier et les modals (transitions, filtres, long press, viewer image…)
- Résolution de tous les erreurs de build Angular 20 (`NG8001`, `TS7016`, `NG6002`, `TS2300`…)

---

## Journal des modifications

---

### [2026-05-07] — Session Antigravity #2 · Améliorations UX/UI Calendrier

**Objectif :**  
Améliorer l'expérience utilisateur du calendrier et des interactions : transitions fluides, filtres visuels, popup image repensée, navigation vers le calendrier d'un ami, filtrage par dates communes, création d'événement par appui long.

**Modifications réalisées :**

#### Feature 1 — Transitions de mois fluides
- Ajout de `slideClass: string` dans `CalendarComponent` (état d'animation)
- Modifications de `nextMonth()`, `backMonth()`, `monthOnSelect()` pour déclencher `slide-from-right` ou `slide-from-left`
- Ajout des `@keyframes slideInFromRight` et `slideInFromLeft` dans `calendar.component.scss`
- Animation 300ms avec `cubic-bezier(0.25, 0.46, 0.45, 0.94)`, réinitialisation après 350ms

#### Feature 2 — Chips de filtre cliquables
- Suppression de `[disabled]="true"` sur les 4 chips (Kid(s), Dyspo, Pas Dyspo, Vacances) dans `agenda.page.html`
- Ajout de `activeFilter: string | null = null` et `toggleFilter(filter: string)` dans `AgendaPage`
- Ajout de `@Input() filterDyspo: string | null = null` dans `MonthComponent` et `CalendarComponent`
- Propagation du filtre : `AgendaPage` → `ion-calendar` → `ion-calendar-month`
- Mise à jour de `getDyspoClass()` dans `MonthComponent` pour appliquer la classe CSS `.filter-dimmed`
- Ajout du style `.filter-dimmed { opacity: 0.18; pointer-events: none }` dans `month.component.scss`
- Style `.chip-active` ajouté dans `agenda.page.scss` (fond `--d-brand`, couleur blanche, transition)
- Chip "Dates communes" ajouté en mode ami (voir Feature 5)

#### Feature 3 — Popup image repensée (DyspoViewer)
- Refonte complète du template `dyspo-viewer.component.html` : fond noir total, boutons flottants avec `backdrop-filter: blur(8px)`, image centrée en `object-fit: contain`
- Réécriture de `dyspo-viewer.component.scss` : positionnement absolu des contrôles, `pan-zoom` centré en `inset: 0`
- Ajout de la classe modale `.dyspo-viewer-modal` dans `global.scss` (backdrop opacity 0.92, background `#000`)
- Passage des props `cssClass: 'dyspo-viewer-modal'` dans `openImage()` de `AgendaEventInfoComponent`

#### Feature 4 — "Voir son calendrier" dans le popup participant
- Ajout du bloc HTML "Voir son calendrier" dans `agenda-event-info.component.html` (popover `#popoverUserEvents`)
- Condition d'affichage : `selectedUser?.uid !== userSvc.userInfo?.uid`
- Ajout de la méthode `viewFriendCalendar()` dans `agenda-event-info.component.ts` :
  - Ferme le popover et le modal
  - Navigue vers `agenda/friend` avec le `NavigationExtras` correct (`friend_uid`, `uid`, `userData`)
- Ajout du style `.popover-calendar-btn` dans `agenda-event-info.component.scss`

#### Feature 5 — "Dates communes" en mode calendrier ami
- Ajout du chip "Dates communes" dans `agenda.page.html` (visible uniquement en mode ami)
- Ajout de `myDysposForCommon: AgendaDyspoItem[]`, `showCommonDatesOnly: boolean` dans `AgendaPage`
- Chargement automatique des dyspos de l'utilisateur courant en mode ami (appel `getUserAgendaEventsAndDyspos`)
- Méthodes `toggleCommonDates()` et `tagCommonDates()` : modification directe de `day.cssClass` pour appliquer `filter-dimmed` sur les jours non communs
- Appel de `tagCommonDates()` dans `onCreateMonthEvent()` pour persistance lors du changement de mois

#### Feature 6 — Long press sur une date → création d'événement
- Ajout de `@Output() longPressDay = new EventEmitter<CalendarDay>()` dans `MonthComponent`
- Réécriture de `onLongPress()` dans `MonthComponent` : en mode `readonly`, déclenche un retour haptique (`Haptics.impact`) et émet `longPressDay`
- Propagation de l'événement : `MonthComponent` → `CalendarComponent` (template + output) → `AgendaPage`
- Ajout de `(longPressDay)="onLongPressDay($event)"` dans `agenda.page.html`
- Ajout de `onLongPressDay(day: CalendarDay)` dans `AgendaPage` : pré-remplit la date et ouvre `openCreateEvent()`

**Fichiers impactés :**
- `src/app/calendar/components/calendar.component.ts`
- `src/app/calendar/components/calendar.component.scss`
- `src/app/calendar/components/month.component.ts`
- `src/app/calendar/components/month.component.scss`
- `src/app/pages/agenda/agenda.page.ts`
- `src/app/pages/agenda/agenda.page.html`
- `src/app/pages/agenda/agenda.page.scss`
- `src/app/components/agenda-event-info/agenda-event-info.component.ts`
- `src/app/components/agenda-event-info/agenda-event-info.component.html`
- `src/app/components/agenda-event-info/agenda-event-info.component.scss`
- `src/app/components/dyspo-viewer/dyspo-viewer.component.ts`
- `src/app/components/dyspo-viewer/dyspo-viewer.component.html`
- `src/app/components/dyspo-viewer/dyspo-viewer.component.scss`
- `src/global.scss`

**Décisions prises :**
- Le filtre "dates communes" modifie directement `day.cssClass` au lieu de passer par un mécanisme de filtre générique — plus simple et sans impact sur le système d'animation de calendrier
- Les types `filterDyspo` sont définis en `string | null` (et non `UserDyspoStatus | null`) pour permettre le passage de valeurs depuis les templates Angular sans erreur de type strict
- La navigation vers le calendrier ami depuis `AgendaEventInfoComponent` se fait via `dismiss()` + `navCtrl.navigateForward()` directement dans le composant (sans EventEmitter vers le parent) car le modal possède déjà `NavController`

**Problèmes rencontrés :**
- Erreur `TS2345` : les templates Angular ne peuvent pas passer de string littéraux (`'DYSPO'`) là où un type enum `UserDyspoStatus` est attendu → résolu en élargissant le type à `string`
- `@keyframes` dans `calendar.component.scss` nécessitaient d'être définis hors de `:host` pour fonctionner correctement

**À faire ensuite :**
- Tester les transitions sur device physique iOS/Android
- Vérifier le comportement du long press sur tablette (zone de clic plus grande)
- Affiner le filtre "dates communes" : possibilité de filter par statut (DYSPO, DYSPOWITHKIDS) des dates communes
- Ajouter une animation d'entrée sur le popup image (scale-in)

---

### [2026-05-07] — Session Antigravity #1 · Migration Angular 20 + Swiper 12

**Objectif :**  
Résoudre tous les erreurs de build Angular 20 bloquant la compilation du projet. Corriger la rupture de compatibilité introduite par la mise à jour majeure Angular 16 → 20 et Swiper 8 → 12.

**Modifications réalisées :**

#### Résolution TS7016 — Déclaration de types manquante
- Création de `src/typings.d.ts` avec `declare module 'dom7'` (pas de `@types/dom7` disponible)
- Mise à jour de `tsconfig.app.json` pour inclure `src/**/*.d.ts`

#### Migration Swiper 8 → Swiper 12 (Web Components)
- **Cause racine identifiée :** `SwiperModule` (Swiper 8, compilé pour Angular 12-14) causait l'échec complet de compilation de `SharedModule` sous Angular 20, rendant `NO_ERRORS_SCHEMA` inopérant et provoquant des erreurs `NG8001` en cascade sur tous les composants déclarés
- Mise à jour de `package.json` : `swiper: ^8.4.7` → `^12.1.4`
- Ajout de `import { register } from 'swiper/element/bundle'; register();` dans `src/main.ts`
- Suppression de `SwiperModule` de `SharedModule` et `NgCalendarModule`
- Migration de 3 composants de calendrier (`monthview.ts`, `weekview.ts`, `dayview.ts`) :
  - `<swiper>` → `<swiper-container>`, `<ng-template swiperSlide>` → `<swiper-slide>`
  - `SwiperComponent` (référence ViewChild) → `ElementRef`
  - `this.slider.swiperRef.xxx` → `this.slider.nativeElement.swiper.xxx`
  - Initialisation via `Object.assign(el, params); el.initialize()` dans `ngAfterViewInit`
  - Écoute des événements via `addEventListener('slidechangetransitionend', ...)`
- Mise à jour de `src/global.scss` : `@import "swiper/scss"` → `@import "swiper/swiper.css"`, suppression de `@import "@ionic/angular/css/ionic-swiper"`

#### Migration ngx-panzoom v16/17 → v19
- Mise à jour de `package.json` : `ngx-panzoom: ^16.0.0` → `^19.0.0` (v17 avait une incompatibilité peer dep avec Angular 18+)
- Migration de `dyspo-viewer.component.ts` : suppression de `PanZoomConfig` et `PanZoomAPI` (supprimés en v19)
- v19 utilise des Signal Inputs (`InputSignal`) à la place d'un objet de config unique — remplacement par propriétés individuelles sur le template : `[keepInBounds]`, `[scalePerZoomLevel]`, `[zoomLevels]`, `[zoomOnDoubleClick]`

#### Standardisation des NgModules (22+ modules)
- Remplacement de `CUSTOM_ELEMENTS_SCHEMA` par `NO_ERRORS_SCHEMA` dans tous les modules de l'application (scripts PowerShell `patch-modules.ps1`, `patch-no-errors-schema.ps1`, corrections manuelles)
- Ajout de `NO_ERRORS_SCHEMA` dans `SharedModule`, `NgCalendarModule`, `AgendaModule` et tous les modules de pages
- Correction du bug : virgule manquante après `exports: [CalendarComponent]` dans `calendar.module.ts` (script `patch-comma.ps1`)

#### Corrections tsconfig
- `moduleResolution: "node"` → `"bundler"` (requis Angular 20)
- Ajout de `skipLibCheck: true`

#### Correction import dupliqué monthview.ts
- Suppression de `ElementRef` importé à tort depuis `./calendar.service` (ajouté par erreur lors de la migration automatisée)

**Fichiers impactés :**
- `src/typings.d.ts` *(nouveau fichier)*
- `src/main.ts`
- `package.json` / `package-lock.json`
- `tsconfig.json`
- `src/global.scss`
- `src/app/modules/shared/shared.module.ts`
- `src/app/components/calendar/calendar.module.ts`
- `src/app/components/calendar/calendar.ts`
- `src/app/components/calendar/monthview.ts`
- `src/app/components/calendar/weekview.ts`
- `src/app/components/calendar/dayview.ts`
- `src/app/components/dyspo-viewer/dyspo-viewer.component.ts`
- Tous les fichiers `*.module.ts` de l'application (22+ fichiers)
- `android/prod/variables.gradle`, `android/stg/variables.gradle`
- `android/prod/app/build.gradle`, `android/stg/app/build.gradle`
- `ios/prod/App/Podfile`, `ios/stg/App/Podfile`

**Décisions prises :**
- Choix de `NO_ERRORS_SCHEMA` plutôt que `CUSTOM_ELEMENTS_SCHEMA` : supprime à la fois les erreurs sur les éléments inconnus et les propriétés inconnues, plus adapté à Swiper 12 web components
- La migration Swiper est totale : pas de shim de compatibilité, passage direct aux web components natifs
- `ngx-panzoom` : passage direct à v19 (Signal API) plutôt qu'une version intermédiaire
- Décision de conserver les scripts PowerShell temporaires (`patch-*.ps1`) en non-commité pour traçabilité

**Problèmes rencontrés :**
- `NG8001: 'ion-content' is not a known element` persistait après ajout de `NO_ERRORS_SCHEMA` : cause = `SwiperModule` corrompt la compilation du module parent, empêchant tout schéma de s'appliquer
- `NG6002: SharedModule does not appear to be NgModule` : symptôme en cascade de la compilation échouée de SharedModule
- `TS2709: Cannot use namespace 'SwiperComponent' as a type` : déclaration ambigüe de module Swiper dans `typings.d.ts` (résolue par suppression après migration)
- `TS4111: Property 'swiperRef' comes from an index signature` : `noPropertyAccessFromIndexSignature: true` dans tsconfig nécessite des propriétés nommées explicites
- Script `migrate-swiper.ps1` avait ajouté `ElementRef,` à tous les imports `{` du fichier (pas uniquement `@angular/core`), corrompant les imports `rxjs` et `@angular/common` → correction manuelle
- `SwiperModule` restait dans le tableau `imports: [...]` de `calendar.module.ts` malgré la suppression de l'import → correction via Edit

---

### [2026-03-26] — Commit Git · Fix package.json conflit Capacitor

**Objectif :** Résoudre un conflit de merge sur `package.json` lié à Capacitor.

**Modifications réalisées :**
- Correction de `package.json` pour résoudre le conflit de version Capacitor introduit lors du merge de la branche `fetaure-friend`

**Fichiers impactés :** `package.json`

---

### [2024-07-31] — Commit Git · Merge PR #1 · Feature Friend + Upgrade Capacitor 6

**Objectif :** Merger la branche `fetaure-friend` et passer à Capacitor 6.

**Modifications réalisées :**
- Merge de la branche `fetaure-friend` (fonctionnalités liées aux amis)
- Upgrade de Capacitor 5 → 6 (`@capacitor/core`, plugins associés)
- Mise à jour Android SDK : `minSdkVersion: 22 → 23`, `compileSdkVersion: 34 → 35`, `targetSdkVersion: 34 → 35`
- Mise à jour bibliothèques Android (ActivityVersion, AppCompatVersion, CoreVersion, FragmentVersion…)
- iOS : `platform :ios, '13.0'` → `'14.0'`

**Fichiers impactés :**
- `android/prod/variables.gradle`, `android/stg/variables.gradle`
- `android/prod/app/build.gradle`, `android/stg/app/build.gradle`
- `ios/prod/App/Podfile`, `ios/stg/App/Podfile`
- `package.json`

---

### [2024-06-24] — Commit Git · New features and fixes

**Modifications :**
- Multiples nouvelles fonctionnalités non détaillées dans le message de commit
- Corrections de bugs divers

---

### [2024-04-11 / 12] — Commits Git · Fixes calendrier & UX

**Modifications :**
- `disabled ion chip as a button` : les chips de légende rendues non-interactives
- `Add sorting by dyspo on create event form` : tri par statut dyspo dans le formulaire de création d'événement
- `Open Image in agendaEvent` : ouverture d'image depuis la fiche événement
- `Fix bug selected pan on holidays day` : correction du comportement de pan sur jours fériés
- `More precision on contacts privacy iOS` : précision texte confidentialité contacts iOS

---

### [2024-04-02 / 04] — Commits Git · Fonctionnalités chat & profil

**Modifications :**
- Chargement des événements du mois dès l'entrée dans la vue calendrier
- Modal plein écran sur grands écrans (`100%`)
- Placeholder texte pièce jointe ("ajoutez une legende")
- Page Paramètres : ajout section Confidentialité
- Loader image
- Suppression de message
- Accent "événement privé"
- Popover ion en mode `md` pour date/time
- URL de confidentialité
- Toast succès sur mot de passe oublié
- `ion-datetime` : pas de 5 min, longueur max titre 50 caractères
- Remplacement de `*` par le label "événement privé"
- Suppression du dernier message

---

### [2024-03-06 / 19] — Commits Git · V0.1 & Corrections

**Modifications :**
- Publication de la version 0.1
- Correctifs sur la date de début de référence lors de la création d'événement
- Correction du rafraîchissement des amis et numéro de téléphone
- Divers correctifs

---

## Nouveau composant créé

### `FriendProfileComponent`
- **Chemin :** `src/app/components/friend-profile/`
- **Fichiers :** `friend-profile.component.ts`, `.html`, `.scss`
- **Usage :** Modal affichant la fiche profil d'un ami (avatar, prénom/nom, tagline, zone géo, statut enfants, statut dyspo, relation)
- **Intégration :** Déclaré et exporté dans `SharedModule`
- **Créé lors de :** Session Antigravity #1 (mars 2026)

---

## Historique technique détaillé

| Date | Type | Description | Fichiers modifiés | Statut |
|---|---|---|---|---|
| 2026-05-07 | Technique | Migration Angular 16 → 20 | `package.json`, `tsconfig.json`, `angular.json`, tous `*.module.ts` | ✅ Terminé |
| 2026-05-07 | Technique | Migration Swiper 8 → 12 (Web Components) | `main.ts`, `monthview.ts`, `weekview.ts`, `dayview.ts`, `calendar.module.ts`, `shared.module.ts`, `global.scss` | ✅ Terminé |
| 2026-05-07 | Bugfix | Erreur `NG8001` ion-content / ion-button sur Angular 20 | Tous `*.module.ts` (NO_ERRORS_SCHEMA) | ✅ Résolu |
| 2026-05-07 | Bugfix | Erreur `TS7016` module 'dom7' sans déclarations | `src/typings.d.ts` (nouveau) | ✅ Résolu |
| 2026-05-07 | Technique | Migration ngx-panzoom v16 → v19 (Signal API) | `dyspo-viewer.component.ts`, `dyspo-viewer.component.html`, `package.json` | ✅ Terminé |
| 2026-05-07 | Technique | Correction tsconfig Angular 20 | `tsconfig.json` | ✅ Terminé |
| 2026-05-07 | Composant | Création `FriendProfileComponent` | `friend-profile/` (3 fichiers), `shared.module.ts` | ✅ Terminé |
| 2026-05-07 | UI/UX | Transitions fluides entre mois dans le calendrier | `calendar.component.ts`, `calendar.component.scss` | ✅ Terminé |
| 2026-05-07 | UI/UX | Chips de filtre cliquables (griser dates non concernées) | `month.component.ts`, `month.component.scss`, `calendar.component.ts`, `agenda.page.ts`, `agenda.page.html`, `agenda.page.scss` | ✅ Terminé |
| 2026-05-07 | UI/UX | Refonte popup image événement (DyspoViewer) | `dyspo-viewer.component.html`, `dyspo-viewer.component.scss`, `global.scss` | ✅ Terminé |
| 2026-05-07 | UI/UX | Bouton "Voir son calendrier" dans popup participant | `agenda-event-info.component.html`, `.ts`, `.scss` | ✅ Terminé |
| 2026-05-07 | UI/UX | Filtre "Dates communes" en mode calendrier ami | `agenda.page.ts`, `agenda.page.html` | ✅ Terminé |
| 2026-05-07 | UI/UX | Long press sur date → création d'événement | `month.component.ts`, `calendar.component.ts`, `agenda.page.ts`, `agenda.page.html` | ✅ Terminé |
| 2026-03-26 | Bugfix | Conflit package.json Capacitor | `package.json` | ✅ Résolu |
| 2024-07-31 | Technique | Upgrade Capacitor 5 → 6, Android SDK 34 → 35, iOS 13 → 14 | `variables.gradle`, `build.gradle`, `Podfile` | ✅ Terminé |
| 2024-06-24 | UI/UX | Nouvelles fonctionnalités (non détaillées) | Multiple | ✅ Terminé |
| 2024-04-12 | UI/UX | Chips légende non-cliquables | `agenda.page.html` | ✅ Terminé (annulé en session #2) |
| 2024-04-11 | UI/UX | Tri par dyspo dans création événement | `create-event.page.ts` | ✅ Terminé |
| 2024-04-11 | UI/UX | Ouverture image depuis fiche événement | `agenda-event-info.*` | ✅ Terminé |
| 2024-04-11 | Bugfix | Pan sur jours fériés | `month.component.ts` | ✅ Résolu |
| 2024-04-04 | Performance | Chargement événements à l'entrée de la vue mois | `agenda.page.ts` | ✅ Terminé |
| 2024-04-03 | UI/UX | Modal plein écran grands écrans | Multiple | ✅ Terminé |
| 2024-04-03 | UI/UX | Confidentialité dans Paramètres | `parametres.page.*` | ✅ Terminé |
| 2024-04-02 | UI/UX | Fonctionnalités chat (suppression msg, pj, événement privé) | `group-chatting.page.*`, `chat.service.ts` | ✅ Terminé |
| 2024-03-06 | Technique | Version 0.1 publiée | Multiple | ✅ Terminé |
| 2024-01-08 | Technique | Événements longs multi-jours, recurrence | `agenda.service.ts`, `calendar.*` | ✅ Terminé |
| 2024-01-10 | Technique | Contacts device (iOS/Android) | `device-contacts.page.*` | ✅ Terminé |
| 2023-12-13 | UI/UX | Chat avec pièces jointes (photos) | `group-chatting.page.*`, `media.service.ts` | ✅ Terminé |
| 2023-12-08 | Technique | Invitation événements, suppression, gestion admin | `agenda.service.ts`, `agenda-event-info.*` | ✅ Terminé |
| 2023-07-11 | Technique | Ajout du calendrier personnalisé Ionic | `src/app/calendar/` (module complet) | ✅ Terminé |
| 2023-05-11 | Technique | Initialisation projet Firebase Auth | Multiple | ✅ Terminé |

---

## Roadmap des prochaines améliorations

- [ ] **iOS pod install** : Exécuter `pod install` dans `ios/prod/App/` et `ios/stg/App/` après migration Capacitor 7 (nécessite macOS)
- [ ] **Tests fonctionnels Swiper 12** : Vérifier le défilement du calendrier sur device physique iOS et Android
- [ ] **Tests long press** : Valider le comportement sur tablette et sur iOS (retour haptique)
- [ ] **Filtre dates communes avancé** : Permettre le filtre par statut (DYSPO seul, DYSPOWITHKIDS seul) sur les dates communes
- [ ] **Animation d'entrée popup image** : Ajouter un effet scale-in sur l'ouverture de `DyspoViewerComponent`
- [ ] **Nettoyage scripts PowerShell** : Supprimer `patch-modules.ps1`, `patch-comma.ps1`, `patch-no-errors-schema.ps1`, `migrate-swiper.ps1` (temporaires, déjà en non-commité)
- [ ] **Commit de toutes les modifications** : Aucune des modifications Antigravity n'a encore été commitée
- [ ] **Vérification Angular Fire v17** : Tester la compatibilité `@angular/fire ^17.1.0` avec Angular 20.3
- [ ] **Build iOS/Android** : Rebuild complet natif avec Capacitor 7 et Angular 20
- [ ] **Refactoring `global.scss`** : Migrer les `@import` CSS restants vers `@use` (dépréciation Dart Sass 3.0)
- [ ] **Profil ami depuis événement** : Envisager de remplacer le popover participant par un vrai modal `FriendProfileComponent`

---

## Notes importantes

- **Aucun commit n'a été créé** lors des sessions Antigravity : toutes les modifications sont en état `unstaged` dans Git. Un commit groupé ou plusieurs commits thématiques sont à réaliser.
- **L'historique antérieur à mars 2026** est reconstitué à partir de `git log` et peut être incomplet sur les détails.
- **Swiper 12 Web Components** : la syntaxe `<swiper-container>` / `<swiper-slide>` est instanciée via `register()` dans `main.ts` ; les modules Angular ne sont plus nécessaires.
- **ngx-panzoom v19** : l'API a changé en profondeur — plus d'objet `PanZoomConfig`, plus de `PanZoomAPI`. Les propriétés sont désormais des Signal Inputs directement sur le composant `<pan-zoom>`.
- **NO_ERRORS_SCHEMA vs CUSTOM_ELEMENTS_SCHEMA** : `NO_ERRORS_SCHEMA` supprime les vérifications sur les éléments ET les propriétés, là où `CUSTOM_ELEMENTS_SCHEMA` ne supprime que les éléments. Utiliser avec précaution (désactive une partie du type-checking Angular dans les templates).
- **Variables SCSS** : le thème utilise un système de design tokens custom (`--d-brand`, `--d-surface-*`, `--d-shadow-*`, etc.) définis dans `src/theme/variables.scss`.
- **Configuration multi-environnement** : le projet gère 2 environnements (prod/stg) avec des configurations séparées Android/iOS et un script `configure.js`.
