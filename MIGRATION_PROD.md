# Migration `dyspo-test` → `dyspo-2bb43` (production)

**Principe : il n'y a pas de données à migrer.** Le projet prod `dyspo-2bb43` est neuf et n'a jamais servi en usage réel. L'objectif est uniquement de **mettre `dyspo-2bb43` dans un état fonctionnellement identique à `dyspo-test`** (règles, index, services activés, fichiers de config natifs) avant de basculer les builds dessus.

| | Test (actuel) | Production (cible) |
|---|---|---|
| Project ID Firebase | `dyspo-test` | `dyspo-2bb43` |
| Alias `.firebaserc` | `stg` | `prod` (et `default`) |
| Package Android | `com.rovincent.dyspo.staging` | `com.liaisongraphique.dyspo` |
| Bundle iOS | `com.rovincent.dyspo.staging` | `com.liaisongraphique.dyspo` |
| Build | `npm run *-stg` | `npm run *-prod` |

---

## Pré-requis (accès nécessaires avant de commencer)

- [ ] Accès Console Firebase du projet **`dyspo-2bb43`** (rôle Owner/Editor)
- [ ] `firebase login` exécuté en local avec un compte ayant accès à `dyspo-2bb43`
- [ ] Si connexion sociale activée (Google/Apple/Facebook) : accès Apple Developer Program + Facebook for Developers (voir Étape 6)
- [ ] Numéro de version actuellement en ligne sur Play Console / App Store Connect (pour le bump de version, Étape 8)

---

## Étape 1 — Corriger `.firebaserc`

Déjà fait dans le repo actuel :

```json
{
  "projects": {
    "default": "dyspo-test",
    "prod": "dyspo-2bb43",
    "stg": "dyspo-test"
  }
}
```

⚠️ Toujours déployer avec `--project dyspo-2bb43` explicite (jamais sans `--project`, sans quoi `default` pointe vers `dyspo-test`).

## Étape 2 — Déployer les règles de sécurité

```bash
firebase deploy --project dyspo-2bb43 --only firestore:rules,storage:rules
```

Source : `firestore.rules` et `storage.rules` à la racine du repo (déjà durcis : validation taille/type sur Storage, protection anti auto-promotion admin sur `agenda_events`).

## Étape 3 — Déployer l'index Firestore composite

```bash
firebase deploy --project dyspo-2bb43 --only firestore:indexes
```

Source : `firestore.indexes.json` (index `agenda_events` : `members_uid` Array-contains + `start_date_ts` Ascending — nécessaire à la sélection de participants en création d'événement, sinon échec silencieux en prod).

## Étape 4 — Activer les services dans la Console Firebase (`dyspo-2bb43`)

- **Authentication** → activer "Email/Password" + tout provider social utilisé (voir Étape 6)
- **Firestore Database** → créer la base en mode production si pas déjà fait
- **Storage** → créer le bucket si pas déjà fait
- **Cloud Messaging (FCM)** → uploader le certificat push **APNs** (iOS) ; vérifier la config Android (automatique via `google-services.json`)

## Étape 5 — Récupérer les fichiers de configuration natifs

| Fichier | Où le récupérer | Où le placer |
|---|---|---|
| `google-services.json` | Console Firebase `dyspo-2bb43` → ⚙️ Paramètres du projet → app Android `com.liaisongraphique.dyspo` | `android/prod/app/` |
| `GoogleService-Info.plist` | Même écran → app iOS `com.liaisongraphique.dyspo` | `ios/prod/App/App/` |

Si ces deux apps n'existent pas encore côté `dyspo-2bb43`, les créer dans la Console avec exactement ces Package name / Bundle ID (doivent matcher `cap-configs/prod/capacitor.config.ts`).

**État actuel : ces deux fichiers sont absents en local** — build natif prod impossible jusqu'à cette étape. Identifiants réels liés au compte Firebase, ne peuvent pas être générés autrement.

## Étape 6 — Connexion sociale (Google / Apple / Facebook)

Si la connexion sociale (ajoutée récemment) doit fonctionner en prod :

1. **Firebase Console `dyspo-2bb43`** → Authentication → Sign-in method → activer **Google**, **Apple**, **Facebook**
2. **Apple Developer** → Certificates, Identifiers & Profiles → activer "Sign In with Apple" sur l'App ID `com.liaisongraphique.dyspo` → créer un Services ID
3. **Facebook for Developers** → créer une App → récupérer **App ID** + **Client Token**

Puis remplacer les placeholders `REPLACE_WITH_...` dans ces 8 fichiers (recherche globale `REPLACE_WITH_` dans le repo) :

```
android/prod/app/src/main/res/values/strings.xml
android/prod/app/src/main/AndroidManifest.xml
ios/prod/App/App/Info.plist
ios/prod/App/App/App.entitlements
(+ les 4 équivalents stg, déjà fonctionnels avec les mêmes placeholders)
```

Sur iOS, activer en plus la capability "Sign in with Apple" dans Xcode (l'entitlement est déjà présent dans le repo, Xcode doit juste re-synchroniser avec le compte développeur).

## Étape 7 — Build et test de bout en bout sur prod

```bash
npm run web-prod      # build web pointé prod
npm run android-prod  # sync Capacitor + build natif Android
npm run ios-prod       # sync Capacitor + build natif iOS
```

À tester sur device réel avant soumission :
- [ ] Inscription email/password + chaque provider social activé
- [ ] Création d'événement multi-participants (déclenche l'index de l'Étape 3)
- [ ] Upload avatar / photo de chat (déclenche les règles Storage)
- [ ] Notification push (déclenche la config FCM de l'Étape 4)
- [ ] Pages CGU (`/cgu`) et Politique de confidentialité (`/privacy`) accessibles depuis Paramètres et Inscription (pages locales, embarquées dans l'app — aucune dépendance à un site externe)

## Étape 8 — Nettoyage avant publication

- [ ] Bumper `versionCode` Android (actuellement `9`) et `CURRENT_PROJECT_VERSION` iOS (actuellement `10`) strictement au-dessus de la version live sur les stores
- [ ] Ne **jamais** exécuter `scripts/seed-test-data.js` sur `dyspo-2bb43` (comptes de démo réservés à `dyspo-test`) — pour un compte reviewer Apple/Google, créer un compte réel dédié directement dans l'app
- [ ] Vérifier que `WRITE_CONTACTS` n'est pas présent dans `android/prod/.../AndroidManifest.xml` (permission non utilisée, déjà retirée)

---

## Checklist de synthèse

| # | Action | Qui |
|---|---|---|
| 1 | `.firebaserc` correct | ✅ Fait |
| 2 | Déployer règles Firestore/Storage | À exécuter |
| 3 | Déployer index Firestore | À exécuter |
| 4 | Activer Auth/Firestore/Storage/FCM dans la Console | Utilisateur (Console) |
| 5 | Récupérer `google-services.json` + `GoogleService-Info.plist` | Utilisateur (Console) |
| 6 | Config Google/Apple/Facebook (si connexion sociale) | Utilisateur (3 consoles externes) |
| 7 | Build + test sur device | À exécuter |
| 8 | Bump version + nettoyage | Utilisateur (vérifier stores) |

Les étapes 4, 5, 6 et la vérification de version (8) nécessitent un accès à des consoles externes (Firebase, Apple, Facebook, Play/App Store) que je n'ai pas — tout le reste peut être exécuté directement depuis ce repo.
