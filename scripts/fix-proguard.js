#!/usr/bin/env node
// Remplace proguard-android.txt par proguard-android-optimize.txt dans les build.gradle
// des plugins Capacitor dans node_modules (proguard-android.txt rejeté par AGP 8+).
// Exécuté automatiquement via "postinstall" dans package.json.

const fs = require('fs');
const path = require('path');

const OLD = "getDefaultProguardFile('proguard-android.txt')";
const NEW = "getDefaultProguardFile('proguard-android-optimize.txt')";

const targets = [
  '@capacitor-community/contacts/android/build.gradle',
  '@capacitor-firebase/app/android/build.gradle',
  '@capacitor-firebase/authentication/android/build.gradle',
  '@capacitor-firebase/messaging/android/build.gradle',
  'capacitor-email-composer/android/build.gradle',
];

const nodeModules = path.join(__dirname, '..', 'node_modules');

for (const rel of targets) {
  const file = path.join(nodeModules, rel);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(OLD)) continue;
  fs.writeFileSync(file, content.replaceAll(OLD, NEW), 'utf8');
  console.log('fix-proguard: patched', rel);
}
