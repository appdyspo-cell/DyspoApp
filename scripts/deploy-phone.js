const { execSync } = require('child_process');
const path = require('path');

const DEVICE = '38251FDJG0046J';
const PKG    = 'com.rovincent.dyspo.staging';
const APK    = 'android/stg/app/build/outputs/apk/debug/app-debug.apk';

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', shell: true, cwd: cwd ? path.join(process.cwd(), cwd) : process.cwd() });
}

run('npm run android-stg');
run('gradlew.bat assembleDebug', 'android/stg');
run(`adb -s ${DEVICE} install -r ${APK}`);
run(`adb -s ${DEVICE} shell monkey -p ${PKG} 1`);
