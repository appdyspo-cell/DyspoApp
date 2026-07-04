/**
 * seed-test-data.js
 * ---------------------------------------------------------------
 * Peuple Firebase STG (dyspo-test) avec des données de test pour
 * la review Apple / Android.
 *
 * PRÉREQUIS :
 *   - service-account-stg.json à la racine du projet
 *     (https://console.firebase.google.com/project/dyspo-test/settings/serviceaccounts/adminsdk)
 *
 * USAGE :
 *   node scripts/seed-test-data.js
 *
 * Comptes créés :
 *   reviewer@dyspo.app   / DyspoReview2024!  ← compte principal pour le reviewer
 *   alice@dyspo.app      / DyspoReview2024!  ← amie du reviewer
 *   bob@dyspo.app        / DyspoReview2024!  ← invitation en attente vers reviewer
 *
 * OPTIONS :
 *   --clean   Supprime tous les documents créés avant de re-seeder
 * ---------------------------------------------------------------
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account-stg.json');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const CLEAN = process.argv.includes('--clean');

// ── Date helpers (sans date-fns, pour éviter les dépendances externes) ────────

function pad(n) { return String(n).padStart(2, '0'); }

function toISOLocal(date) {
  // Produit YYYY-MM-DDTHH:mm:ss (sans timezone) comme date-fns formatISO
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

const FR_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const FR_DAYS   = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

function formatISODate(isoStr) {
  const d = new Date(isoStr);
  return `${FR_DAYS[d.getDay()]} ${pad(d.getDate())} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Calcule le prochain jour de semaine (0=dim, 1=lun, ... 6=sam) depuis aujourd'hui
function nextWeekday(weekday, offsetWeeks = 0) {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // midday pour éviter les soucis DST
  const diff = (weekday - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff + offsetWeeks * 7);
  return d;
}

// Ajoute N jours
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function setHourMin(date, h, m) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Construit un objet AgendaEvent complet
function buildEvent({ uid, title, description = '', startDate, endDate, type, membersUid, membersInvitedUid = [], adminUid, isMulti, chatrooms = {} }) {
  const startISO = toISOLocal(startDate);
  const endISO   = toISOLocal(endDate);
  const refStart = startOfDay(startDate);
  const refEnd   = endOfDay(endDate);

  return {
    uid,
    title,
    description,
    startISO,
    endISO,
    status: 'ACTIVE',
    type,
    start_date_ts: refStart.getTime(),
    end_date_ts: refEnd.getTime(),
    start_date_day_of_year: getDayOfYear(startDate),
    end_date_day_of_year: getDayOfYear(endDate),
    start_date_year: startDate.getFullYear(),
    end_date_year: endDate.getFullYear(),
    ref_start_ISO: toISOLocal(refStart),
    ref_end_ISO: toISOLocal(refEnd),
    start_date_formatted: formatISODate(startISO),
    end_date_formatted: formatISODate(endISO),
    start_time_formatted: formatTime(startISO),
    end_time_formatted: formatTime(endISO),
    members_uid: membersUid,
    members_invited_uid: membersInvitedUid,
    admin_uid: adminUid,
    all_can_edit: false,
    all_can_see_title: true,
    is_multi: isMulti,
    recurrence: 'ONE',
    recurrence_nb: '1',
    ...chatrooms,
  };
}

// Construit un objet Chatroom vide pour un événement multi
function buildChatroom(uid) {
  return {
    uid,
    description: '',
    count: 0,
    startMessageId: 0,
    nextMessageId: 0,
    isNotifications: true,
  };
}

// Construit un objet AgendaDyspoItem
function buildDyspo(date, userDyspo) {
  return {
    time: date.getTime(),
    userDyspo,
    day: date.getDate(),
    month: date.getMonth(),   // 0-indexed comme getMonth()
    year: date.getFullYear(),
  };
}

// Clé Firestore pour un dyspo : {year}_{month}_{day} (month 0-indexed)
function dyspoKey(date) {
  return `${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getOrCreateUser(email, password, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  → Utilisateur existant : ${email} (uid: ${existing.uid})`);
    return existing;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email, password, displayName });
      console.log(`  → Utilisateur créé : ${email} (uid: ${created.uid})`);
      return created;
    }
    throw e;
  }
}

// ── Clean helpers ─────────────────────────────────────────────────────────────

async function deleteCollection(collPath) {
  const snap = await db.collection(collPath).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

async function deleteSubcollection(docPath, subColl) {
  const snap = await db.collection(`${docPath}/${subColl}`).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Seed DyspoApp — environnement STG (dyspo-test)\n');

  // 1. Création des comptes Auth ──────────────────────────────────────────────
  console.log('1. Création des comptes Firebase Auth...');
  const PASSWORD = 'DyspoReview2024!';

  const reviewerUser = await getOrCreateUser('reviewer@dyspo.app', PASSWORD, 'Marc Reviewer');
  const aliceUser    = await getOrCreateUser('alice@dyspo.app',    PASSWORD, 'Alice Dupont');
  const bobUser      = await getOrCreateUser('bob@dyspo.app',      PASSWORD, 'Bob Martin');

  const UID_REVIEWER = reviewerUser.uid;
  const UID_ALICE    = aliceUser.uid;
  const UID_BOB      = bobUser.uid;

  console.log(`\n   reviewer uid : ${UID_REVIEWER}`);
  console.log(`   alice uid    : ${UID_ALICE}`);
  console.log(`   bob uid      : ${UID_BOB}\n`);

  // 2. Nettoyage optionnel ────────────────────────────────────────────────────
  if (CLEAN) {
    console.log('2. Nettoyage des données existantes...');
    for (const uid of [UID_REVIEWER, UID_ALICE, UID_BOB]) {
      await deleteSubcollection(`friends/${uid}`, 'friend_list');
      await deleteSubcollection(`agenda_dyspos/${uid}`, 'dyspo_list');
    }
    // Supprime les événements créés par ces users (members_uid contient leur uid)
    for (const prefix of ['seed_ev_solo', 'seed_ev_picnic', 'seed_ev_invite', 'seed_ev_past', 'seed_ev_alice_solo']) {
      await db.collection('agenda_events').doc(prefix).delete().catch(() => {});
    }
    console.log('   ✓ Nettoyage terminé\n');
  }

  // 3. Profils utilisateurs ───────────────────────────────────────────────────
  console.log('3. Création des profils utilisateurs...');

  const defaultSettings = {
    receiveEmail: true,
    receiveNotification: true,
    friendInvitation: true,
    eventInvitation: true,
    actualiteDyspo: true,
    shareAgenda: true,
  };

  const reviewerProfile = {
    uid: UID_REVIEWER,
    email: 'reviewer@dyspo.app',
    firstname: 'Marc',
    lastname: 'Reviewer',
    gender: 'M',
    dyspoStatus: 'UNDEFINED',
    status: 'ACTIVE',
    appSettings: defaultSettings,
    created_at_ms: Date.now(),
    firstConnexion: false,
    tagline: 'Toujours dispo pour une bonne soirée !',
  };

  const aliceProfile = {
    uid: UID_ALICE,
    email: 'alice@dyspo.app',
    firstname: 'Alice',
    lastname: 'Dupont',
    gender: 'F',
    dyspoStatus: 'UNDEFINED',
    status: 'ACTIVE',
    appSettings: defaultSettings,
    created_at_ms: Date.now(),
    firstConnexion: false,
    tagline: "Fan de pique-niques et de jeux de société !",
  };

  const bobProfile = {
    uid: UID_BOB,
    email: 'bob@dyspo.app',
    firstname: 'Bob',
    lastname: 'Martin',
    gender: 'M',
    dyspoStatus: 'UNDEFINED',
    status: 'ACTIVE',
    appSettings: defaultSettings,
    created_at_ms: Date.now(),
    firstConnexion: false,
    tagline: 'Nouveau sur Dyspo, hâte de planifier des sorties !',
  };

  await db.collection('users').doc(UID_REVIEWER).set(reviewerProfile);
  await db.collection('users').doc(UID_ALICE).set(aliceProfile);
  await db.collection('users').doc(UID_BOB).set(bobProfile);
  console.log('   ✓ 3 profils créés\n');

  // 4. Relations amis ─────────────────────────────────────────────────────────
  console.log('4. Création des relations amis...');
  const now = Date.now();

  // reviewer ↔ alice : amis (FRIEND, bidirectionnel)
  const reviewerFriendAlice = {
    friend_uid: UID_ALICE,
    friendLastname: 'Dupont',
    friendFirstname: 'Alice',
    friend_status: 'FRIEND',
    requestDate: now - 7 * 24 * 3600 * 1000,
    since: now - 5 * 24 * 3600 * 1000,
  };
  const aliceFriendReviewer = {
    friend_uid: UID_REVIEWER,
    friendLastname: 'Reviewer',
    friendFirstname: 'Marc',
    friend_status: 'FRIEND',
    requestDate: now - 7 * 24 * 3600 * 1000,
    since: now - 5 * 24 * 3600 * 1000,
  };

  // bob → reviewer : bob a envoyé une invitation au reviewer
  //   Dans la liste de bob : reviewer est INVITED (bob a invité reviewer)
  //   Dans la liste de reviewer : bob est SUGGESTED (reviewer a reçu une invitation de bob)
  const bobInvitedReviewer = {
    friend_uid: UID_REVIEWER,
    friendLastname: 'Reviewer',
    friendFirstname: 'Marc',
    friend_status: 'INVITED',
    requestDate: now - 2 * 24 * 3600 * 1000,
  };
  const reviewerSuggestedBob = {
    friend_uid: UID_BOB,
    friendLastname: 'Martin',
    friendFirstname: 'Bob',
    friend_status: 'SUGGESTED',
    requestDate: now - 2 * 24 * 3600 * 1000,
  };

  await db.collection(`friends/${UID_REVIEWER}/friend_list`).doc(UID_ALICE).set(reviewerFriendAlice);
  await db.collection(`friends/${UID_ALICE}/friend_list`).doc(UID_REVIEWER).set(aliceFriendReviewer);
  await db.collection(`friends/${UID_BOB}/friend_list`).doc(UID_REVIEWER).set(bobInvitedReviewer);
  await db.collection(`friends/${UID_REVIEWER}/friend_list`).doc(UID_BOB).set(reviewerSuggestedBob);
  console.log('   ✓ Relations amis créées\n');

  // 5. Événements ─────────────────────────────────────────────────────────────
  console.log('5. Création des événements...');

  // Prochain vendredi (invitation en attente d'alice)
  const nextFriday   = nextWeekday(5);
  // Prochain samedi (événement solo du reviewer)
  const nextSaturday = nextWeekday(6);
  // Prochain dimanche (pique-nique avec alice)
  const nextSunday   = nextWeekday(0);
  // Samedi passé (événement passé)
  const lastSaturday = addDays(nextWeekday(6), -7);

  // Event 1 — Solo : sortie ciné
  const evSolo = buildEvent({
    uid: 'seed_ev_solo',
    title: 'Ciné avec les copains',
    description: 'Soirée cinéma en ville',
    startDate: setHourMin(nextSaturday, 20, 0),
    endDate: setHourMin(nextSaturday, 22, 30),
    type: 'FREE',
    membersUid: [UID_REVIEWER],
    adminUid: UID_REVIEWER,
    isMulti: false,
  });

  // Event 2 — Multi : pique-nique avec alice (reviewer + alice membres)
  const chatroomPicnicKey = `user_${UID_REVIEWER}`;
  const evPicnic = buildEvent({
    uid: 'seed_ev_picnic',
    title: 'Pique-nique au parc',
    description: 'Retrouvons-nous au parc pour un beau pique-nique',
    startDate: setHourMin(nextSunday, 12, 0),
    endDate: setHourMin(nextSunday, 15, 0),
    type: 'FREE',
    membersUid: [UID_REVIEWER, UID_ALICE],
    adminUid: UID_REVIEWER,
    isMulti: true,
    chatrooms: {
      [`user_${UID_REVIEWER}`]: buildChatroom(UID_REVIEWER),
      [`user_${UID_ALICE}`]: buildChatroom(UID_ALICE),
    },
  });

  // Event 3 — Invitation reçue : soirée jeux (alice invite reviewer)
  // reviewer est dans members_invited_uid, alice est dans members_uid + admin
  const evInvite = buildEvent({
    uid: 'seed_ev_invite',
    title: 'Soirée jeux de société',
    description: 'Une soirée conviviale autour des jeux de société',
    startDate: setHourMin(nextFriday, 19, 0),
    endDate: setHourMin(nextFriday, 23, 0),
    type: 'FREE',
    membersUid: [UID_ALICE],
    membersInvitedUid: [UID_REVIEWER],
    adminUid: UID_ALICE,
    isMulti: true,
    chatrooms: {
      [`user_${UID_ALICE}`]: buildChatroom(UID_ALICE),
    },
  });

  // Event 4 — Passé : barbecue
  const evPast = buildEvent({
    uid: 'seed_ev_past',
    title: "Barbecue d'été",
    description: 'Super barbecue avec les amis',
    startDate: setHourMin(lastSaturday, 18, 0),
    endDate: setHourMin(lastSaturday, 21, 0),
    type: 'FREE',
    membersUid: [UID_REVIEWER, UID_ALICE],
    adminUid: UID_REVIEWER,
    isMulti: true,
    chatrooms: {
      [`user_${UID_REVIEWER}`]: buildChatroom(UID_REVIEWER),
      [`user_${UID_ALICE}`]: buildChatroom(UID_ALICE),
    },
  });

  // Event 5 — Événement d'alice visible pour le reviewer (agenda ami)
  const evAliceSolo = buildEvent({
    uid: 'seed_ev_alice_solo',
    title: 'Yoga matinal',
    description: '',
    startDate: setHourMin(nextSaturday, 9, 0),
    endDate: setHourMin(nextSaturday, 10, 30),
    type: 'FREE',
    membersUid: [UID_ALICE],
    adminUid: UID_ALICE,
    isMulti: false,
  });

  await db.collection('agenda_events').doc(evSolo.uid).set(evSolo);
  await db.collection('agenda_events').doc(evPicnic.uid).set(evPicnic);
  await db.collection('agenda_events').doc(evInvite.uid).set(evInvite);
  await db.collection('agenda_events').doc(evPast.uid).set(evPast);
  await db.collection('agenda_events').doc(evAliceSolo.uid).set(evAliceSolo);
  console.log('   ✓ 5 événements créés\n');

  // 6. Statuts dyspo du reviewer (33 jours à partir d'aujourd'hui) ────────────
  console.log('6. Création des statuts dyspo du reviewer...');

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const batch = db.batch();

  for (let i = 0; i < 33; i++) {
    const d = addDays(today, i);
    const dayOfWeek = d.getDay(); // 0=dim, 1=lun, ..., 6=sam

    // DYSPO les jeudis (4), vendredis (5), samedis (6), dimanches (0)
    // NODYSPO les lundis (1), mardis (2), mercredis (3)
    let userDyspo;
    if ([0, 4, 5, 6].includes(dayOfWeek)) {
      userDyspo = 'DYSPO';
    } else {
      userDyspo = 'NODYSPO';
    }

    const key = dyspoKey(d);
    const dyspoRef = db.collection(`agenda_dyspos/${UID_REVIEWER}/dyspo_list`).doc(key);
    batch.set(dyspoRef, buildDyspo(d, userDyspo));
  }

  // Quelques dyspos pour alice aussi (pour que le reviewer voit sa dispo)
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    const dayOfWeek = d.getDay();

    let userDyspo;
    if ([5, 6, 0].includes(dayOfWeek)) {
      userDyspo = 'DYSPO';
    } else if ([2, 3].includes(dayOfWeek)) {
      userDyspo = 'NODYSPO';
    } else {
      userDyspo = 'UNDEFINED';
    }

    const key = dyspoKey(d);
    const dyspoRef = db.collection(`agenda_dyspos/${UID_ALICE}/dyspo_list`).doc(key);
    batch.set(dyspoRef, buildDyspo(d, userDyspo));
  }

  await batch.commit();
  console.log('   ✓ 33 statuts dyspo reviewer + 14 statuts dyspo alice créés\n');

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅  Seed terminé — environnement STG (dyspo-test)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('  Comptes de test :');
  console.log('  ┌─────────────────────────────┬──────────────────────────┐');
  console.log('  │ Email                       │ Mot de passe             │');
  console.log('  ├─────────────────────────────┼──────────────────────────┤');
  console.log('  │ reviewer@dyspo.app          │ DyspoReview2024!         │');
  console.log('  │ alice@dyspo.app             │ DyspoReview2024!         │');
  console.log('  │ bob@dyspo.app               │ DyspoReview2024!         │');
  console.log('  └─────────────────────────────┴──────────────────────────┘\n');
  console.log('  Scénario de review :');
  console.log('  1. Se connecter avec reviewer@dyspo.app');
  console.log('  2. Agenda : voir les pastilles sur samedi (ciné) et dimanche (pique-nique)');
  console.log(`  3. Notifications : invitation "Soirée jeux" d'Alice (vendredi)`);
  console.log(`  4. Accepter l'invitation → pastille apparaît sur vendredi`);
  console.log('  5. Amis : Alice Dupont (amie), Bob Martin (demande en attente)');
  console.log('  6. Accepter la demande de Bob → il passe en ami');
  console.log('  7. Statuts dyspo : remplis pour les 33 prochains jours\n');
}

main().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
