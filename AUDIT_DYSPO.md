# AUDIT COMPLET DE L'APPLICATION DYSPO

> Audit réalisé le 2026-05-07 — Version analysée : 1.0.1  
> Stack : Ionic 8.8 + Angular 20 + Capacitor 7 + Firebase  
> Plateformes cibles : iOS, Android, Web

---

## 1. Résumé exécutif

### État général

Dyspo est une application mobile de calendrier social mature, bien architecturée, avec une proposition de valeur claire et différenciante : aider les amis et parents séparés à coordonner leur temps libre. La base de code est solide, les règles de sécurité Firebase bien conçues, et la migration technique vers Angular 20 / Ionic 8 / Capacitor 7 vient d'être réalisée avec succès.

L'application est fonctionnellement complète pour une V1 mais présente plusieurs axes d'amélioration importants avant une publication App Store / Google Play réussie.

### Points forts

- Architecture réactive bien structurée (RxJS BehaviorSubject + Services)
- Modules lazy-loaded sur toutes les pages (bonne performance initiale)
- Règles Firestore bien conçues (ownership checks, restriction par membre d'événement)
- Fonctionnalité co-parentalité (planning de garde sur 14 jours) différenciante
- Système de disponibilité (Dyspo) original et clair
- Chat temps réel avec réactions, images, signalement
- Deux environnements séparés (stg / prod)
- Système de design token CSS commençant à émerger (--d-brand, --d-surface-*)
- Lazy loading d'images (ng-lazyload-image)

### Points faibles

- **Deux librairies de dates coexistent** (date-fns + moment.js) — moment est EOL
- **Fuites mémoire potentielles** : abonnements non résiliés dans plusieurs composants
- **console.log() partout** alors qu'un LoggerService existe
- **Authentification biométrique commentée** (NativeBiometric) — ni active ni supprimée
- **Validation téléphone uniquement française** (regex format +33)
- **Pattern N+1 dans le modal d'événement** : dyspos et événements chargés en boucle
- **Pas de gestion offline explicite** malgré la persistance Firestore activée
- **Accessibilité insuffisante** (pas d'aria-labels, indicateurs couleur seuls)
- **Aucun test automatisé actif** (Karma/Jasmine présent mais pas utilisé)
- **Écran "User Status" (dashboard)** manque de personnalisation et d'ancrage

### Priorités absolues

1. Éliminer les fuites mémoire (unsubscribes manquants)
2. Optimiser le chargement du modal `AgendaEventInfo` (pattern N+1)
3. Supprimer moment.js (bundle −~67 KB gzipped)
4. Remplacer tous les `console.log()` par le LoggerService ou les supprimer
5. Ajouter les `aria-label` minimaux sur les boutons icônes critiques
6. Vérifier le `.gitignore` pour les clés Android signing

---

## 2. Analyse technique

### Stack utilisée

| Couche | Technologie | Version | Statut |
|---|---|---|---|
| Framework UI | Ionic | 8.8.5 | ✅ Récent |
| Framework JS | Angular | 20.3.19 | ✅ LTS |
| Runtime natif | Capacitor | 7.0.0 | ✅ Récent |
| Backend | Firebase (Auth + Firestore + Storage + FCM) | 17.1.0 (@angular/fire) | ⚠️ Voir note |
| Dates | date-fns | 2.30.0 | ✅ |
| Dates (legacy) | moment + moment-timezone | 2.30.1 / 0.5.48 | ❌ EOL – à supprimer |
| UI Components | Ionic Components + SweetAlert2 | 11.26 | ✅ |
| Carousel | Swiper | 12.1.4 | ✅ Récent |
| Zoom image | ngx-panzoom | 19.0.0 | ✅ Récent |
| i18n | ngx-translate | 16.0.4 | ✅ |
| Gestures | HammerJS | 2.0.8 | ⚠️ Pas de mise à jour depuis 2016 |
| Gestion contacts | @capacitor-community/contacts | 7.0.0 | ✅ |
| Photos | @capacitor/camera | 7.0.0 | ✅ |

> **Note @angular/fire 17.1.0 / Angular 20 :** La compatibilité officielle @angular/fire 17.x est certifiée pour Angular 17-18. Vérifier qu'aucune régression n'apparaît avec Angular 20 (`ng build --configuration=production`). La prochaine version majeure @angular/fire devrait supporter Angular 20+.

### Architecture du projet

```
src/app/
  pages/          # 18 écrans — tous lazy-loaded ✅
  components/     # 11 composants réutilisables
  services/       # 9 services (logique métier)
  models/         # 1 fichier models.ts centralisé ✅
  calendar/       # Module calendrier custom
  modules/shared/ # SharedModule (composants partagés)
  pipes/          # 2 pipes (date-chat-format, day-number-format)
```

**Points positifs :**
- Séparation pages / composants / services respectée
- Un seul fichier de modèles centralisé (`models.ts`) — facile à maintenir
- Services injectés via constructeur (pas de provide root sauvage)
- Environnements séparés (stg / prod) avec Firebase projects distincts

**Points négatifs :**
- `SharedModule` est devenu un "fourre-tout" — importe et exporte de nombreux modules non utilisés partout
- `calendar/` (module custom) et `components/calendar/` (ion-calendar wrapper) coexistent — confusion de nommage
- `components/friend-profile/` est un nouveau dossier non encore intégré dans SharedModule (composant orphelin ?)
- Aucune couche "store" ou "state management" formel — l'état est réparti dans les services BehaviorSubject, ce qui fonctionne mais devient difficile à maintenir à grande échelle

### Qualité du code

**Points positifs :**
- TypeScript strict activé (`strictTemplates: true`) — filet de sécurité au compile
- Modèles fortement typés (enums pour tous les statuts)
- Gestion des erreurs Firebase traduite en messages utilisateur (dans `utils.service.ts`)
- Opérations Firestore batchées (max 490 writes/batch, queries chunked à 10)
- Listeners onSnapshot() proprement initialisés dans `initService()`

**Points négatifs :**
- `console.log()` présents dans de nombreux fichiers (`agenda-event-info.component.ts:87`, `agenda-event-info.component.ts:150`, `chat.service.ts`, etc.) alors que `LoggerService` existe
- Variables non utilisées dans certains composants (indicateur de refactoring incomplet)
- Certains `async/await` mélangés avec `.then()/.catch()` dans le même fichier — incohérence
- Abonnements sans `ngOnDestroy` + `unsubscribe()` dans plusieurs pages (voir section Performances)
- Magie de chaînes : les clés Chatroom sont construites dynamiquement (`'user_' + uid`) sans typage

### Organisation des dossiers

**Suggestions de renommage / réorganisation :**

```
src/app/
  calendar/           → à renommer en calendar-module/ ou fusionner dans components/calendar/
  components/
    friend-profile/   → à intégrer dans SharedModule (actuellement orphelin)
```

### Dépendances — risques identifiés

| Dépendance | Risque | Action |
|---|---|---|
| `moment` + `moment-timezone` | EOL, +67 KB gzipped | Migrer vers date-fns |
| `hammerjs` 2.0.8 | Pas de mise à jour depuis 2016 | Vérifier alternatives Ionic |
| `lodash` 4.18.1 | Tree-shaking difficile | Importer uniquement les fonctions utilisées |
| `sweetalert2` | Double système d'alertes avec Ionic AlertController | Unifier vers un seul système |
| `capacitor-email-composer` | Plugin community peu maintenu | Vérifier compatibilité Capacitor 7 |
| `@capacitor-community/media` | Plugin community | Vérifier support iOS 17+ / Android 14+ |

---

## 3. Analyse UX/UI

### Lisibilité

- La typographie utilise deux polices : **Preahvihear** (marque) et **Lato** (corps) — bon choix
- Les tokens CSS (`--d-brand`, `--d-surface-*`) commencent à émerger mais ne sont pas appliqués systématiquement dans tous les composants — certains utilisent encore des valeurs hexadécimales en dur
- Les chips de statut (Dyspo / NoDyspo / AvecEnfants / Congés) manquent de labels texte dans certains contextes — couleur seule insuffisante (accessibilité)

### Navigation

- **Tab bar** (5 onglets) bien positionnée — les icônes sont lisibles
- **Navigation stack** : utilise `NavController.navigateForward/Back` — cohérent
- **Modals** : `ModalController` utilisé pour les détails d'événement — OK mais la fermeture en glissant n'est pas toujours disponible
- **Popovers** : présents pour les menus contextuels — peuvent manquer de surface tactile sur petits écrans
- **Absence de breadcrumb ou titre de page cohérent** dans les pages de second niveau (sous-navigation)
- Le bouton retour n'est pas toujours visible dans les modales présentées en plein écran

### Hiérarchie visuelle

- Le calendrier est l'élément central mais occupe beaucoup d'espace vertical — les événements en dessous sont souvent hors du viewport
- Les chips de filtre du calendrier (DYSPO, NODYSPO, etc.) n'ont pas de label explicite au premier regard — un nouvel utilisateur ne comprend pas immédiatement leur rôle
- L'écran "User Status" manque de hiérarchie : toutes les sections semblent au même niveau d'importance

### Cohérence graphique

- Le thème de couleur est bien défini (`#46a2c2` cyan-bleu) mais appliqué de manière incohérente
- SweetAlert2 génère des popups visuellement différentes des modals Ionic (deux systèmes de design)
- Certains boutons utilisent `ion-button`, d'autres des `div` cliquables, d'autres `ion-item` — manque d'uniformité
- Les avatars par défaut (`assets/img/user.jpg`) ne correspondent pas au style global

### Fluidité

- Les animations de transition entre mois ont été améliorées (session Antigravity) ✅
- Le viewer photo avec pan/zoom est fluide ✅
- Les transitions entre pages utilisent l'animation Ionic par défaut (slide) — cohérent
- Le chargement des membres dans `AgendaEventInfo` peut prendre du temps (requêtes en boucle) — l'UI ne signale pas cet état de chargement de manière élégante

### Parcours utilisateurs

**Création de compte :**
- Formulaire long (prénom, nom, email, téléphone, genre, zone géo, enfants, calendrier de garde) — trop dense pour une première impression
- L'utilisateur doit configurer le planning de garde (14 cases à cocher) dès l'inscription — friction élevée
- Pas de possibilité de sauter et configurer plus tard
- Pas de progression (étape 1/4, etc.)

**Connexion :**
- Simple et fonctionnel
- Biométrique désactivé malgré l'infrastructure présente — opportunité manquée

**Ajout d'un événement :**
- Formulaire bien structuré
- Google Places Autocomplete pour le lieu — dépend d'internet
- La sélection des participants (FriendSelector) est riche mais peut être déroutante

**Partage de disponibilité :**
- Dyspo status (DYSPO/NODYSPO/DYSPOWITHKIDS) est une fonctionnalité centrale mais peu expliquée
- Pas d'onboarding explicatif sur cette notion clé

**Invitation d'un contact :**
- Fonctionne via les contacts du téléphone → matching par numéro → invitation
- Si le contact n'est pas sur Dyspo : pas de mécanisme d'invitation par SMS/email visible dans l'UI

**Utilisation du calendrier :**
- Le calendrier custom est riche : événements, dyspos, jours fériés, planning de garde
- La densité d'information peut dépasser les capacités d'un calendrier mensuel sur petit écran
- La vue semaine (`calendar-week.component.ts`) existe mais son accès n'est pas évident

**Chat / messagerie :**
- Chat de groupe rattaché à un événement — bien pensé
- Réactions, images, signalement — fonctionnalités complètes
- La liste des groupes (`group-list`) n'affiche pas clairement le nom de l'événement parent

**Gestion du profil :**
- Accessible depuis les paramètres — pas directement depuis le menu principal
- L'avatar est modifiable mais l'UX de modification (camera/galerie) n'est pas toujours claire

**Notifications :**
- Push notifications via FCM — bien intégré
- La page `notifications-list` existe mais son accès depuis les autres écrans n'est pas mis en avant
- Pas de gestion du "tout marquer comme lu"

### Problèmes détectés

| Problème | Fichier concerné | Priorité |
|---|---|---|
| Double système d'alertes (SweetAlert2 + Ionic) | Multiple | Haute |
| Inscription trop longue sans étapes progressives | register.page.ts | Haute |
| Biométrique commenté (expérience dégradée) | login.page.ts | Haute |
| Chips de filtre sans label texte explicatif | agenda.page.html | Moyenne |
| Pas d'invitation SMS pour les non-membres | friends.page.ts | Moyenne |
| Avatar par défaut visuellement incohérent | assets/img/user.jpg | Basse |
| Pas de "swipe to dismiss" sur toutes les modales | Multiple | Moyenne |

---

## 4. Analyse produit

### Clarté de la proposition de valeur

Dyspo résout un problème réel et sous-servi : **coordonner les disponibilités de personnes qui ont des agendas différents** (amis, parents séparés, groupes). La proposition de valeur est claire pour quelqu'un qui a déjà souffert de ce problème, mais **elle n'est pas explicitement vendue** dans l'application elle-même (pas d'onboarding, pas de copywriting fort sur l'écran de connexion).

### Fonctionnalités principales

- ✅ Calendrier personnel avec statuts de disponibilité (Dyspo)
- ✅ Planning de garde co-parentale (14 jours)
- ✅ Événements partagés avec membres confirmés/invités
- ✅ Calendrier des amis avec dates communes
- ✅ Chat de groupe lié aux événements
- ✅ Jours fériés par zone géographique (A/B/C)
- ✅ Filtrage des disponibilités
- ✅ Gestion des groupes d'amis

### Fonctionnalités manquantes (vs concurrents)

| Fonctionnalité | Impact | Notes |
|---|---|---|
| Invitation par SMS pour les non-inscrits | Élevé | Freemium growth lever |
| Rappels/notifications d'événements personnalisables | Élevé | Actuellement uniquement FCM |
| "Peut-être" comme statut RSVP (en plus de oui/non) | Moyen | Pattern standard |
| Édition récurrente ("cet événement et suivants") | Moyen | Récurrence partielle actuellement |
| Synchronisation bidirectionnelle avec l'agenda natif | Élevé | Export iCal uniquement sens sortant |
| Vue agenda (liste) vs vue calendrier | Moyen | Vue semaine présente mais peu accessible |
| Widget iOS/Android | Moyen | Exposition quotidienne |
| Sondage de date (type Doodle) | Moyen | Feature attendue dans cette catégorie |
| Réponse conditionnelle ("je viens si X vient") | Basse | Différenciante |
| Partage de lien événement (deep link) | Élevé | Pour inviter hors app |

### Points de friction

1. **Onboarding absent** — l'utilisateur arrive dans l'app sans comprendre le concept de "dyspo"
2. **Inscription en une seule page** — trop d'informations demandées d'un coup
3. **Découverte des amis limitée** — uniquement par contacts téléphoniques, pas par nom/pseudo
4. **Le concept de "zone géo" (A/B/C)** demande une connaissance du système scolaire français — non expliqué
5. **Le planning de garde** n'est pas lié à un calendrier réel — saisie manuelle obligatoire chaque semaine

### Comparaison avec les meilleures applications du marché

| Critère | Dyspo | Doodle | Google Calendar | TimeTree |
|---|---|---|---|---|
| Coordination de groupe | ✅ Fort | ✅ Fort | ⚠️ Basique | ✅ Fort |
| Disponibilités visuelles | ✅ Original | ✅ | ❌ | ⚠️ |
| Chat lié aux événements | ✅ | ❌ | ❌ | ✅ |
| Co-parentalité | ✅ Unique | ❌ | ❌ | ⚠️ |
| Invitation non-membres | ❌ | ✅ | ✅ | ✅ |
| Sync calendrier natif | ❌ Export seulement | ❌ | ✅ | ✅ |
| Widget | ❌ | ❌ | ✅ | ✅ |
| Onboarding | ❌ | ✅ | ✅ | ✅ |

---

## 5. Analyse performance

### Temps de chargement

- **Modules lazy-loaded** sur toutes les routes → bon FCP (First Contentful Paint)
- **Listeners Firestore onSnapshot()** démarrés au login → données disponibles rapidement
- **`getUserInfos(uids[])`** chunke les requêtes à 10 (limite Firestore `in`) → correct mais peut générer plusieurs requêtes réseau

### Problème N+1 dans `AgendaEventInfo`

Le modal de détail d'événement (`agenda-event-info.component.ts`) effectue, pour **chaque membre** de l'événement :
1. `agendaSvc.getDyspos([member.uid], agendaEvent)` → 1 requête Firestore par membre
2. `agendaSvc.getUserAgendaEvents(member.uid, agendaEvent)` → 1 requête Firestore par membre

Pour un événement avec 10 membres → **20 requêtes Firestore séquentielles** (dans une boucle `for...of` avec `await`). Cela peut représenter 2-5 secondes de chargement.

**Fix recommandé :** Paralléliser avec `Promise.all()` et/ou précharger les données dans `AgendaService`.

### Fuites mémoire potentielles

Les pages suivantes s'abonnent à des observables mais n'implémentent pas systématiquement `ngOnDestroy` + `unsubscribe()` :
- `tabs.page.ts` — watches `agendaEvents$`
- `user-status.page.ts` — subscriptions multiples
- `friends.page.ts` — listener de contacts

**Pattern recommandé :**
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  service.data$.pipe(takeUntil(this.destroy$)).subscribe(...)
}

ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
```

### Animations

- Transitions mois : améliorées (Antigravity session) ✅
- Viewer photo pan/zoom : fluide ✅
- Animations de liste : `animate.css` importé globalement (+14 KB) — à importer à la demande

### Optimisation des composants

- `ChangeDetectionStrategy.OnPush` **non utilisé** sur la grande majorité des composants — Angular re-render inutilement sur chaque cycle
- La page `agenda.page.ts` est complexe (logique de filtrage, tagCommonDates, onCreateMonthEvent) — candidat à refactoring avec OnPush

### Images / assets

- Photos capturées en base64 qualité 50 (paramètre Camera) — bon compromis
- **Pas de validation de taille avant upload** Firebase Storage — risque de timeout sur connexions lentes
- `assets/logo.svg` + `assets/img/user.jpg` — l'avatar par défaut en JPG devrait être en WebP ou SVG
- Les avatars Firebase Storage sont servis en URL directe sans CDN resize — les grandes images sont chargées en pleine résolution

### Recommandations performance

1. **Paralléliser les requêtes** dans `AgendaEventInfo.ngOnInit()` avec `Promise.all()`
2. **Ajouter `ChangeDetectionStrategy.OnPush`** sur les composants purs (EventMini, MonthComponent, FriendsSelector)
3. **Supprimer moment.js** (−67 KB gzipped)
4. **Utiliser `trackBy`** sur tous les `*ngFor` de listes d'événements et de membres
5. **Limiter `animate.css`** à un import conditionnel ou extraire les 2-3 classes réellement utilisées
6. **Ajouter validation de taille d'image** avant upload (ex : max 5 MB)

---

## 6. Analyse sécurité

### Authentification

- Firebase Email/Password — sécurisé par défaut
- Persistance IndexedDB sur mobile (correct pour native)
- **Pas de 2FA** — acceptable pour V1 mais à envisager
- **Biométrique commenté** — si réactivé, utiliser `@capawesome-team/capacitor-biometrics` (plugin maintenu) plutôt que NativeBiometric
- Pas de protection contre les tentatives de connexion répétées côté app (le rate limiting est géré par Firebase Auth)

### Règles Firestore

Les règles (`firestore.rules`) sont **bien conçues** :
- Accès aux données d'un événement réservé aux `members_uid` + `members_invited_uid` ✅
- Écriture des dyspos limitée au propriétaire (`uid == request.auth.uid`) ✅
- Rapports, mails, logs : write-only pour les utilisateurs ✅
- Tout le reste : DENY par défaut ✅

**Point de vigilance :**
- La règle sur `/users/{uid}` permet à **tout utilisateur authentifié de lire tout profil** utilisateur (y compris email, téléphone, token FCM). C'est nécessaire pour la recherche d'amis mais expose les données personnelles entre utilisateurs non amis.
- Le champ `notificationToken` (FCM) est lisible par tous les utilisateurs authentifiés → un acteur malveillant pourrait collecter des tokens FCM. **Recommandation :** exclure `notificationToken` de la règle de lecture publique.

### Gestion des données utilisateurs

- Numéros de téléphone stockés en clair dans Firestore — acceptable dans le modèle Firebase (chiffrement au repos) mais à documenter dans la politique de confidentialité
- Les utilisateurs DELETED ne sont pas purgés (données conservées, statut changé) — conforme RGPD seulement si l'utilisateur a été informé de cette politique
- Le `custody_schedule` (tableau de 14 booléens) est une donnée sensible (vie privée familiale) — correctement protégé par les règles (owner only)

### Stockage local

- `@capacitor/preferences` utilisé pour la persistance légère — sécurisé sur mobile (iOS Keychain wrapper, Android SharedPreferences chiffré)
- Pas de données sensibles dans localStorage côté web

### Permissions

- Contacts : demandés à la première utilisation — correct
- Camera : demandée à l'usage — correct
- Notifications : demandées au login — à déplacer après l'onboarding pour réduire la friction
- Localisation : non requise (Google Places gère séparément via autocomplete)

### Points de vigilance

| Point | Risque | Recommandation |
|---|---|---|
| `notificationToken` lisible par tous les auth. | Moyen | Exclure de la règle de lecture `/users/{uid}` |
| Pas de purge RGPD des données DELETED | Moyen | Implémenter Cloud Function de purge |
| Validation des données événement côté client seulement | Faible | Ajouter Cloud Function de validation |
| Clés Android de signing à la racine du repo | Élevé | Vérifier `.gitignore`, déplacer hors du repo |
| `environment.ts` contient les clés Firebase | Info | Normal pour Firebase (clés publiques par design) |

---

## 7. Analyse accessibilité

### Taille des textes

- Les tailles de texte semblent respecter les minimums iOS/Android (16px équivalent pour le corps)
- Pas de test avec `accessibilityFontScale` (Dynamic Type iOS / Font Scale Android) — à vérifier

### Contrastes

- La couleur primaire `#46a2c2` sur fond blanc donne un ratio de contraste d'environ **3.0:1** — **insuffisant** pour WCAG AA (minimum 4.5:1 pour le texte normal)
- Les indicateurs de statut Dyspo (couleur seule : vert/rouge/bleu/gris) ne sont pas accessibles aux personnes daltonniennes — **ajouter une icône ou un label**

### Navigation tactile

- Les zones cliquables des chips de filtre et des avatars peuvent être trop petites (<44x44px recommandé par Apple HIG)
- Les popovers se ferment sur un tap extérieur — comportement correct mais non documenté pour les utilisateurs de lecteur d'écran

### États d'erreur

- Les erreurs de formulaire sont signalées via `utils.showToastError()` — OK mais les toasts disparaissent rapidement
- Pas d'état d'erreur visuel inline sur les champs de formulaire — l'utilisateur doit lire la toast pour savoir quel champ est en cause

### Feedback utilisateur

- Retour haptique sur le long press (Haptics.impact) ✅
- Loader pendant les opérations longues (`utils.showLoader()`) ✅
- Pas de skeleton loading — les listes vides s'affichent sans animation pendant le chargement
- Pas d'état "empty state" graphique (illustration + message d'encouragement) sur les listes vides

---

## 8. Analyse écran par écran

---

### Écran 1 : Login (`login.page.ts`)

**Objectif :** Connecter un utilisateur existant.

**Ce qui fonctionne bien :**
- Formulaire simple (email + mot de passe)
- Gestion des erreurs Firebase traduite en français
- Lien vers la réinitialisation de mot de passe

**Problèmes détectés :**
- Biométrique commenté — expérience dégradée vs les apps concurrentes
- Pas de lien vers les CGU / charte vie privée accessible depuis la page de login
- Fond / illustration manquant — l'écran est fonctionnel mais pas engageant visuellement

**Recommandations :**
- Réactiver l'authentification biométrique
- Ajouter une illustration/branding fort sur la page de login
- Positionner un tagline clair ("Coordonnez votre temps libre avec vos proches")

**Priorité : Haute**

---

### Écran 2 : Inscription (`register.page.ts`)

**Objectif :** Créer un compte et configurer le profil initial.

**Ce qui fonctionne bien :**
- Masque de saisie téléphone (Maskito) — bonne DX
- Application automatique du planning de garde après inscription

**Problèmes détectés :**
- **Trop long en une seule page** : 8+ champs + 14 cases à cocher pour la garde
- La **zone géographique A/B/C** n'est pas expliquée — terme incompris hors France
- La **validation téléphone** n'accepte que le format français (+33/0X XX...)
- Pas de possibilité de passer le planning de garde et de le configurer plus tard
- Les URLs CGU (`dyspo.app/cgu.html`) s'ouvrent en navigateur externe — friction

**Recommandations :**
- Découper en 3 étapes : Compte → Profil → Famille (optionnel)
- Ajouter un tooltip/info sur "Zone géographique" avec une carte des zones scolaires
- Rendre le planning de garde optionnel à l'inscription
- Ajouter validation téléphone internationale (ou clarifier "France uniquement")

**Priorité : Haute**

---

### Écran 3 : User Status — Dashboard (`user-status.page.ts`)

**Objectif :** Vue d'ensemble quotidienne de l'utilisateur.

**Ce qui fonctionne bien :**
- Affiche le statut dyspo du jour
- Montre les prochains événements
- Suggestions d'amis

**Problèmes détectés :**
- **Hiérarchie visuelle plate** — toutes les sections semblent au même niveau
- Les phrases CTA animées ("Invitez vos amis...") sont décoratives mais pas actionnables
- Pas de shortcut rapide vers les actions fréquentes (ajouter un événement, mettre à jour le statut)
- L'écran ressemble à un "écran de remplissage" plus qu'à un vrai dashboard

**Recommandations :**
- Redesigner avec une section hero claire : "Votre statut aujourd'hui" + bouton de mise à jour
- Ajouter 2-3 quick actions : "Créer un événement", "Voir mon calendrier", "Inviter un ami"
- Supprimer ou rendre actionnables les phrases animées

**Priorité : Haute** (c'est la première impression après connexion)

---

### Écran 4 : Agenda / Calendrier (`agenda.page.ts`)

**Objectif :** Vue calendrier personnelle avec événements, dyspos et planning de garde.

**Ce qui fonctionne bien :**
- Calendrier mensuel avec color-coding des dyspos
- Filtre par statut (chips) ✅ (amélioré Antigravity)
- Mode "ami" pour voir le calendrier d'un ami
- Long press pour créer un événement ✅ (amélioré Antigravity)
- Transitions fluides entre mois ✅ (amélioré Antigravity)

**Problèmes détectés :**
- **Densité d'information excessive** : dyspos + événements + jours fériés + planning de garde sur un seul calendrier mensuel
- Les **chips de filtre** n'ont pas de label texte au premier abord — icônes-couleur seules non accessibles
- Aucun **état vide engageant** quand aucun événement
- La vue semaine (`calendar-week.component.ts`) semble peu accessible depuis l'UI principale
- En mode ami, il n'est pas clair graphiquement qu'on consulte un calendrier externe

**Recommandations :**
- Ajouter un label court sous les chips de filtre (ou en tooltip au premier accès)
- Rendre la vue semaine accessible par swipe horizontal
- Ajouter un "indicateur de mode ami" visible (bandeau ou titre)
- Implémenter des skeleton loaders pendant le chargement des événements

**Priorité : Haute**

---

### Écran 5 : Création d'événement (`create-event.page.ts`)

**Objectif :** Créer ou modifier un événement avec participants et récurrence.

**Ce qui fonctionne bien :**
- Formulaire structuré (titre, dates, lieu, type, participants, récurrence)
- Google Places Autocomplete pour le lieu
- Sélection de participants avec affichage des dyspos

**Problèmes détectés :**
- **Dépendance Google Places** = si offline ou quota dépassé, la saisie du lieu échoue sans fallback
- L'édition récurrente ("modifier cet événement uniquement" vs "modifier tous les suivants") **n'est pas gérée** — toute modification touche seulement l'instance, ce qui peut induire en erreur
- Le type d'événement (KIDS/NOKIDS/FREE/SOLO) n'est pas suffisamment expliqué pour un nouvel utilisateur
- Pas de prévisualisation de l'événement avant confirmation

**Recommandations :**
- Ajouter un champ de saisie libre pour le lieu avec Google Places en suggéré (non obligatoire)
- Implémenter le dialogue "modifier cet événement / tous les suivants" pour la récurrence
- Ajouter des infobulles sur les types d'événement KIDS/NOKIDS/FREE
- Ajouter un résumé avant la création ("Créer l'événement ?")

**Priorité : Moyenne**

---

### Écran 6 : Détail d'événement (`agenda-event-info.component.ts`)

**Objectif :** Voir et gérer les détails d'un événement (membres, statuts, actions).

**Ce qui fonctionne bien :**
- Affichage des membres confirmés et invités
- Dyspo de chaque membre visible
- Lien vers le chat de groupe
- "Voir son calendrier" dans le popover membre ✅ (amélioré Antigravity)
- Photo de l'événement avec viewer zoom ✅

**Problèmes détectés :**
- **Pattern N+1** : chargement séquentiel des dyspos et événements de chaque membre (voir section Performance)
- Pas de **skeleton loader** pendant le chargement — `members_loaded = false` affiche un état vide sans animation
- Le **popover de menu** (3 points) ne respecte pas systématiquement `pointer-events` sur mobile
- La fonctionnalité de **changement d'admin** (modale dans modale) est complexe à utiliser

**Recommandations :**
- Paralléliser les requêtes membres avec `Promise.all()`
- Ajouter un skeleton loader pour les avatars et statuts membres
- Simplifier le changement d'admin avec une liste déroulante directe

**Priorité : Haute** (impact direct sur la perception de performance)

---

### Écran 7 : Amis (`friends.page.ts`)

**Objectif :** Gérer la liste d'amis, les groupes, les suggestions.

**Ce qui fonctionne bien :**
- Trois onglets (Amis / Groupes / Suggestions) bien structurés
- Scroll alphabétique fonctionnel (`alphabet-scroll.component.ts`)
- Intégration contacts téléphoniques
- Profil ami en modal (`friend-profile.component`)

**Problèmes détectés :**
- **Pas d'invitation SMS** pour les contacts non inscrits — bloquant pour la croissance
- La synchronisation des contacts (`initContacts()`) peut prendre plusieurs secondes sans feedback
- Les **suggestions** basées uniquement sur les contacts communs — pas d'autres mécanismes de découverte
- Pas de barre de recherche par nom dans la liste d'amis

**Recommandations :**
- Ajouter l'invitation par SMS (lien deep link vers l'App Store + message pré-rédigé)
- Ajouter un loader pendant la synchronisation des contacts
- Ajouter une barre de recherche dans la liste d'amis

**Priorité : Haute** (la viralité de l'app dépend de cette feature)

---

### Écran 8 : Chat de groupe (`group-chatting.page.ts`)

**Objectif :** Messagerie en temps réel liée à un événement.

**Ce qui fonctionne bien :**
- Messages temps réel via Firestore onSnapshot
- Réactions emoji, images, signalement
- Pagination infinie (scroll pour charger les anciens messages)
- Export Google Calendar / iCal depuis le chat ✅

**Problèmes détectés :**
- Le sélecteur d'emoji (14 catégories) est très complet mais peut être difficile à naviguer sur mobile
- **Pas d'accusé de lecture** ("lu par X personnes") — feature attendue dans un chat moderne
- Les **messages supprimés** affichent "Message supprimé" — OK mais l'UI pourrait être plus subtile
- La liste des groupes (`group-list.page.ts`) n'affiche pas clairement l'événement parent du chat

**Recommandations :**
- Ajouter des indicateurs "lu par" (compteur) sous les messages
- Raccourcir le sélecteur emoji à 8 catégories max ou implémenter une recherche
- Dans `group-list`, afficher la date et le lieu de l'événement parent

**Priorité : Moyenne**

---

### Écran 9 : Paramètres (`parametres.page.ts`)

**Objectif :** Gérer les préférences et le compte.

**Ce qui fonctionne bien :**
- Toggles de notifications bien organisés
- Planning de garde éditable
- Lien vers réinitialisation de mot de passe
- Suppression de compte accessible (important pour les stores)

**Problèmes détectés :**
- **Trop dense** — paramètres de notification, planning de garde, statut dyspo, compte : tout dans une page
- Le planning de garde dans les paramètres **duplique** ce qui est dans le profil/inscription — risque de désynchronisation
- Aucun accès aux **CGU / politique de confidentialité** depuis les paramètres (obligatoire App Store)
- Le lien vers `contact@adjaotraxx.fr` (capacitor-email-composer) révèle un nom interne — à remplacer par une adresse de support Dyspo

**Recommandations :**
- Organiser en sous-sections avec en-têtes : Notifications / Agenda / Compte / Aide & Légal
- Ajouter lien CGU et politique de confidentialité
- Remplacer l'email de contact interne par `support@dyspo.app` ou équivalent

**Priorité : Haute** (exigences App Store / Google Play)

---

### Écran 10 : Profil (`profile.page.ts`)

**Objectif :** Éditer les informations personnelles.

**Ce qui fonctionne bien :**
- Modification avatar, prénom, nom, téléphone, genre
- Upload photo Firebase Storage

**Problèmes détectés :**
- **Pas de prévisualisation** avant l'upload de l'avatar
- La modification d'email via Firebase `updateEmail()` peut échouer silencieusement si l'utilisateur ne s'est pas reconnecté récemment (Firebase exige une re-authentification)
- Le champ "tagline" est présent dans le modèle mais son utilité n'est pas claire dans l'UI

**Recommandations :**
- Ajouter la gestion explicite de la re-authentification avant `updateEmail()`
- Ajouter une prévisualisation avatar avant confirmation
- Clarifier ou supprimer le champ "tagline"

**Priorité : Moyenne**

---

### Écran 11 : Notifications (`notifications-list.page.ts`)

**Objectif :** Historique des notifications reçues.

**Ce qui fonctionne bien :**
- Données centralisées en Firestore

**Problèmes détectés :**
- **Accès peu visible** depuis l'interface principale — pas de badge sur l'onglet dédié
- Pas de "tout marquer comme lu" global
- Pas d'action directe depuis une notification (ex : accepter une invitation sans quitter la liste)

**Recommandations :**
- Ajouter un badge de notification sur l'onglet/icône de notifications
- Implémenter "tout marquer comme lu"
- Ajouter des actions inline sur les notifications d'invitation

**Priorité : Moyenne**

---

## 9. Liste des recommandations prioritaires

| Priorité | Catégorie | Problème | Recommandation précise | Impact attendu | Complexité |
|---|---|---|---|---|---|
| Haute | Performance | N+1 queries dans `agenda-event-info.component.ts` (boucle for...of avec await) | Remplacer la boucle par `Promise.all()` pour paralléliser les requêtes de dyspos et d'événements par membre | Performance, rétention | Faible |
| Haute | Technique | Fuites mémoire — abonnements sans `ngOnDestroy` dans `tabs.page.ts`, `user-status.page.ts`, `friends.page.ts` | Implémenter le pattern `takeUntil(destroy$)` dans tous les composants abonnés | Stabilité, mémoire | Faible |
| Haute | Technique | `moment.js` + `moment-timezone` présents malgré `date-fns` déjà utilisé | Migrer les usages restants vers date-fns et supprimer moment | Performance (−67 KB) | Moyenne |
| Haute | Technique | `console.log()` dans le code de production | Remplacer par `loggerSvc.log()` ou supprimer | Stabilité, sécurité logs | Faible |
| Haute | Produit | Pas d'invitation SMS pour les non-inscrits | Implémenter `@capacitor/share` avec lien deep link App Store + message pré-rédigé | Croissance, viralité | Moyenne |
| Haute | UX | Inscription trop longue (8+ champs + planning de garde) | Découper en 3 étapes progressives (Compte / Profil / Famille optionnel) | Conversion, rétention | Moyenne |
| Haute | UX | Écran User Status (dashboard) plat et peu actionnable | Redesigner avec hero status du jour + 3 quick actions | Engagement, rétention | Moyenne |
| Haute | Sécurité | `notificationToken` lisible par tous les utilisateurs authentifiés | Exclure `notificationToken` de la règle de lecture `/users/{uid}` dans `firestore.rules` | Sécurité | Faible |
| Haute | App Store | Pas de lien CGU / vie privée dans les paramètres | Ajouter liens dans `parametres.page.html` | Conformité stores | Faible |
| Haute | App Store | Email de contact interne (`adjaotraxx.fr`) visible dans l'app | Remplacer par une adresse de support Dyspo officielle | Image de marque | Faible |
| Haute | UX | Login sans biométrique (code commenté) | Réactiver avec `@capawesome-team/capacitor-biometrics` | UX, sécurité | Moyenne |
| Moyenne | Performance | `ChangeDetectionStrategy.OnPush` absent sur les composants purs | Ajouter `OnPush` sur `AgendaEventMini`, `MonthComponent`, `FriendsSelector` | Performance rendu | Faible |
| Moyenne | Accessibilité | Contrastes insuffisants (couleur primaire ~3:1 sur blanc) | Ajuster `--ion-color-primary` vers ~#3a8aaa pour atteindre 4.5:1 | Accessibilité, stores | Faible |
| Moyenne | Accessibilité | Indicateurs de statut Dyspo couleur seule | Ajouter une icône ou un label court en complément de la couleur | Accessibilité | Faible |
| Moyenne | UX | Pas de skeleton loaders sur les listes pendant le chargement | Implémenter `ion-skeleton-text` dans les composants de listes d'événements et de membres | UX, perception performance | Moyenne |
| Moyenne | UX | Double système d'alertes (SweetAlert2 + Ionic AlertController) | Unifier vers un seul système (préférer Ionic pour la cohérence native) | Cohérence | Moyenne |
| Moyenne | Produit | Modification récurrence ("cet événement" vs "tous les suivants") non gérée | Implémenter le dialog de choix lors de l'édition d'un événement récurrent | UX, attentes utilisateur | Élevée |
| Moyenne | Produit | Pas de synchronisation entrante avec le calendrier natif | Permettre l'import depuis Google Calendar / Apple Calendar | Engagement | Élevée |
| Moyenne | Sécurité | Pas de purge RGPD des données des comptes DELETED | Implémenter une Cloud Function qui purge les données 30j après la suppression | Conformité RGPD | Moyenne |
| Moyenne | Technique | `components/friend-profile/` non intégré dans `SharedModule` | Déclarer et exporter `FriendProfileComponent` dans `SharedModule` | Stabilité compilation | Faible |
| Basse | Optimisation | `animate.css` importé globalement | Extraire les 2-3 classes utilisées dans `global.scss` directement | Performance (−14 KB) | Faible |
| Basse | Produit | Pas de vue agenda (liste chronologique) | Ajouter un toggle vue calendrier / vue liste | UX | Moyenne |
| Basse | Produit | Pas de widget iOS/Android | Implémenter un widget "statut du jour" | Engagement quotidien | Élevée |
| Basse | Technique | Aucun test automatisé actif | Implémenter des tests unitaires sur les services critiques (AgendaService, FriendsService) | Stabilité | Élevée |
| Basse | Optimisation | Avatars Firebase Storage servis sans resize | Utiliser Firebase Extensions Image Resize ou imgix | Performance réseau | Moyenne |

---

## 10. Plan d'action recommandé

### À faire immédiatement (avant soumission aux stores)

- [ ] **Paralléliser les requêtes** dans `agenda-event-info.component.ts` avec `Promise.all()` — gain de 1-3s perçu
- [ ] **Ajouter liens CGU et politique de confidentialité** dans `parametres.page.html` — exigence Apple / Google
- [ ] **Remplacer l'email `adjaotraxx.fr`** par une adresse support officielle Dyspo
- [ ] **Exclure `notificationToken`** de la règle de lecture publique dans `firestore.rules`
- [ ] **Vérifier `.gitignore`** pour les clés de signing Android (`dyspo_prod_android_key`)
- [ ] **Supprimer tous les `console.log()`** ou les remplacer par `loggerSvc`
- [ ] **Implémenter `ngOnDestroy` + `takeUntil`** dans `tabs.page.ts`, `user-status.page.ts`, `friends.page.ts`
- [ ] **Intégrer `FriendProfileComponent`** dans `SharedModule` (actuellement orphelin)

### À faire ensuite (avant campagne de lancement)

- [ ] **Supprimer `moment.js` et `moment-timezone`** — migrer vers date-fns
- [ ] **Découper l'inscription en 3 étapes** progressives avec possibilité de passer l'étape famille
- [ ] **Redesigner l'écran User Status** avec hero + quick actions
- [ ] **Ajouter invitation par SMS** avec `@capacitor/share` et deep link
- [ ] **Réactiver la biométrie** avec `@capawesome-team/capacitor-biometrics`
- [ ] **Ajouter `ChangeDetectionStrategy.OnPush`** sur les composants purs
- [ ] **Implémenter skeleton loaders** dans les listes de membres et d'événements
- [ ] **Unifier les alertes** vers Ionic AlertController (supprimer ou limiter SweetAlert2)
- [ ] **Ajouter `trackBy`** sur les `*ngFor` des listes principales
- [ ] **Corriger le contraste** de la couleur primaire pour WCAG AA
- [ ] **Ajouter labels texte** sur les chips de filtre du calendrier

### À faire plus tard (roadmap V2)

- [ ] **Import depuis calendrier natif** (Google Calendar / Apple Calendar → Dyspo)
- [ ] **Gestion édition récurrence** ("cet événement" vs "tous les suivants")
- [ ] **Accusés de lecture** dans le chat de groupe ("lu par X")
- [ ] **Widget iOS/Android** affichant le statut Dyspo du jour
- [ ] **Vue agenda (liste chronologique)** en alternative à la vue calendrier
- [ ] **Sondage de disponibilité** type Doodle intégré
- [ ] **Deep links universels** pour inviter hors app vers un événement
- [ ] **Cloud Function de purge RGPD** pour les comptes supprimés
- [ ] **Redimensionnement automatique des avatars** via Firebase Extensions
- [ ] **Tests unitaires** sur `AgendaService` et `FriendsService`
- [ ] **Onboarding interactif** expliquant le concept de Dyspo (2-3 slides à la première connexion)

---

## 11. Conclusion

### Synthèse claire

Dyspo est une application **fonctionnellement solide et architecturalement correcte**, avec une proposition de valeur réelle et différenciante, particulièrement sur le segment co-parentalité. La récente migration Angular 20 / Ionic 8 / Capacitor 7 place l'app sur des fondations techniques modernes.

Les problèmes identifiés sont **majoritairement de niveau "polish"** — ils ne remettent pas en cause l'architecture mais conditionnent fortement l'expérience utilisateur réelle et l'évaluation par les stores. L'application souffre principalement d'un **manque d'onboarding**, d'une **performance perçue dégradée** sur l'écran de détail d'événement, et de plusieurs **non-conformités aux exigences Apple / Google** (CGU, email de contact, conformité accessibilité).

### Risques si rien n'est corrigé

- **Rejet App Store / Google Play** : absence de lien CGU/vie privée dans les paramètres, email de contact interne exposé
- **Mauvaises reviews** : le chargement lent du modal d'événement (N+1 queries) sera perçu comme une lenteur app
- **Taux d'abandon à l'inscription élevé** : formulaire trop long, pas de progression
- **Croissance organique limitée** : pas d'invitation SMS = croissance limitée aux contacts déjà sur l'app
- **Fuites mémoire** sur sessions longues → crashes iOS / Android après navigation répétée
- **Risque réglementaire RGPD** : comptes supprimés non purgés

### Potentiel de l'application après amélioration

Avec les corrections prioritaires et les améliorations de la roadmap V2, Dyspo dispose d'un potentiel significatif :

- **Segment co-parentalité** : très peu d'applications adressent ce marché avec autant de précision (planning de garde, filtrage DYSPOWITHKIDS) — différenciation forte pour les investisseurs
- **Rétention naturelle** : le calendrier partagé et le chat lié aux événements créent une boucle d'engagement quotidienne
- **Viralité** : l'ajout de l'invitation SMS peut transformer chaque événement créé en vecteur d'acquisition

L'application a la structure pour devenir un outil de référence dans la coordination sociale familiale en France, et potentiellement en Europe francophone.

---

*Audit réalisé avec Claude Code (Anthropic) — Antigravity session 2026-05-07*  
*Fichiers analysés : 50+ (services, pages, composants, règles, configuration, modèles)*
