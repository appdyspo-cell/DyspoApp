#!/usr/bin/env node
/**
 * Vérification avant un build de release (lancée par ios-prod / android-prod).
 *
 * Bloque si :
 *   - la branche locale est en retard sur GitHub (du code poussé depuis un autre ordinateur manquerait au build)
 *   - les versions iOS et Android (prod) ne sont pas identiques
 * Avertit si :
 *   - des commits locaux ne sont pas poussés (l'autre ordinateur ne les aura pas)
 *   - des fichiers ne sont pas commités
 *
 * En cas d'urgence : SKIP_SYNC_CHECK=1 npm run ios-prod
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.env.SKIP_SYNC_CHECK) {
  console.warn('⚠️  Vérification de synchronisation ignorée (SKIP_SYNC_CHECK).');
  process.exit(0);
}

const root = path.join(__dirname, '..');
const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trimEnd();
let failed = false;

// 1. Synchronisation avec GitHub
try {
  git('fetch --quiet origin');
  const branch = git('rev-parse --abbrev-ref HEAD');
  const upstream = git(`rev-parse --abbrev-ref ${branch}@{upstream}`);
  const [ahead, behind] = git(`rev-list --left-right --count ${branch}...${upstream}`).split(/\s+/).map(Number);
  if (behind > 0) {
    console.error(`❌ ${branch} a ${behind} commit(s) de retard sur ${upstream}.`);
    console.error('   Du travail a été poussé depuis un autre ordinateur. Récupère-le d\'abord :  git pull');
    failed = true;
  }
  if (ahead > 0) {
    console.warn(`⚠️  ${ahead} commit(s) local(aux) non poussé(s) — pense à faire  git push  après le build.`);
  }
} catch (e) {
  console.warn('⚠️  Impossible de vérifier GitHub (pas de réseau ou pas de branche suivie) :', e.message.split('\n')[0]);
}

const dirty = git('status --porcelain');
if (dirty) {
  console.warn('⚠️  Fichiers non commités :\n' + dirty.split('\n').map((l) => '     ' + l).join('\n'));
}

// 2. Versions iOS / Android identiques
const gradle = fs.readFileSync(path.join(root, 'android/prod/app/build.gradle'), 'utf8');
const pbx = fs.readFileSync(path.join(root, 'ios/prod/App/App.xcodeproj/project.pbxproj'), 'utf8');
const androidVersion = (gradle.match(/versionName\s+['"]([^'"]+)['"]/) || [])[1];
const iosVersions = [...new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim()))];
if (iosVersions.length !== 1 || iosVersions[0] !== androidVersion) {
  console.error(`❌ Versions différentes : Android ${androidVersion}, iOS ${iosVersions.join(' / ')}.`);
  console.error('   Aligne-les avec :  npm run bump');
  failed = true;
}

if (failed) process.exit(1);
console.log(`✅ À jour avec GitHub — version ${androidVersion} sur iOS et Android.`);
