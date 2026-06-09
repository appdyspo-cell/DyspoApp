/**
 * migrate-firestore.js
 * ---------------------------------------------------------------
 * Exporte toutes les collections de Firebase PROD (dyspo-2bb43)
 * et les importe dans Firebase STG (dyspo-test).
 *
 * PRÉREQUIS :
 *   - service-account-prod.json  → clé Admin SDK du projet PROD (dyspo-2bb43)
 *   - service-account-stg.json   → clé Admin SDK du projet DEV  (dyspo-test)
 *     À télécharger depuis :
 *     PROD : https://console.firebase.google.com/project/dyspo-2bb43/settings/serviceaccounts/adminsdk
 *     DEV  : https://console.firebase.google.com/project/dyspo-test/settings/serviceaccounts/adminsdk
 *
 * USAGE :
 *   node scripts/migrate-firestore.js
 *
 * OPTIONS :
 *   --export-only   Exporte uniquement vers firestore-backup.json (sans importer)
 *   --import-only   Importe depuis firestore-backup.json existant (sans exporter)
 *   --collections   Liste de collections séparées par virgule (ex: users,friends)
 * ---------------------------------------------------------------
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const PROD_KEY  = path.join(__dirname, '..', 'service-account-prod.json');
const STG_KEY   = path.join(__dirname, '..', 'service-account-stg.json');
const BACKUP_FILE = path.join(__dirname, '..', 'firestore-backup.json');

// Collections à migrer (laisser vide [] pour tout migrer)
const COLLECTIONS_FILTER = parseArg('--collections')
  ? parseArg('--collections').split(',')
  : [];

const EXPORT_ONLY  = process.argv.includes('--export-only');
const IMPORT_ONLY  = process.argv.includes('--import-only');
const BATCH_SIZE   = 400; // max 500 pour Firestore writeBatch

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function parseArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

async function getAllDocuments(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const docs = {};
  for (const doc of snapshot.docs) {
    docs[doc.id] = doc.data();
    // Récupérer les sous-collections
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      const subDocs = await getAllDocuments(
        { collection: (name) => subCol },
        subCol.id
      );
      docs[doc.id][`__sub__${subCol.id}`] = subDocs;
    }
  }
  return docs;
}

async function exportFromProd() {
  log('🔵 Connexion à PROD (dyspo-2bb43)...');
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(require(PROD_KEY)),
  }, 'prod');
  const prodDb = prodApp.firestore();

  log('📋 Récupération des collections...');
  const collections = await prodDb.listCollections();
  const allCollectionNames = collections.map(c => c.id);

  const filteredNames = COLLECTIONS_FILTER.length > 0
    ? allCollectionNames.filter(n => COLLECTIONS_FILTER.includes(n))
    : allCollectionNames;

  log(`📦 Collections trouvées: ${allCollectionNames.join(', ')}`);
  if (COLLECTIONS_FILTER.length > 0) {
    log(`🎯 Filtre appliqué: ${filteredNames.join(', ')}`);
  }

  const backup = {};
  for (const colName of filteredNames) {
    log(`  → Export collection: ${colName}`);
    backup[colName] = await getAllDocuments(prodDb, colName);
    const count = Object.keys(backup[colName]).length;
    log(`     ${count} document(s) exporté(s)`);
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf8');
  log(`✅ Backup sauvegardé: ${BACKUP_FILE}`);
  log(`📊 Total: ${Object.keys(backup).length} collection(s)`);

  await prodApp.delete();
  return backup;
}

async function importToStg(backup) {
  log('\n🟠 Connexion à STG (dyspo-stg)...');
  const stgApp = admin.initializeApp({
    credential: admin.credential.cert(require(STG_KEY)),
  }, 'stg');
  const stgDb = stgApp.firestore();

  for (const [colName, docs] of Object.entries(backup)) {
    const docIds = Object.keys(docs);
    log(`\n  → Import collection: ${colName} (${docIds.length} docs)`);

    // Écriture par lots (batch de 400 max)
    let batch = stgDb.batch();
    let count = 0;

    for (const [docId, data] of Object.entries(docs)) {
      // Filtrer les sous-collections (stockées avec préfixe __sub__)
      const cleanData = {};
      for (const [key, val] of Object.entries(data)) {
        if (!key.startsWith('__sub__')) cleanData[key] = val;
      }
      const ref = stgDb.collection(colName).doc(docId);
      batch.set(ref, cleanData, { merge: true });
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        log(`     ✓ ${count}/${docIds.length} docs committed`);
        batch = stgDb.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
      log(`     ✓ ${count}/${docIds.length} docs committed`);
    }
  }

  log('\n✅ Import terminé avec succès !');
  await stgApp.delete();
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  log('═══════════════════════════════════════════');
  log('   DYSPO — Migration Firestore PROD → STG  ');
  log('═══════════════════════════════════════════\n');

  // Vérifications préalables
  if (!IMPORT_ONLY && !fs.existsSync(PROD_KEY)) {
    console.error(`❌ Clé PROD introuvable: ${PROD_KEY}`);
    console.error('   Téléchargez-la depuis Firebase Console > dyspo-2bb43 > Paramètres > Comptes de service');
    process.exit(1);
  }
  if (!EXPORT_ONLY && !fs.existsSync(STG_KEY)) {
    console.error(`❌ Clé STG introuvable: ${STG_KEY}`);
    console.error('   Téléchargez-la depuis Firebase Console > dyspo-stg > Paramètres > Comptes de service');
    process.exit(1);
  }

  try {
    let backup;

    if (IMPORT_ONLY) {
      if (!fs.existsSync(BACKUP_FILE)) {
        console.error(`❌ Fichier backup introuvable: ${BACKUP_FILE}`);
        process.exit(1);
      }
      log(`📂 Lecture du backup: ${BACKUP_FILE}`);
      backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    } else {
      backup = await exportFromProd();
    }

    if (!EXPORT_ONLY) {
      await importToStg(backup);
    }

    log('\n🎉 Migration terminée avec succès !');
    if (!EXPORT_ONLY) {
      log(`💾 Backup conservé dans: ${BACKUP_FILE}`);
    }
  } catch (err) {
    console.error('\n❌ Erreur lors de la migration:', err);
    process.exit(1);
  }
}

main();
