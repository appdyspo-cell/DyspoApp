#!/usr/bin/env node
/**
 * Version unique iOS + Android (prod).
 *
 *   npm run bump              → 1.4.2 → 1.4.3
 *   npm run bump -- minor     → 1.4.2 → 1.5.0
 *   npm run bump -- 2.0.0     → version précise
 *   npm run bump -- --android-code 70   → force le versionCode (si la Play Console a déjà plus)
 *
 * Met à jour en une fois :
 *   - android/prod/app/build.gradle : versionName + versionCode (+1)
 *   - ios/prod/App/App.xcodeproj/project.pbxproj : MARKETING_VERSION + CURRENT_PROJECT_VERSION (+1)
 *   - package.json : version
 * La version de départ est la plus haute des deux plateformes, pour qu'elles ne divergent jamais.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const GRADLE = path.join(root, 'android/prod/app/build.gradle');
const PBXPROJ = path.join(root, 'ios/prod/App/App.xcodeproj/project.pbxproj');
const PKG = path.join(root, 'package.json');

const parse = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

function readAndroid() {
  const src = fs.readFileSync(GRADLE, 'utf8');
  const name = src.match(/versionName\s+['"]([^'"]+)['"]/);
  const code = src.match(/versionCode\s+(\d+)/);
  if (!name || !code) throw new Error(`versionName/versionCode introuvables dans ${GRADLE}`);
  return { src, version: name[1], build: parseInt(code[1], 10) };
}

function readIos() {
  const src = fs.readFileSync(PBXPROJ, 'utf8');
  const names = [...src.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1].trim());
  const builds = [...src.matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((m) => parseInt(m[1], 10));
  if (!names.length || !builds.length) throw new Error(`MARKETING_VERSION/CURRENT_PROJECT_VERSION introuvables dans ${PBXPROJ}`);
  return { src, version: names.sort(cmp).pop(), build: Math.max(...builds) };
}

const args = process.argv.slice(2);
let androidCodeOverride;
const idx = args.indexOf('--android-code');
if (idx !== -1) {
  androidCodeOverride = parseInt(args[idx + 1], 10);
  args.splice(idx, 2);
}
const kind = args[0] || 'patch';

const android = readAndroid();
const ios = readIos();
const current = cmp(android.version, ios.version) >= 0 ? android.version : ios.version;

let next;
if (/^\d+\.\d+\.\d+$/.test(kind)) {
  next = kind;
} else {
  const [ma, mi, pa] = parse(current);
  next = { major: `${ma + 1}.0.0`, minor: `${ma}.${mi + 1}.0`, patch: `${ma}.${mi}.${(pa || 0) + 1}` }[kind];
  if (!next) {
    console.error(`Argument inconnu « ${kind} » (attendu : patch, minor, major ou x.y.z)`);
    process.exit(1);
  }
}
// Version identique autorisée seulement pour corriger le versionCode (--android-code)
if (cmp(next, current) < 0 || (cmp(next, current) === 0 && !androidCodeOverride)) {
  console.error(`La nouvelle version ${next} doit être supérieure à la version actuelle ${current}.`);
  process.exit(1);
}

const androidCode = androidCodeOverride || android.build + 1;
const iosBuild = ios.build + 1;

fs.writeFileSync(
  GRADLE,
  android.src
    .replace(/versionName\s+['"][^'"]+['"]/, `versionName '${next}'`)
    .replace(/versionCode\s+\d+/, `versionCode ${androidCode}`)
);
fs.writeFileSync(
  PBXPROJ,
  ios.src
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${next};`)
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${iosBuild};`)
);
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
pkg.version = next;
fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');

console.log(`Android : ${android.version} (${android.build}) → ${next} (${androidCode})`);
console.log(`iOS     : ${ios.version} (${ios.build}) → ${next} (${iosBuild})`);
console.log(`\nVérifie dans la Play Console que le versionCode ${androidCode} n'a jamais été envoyé`);
console.log(`(sinon : npm run bump -- ${next} --android-code <dernier + 1>), puis commite et pousse.`);
