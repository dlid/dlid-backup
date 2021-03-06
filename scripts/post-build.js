const fs = require('fs');
const { argv } = require('process');
const packageContent = fs.readFileSync('./package.json');
const getSize = require('get-folder-size');
const packageJson = JSON.parse(packageContent);
const r = require('replace-in-file');
let version = packageJson.version;
let isRelease = false;

if (argv.includes('--development')) {
    version += ' DEVELOPMENT BUILD';
} else {
    isRelease = true;
}

let targetFolder = isRelease ? 'dist/release/' : 'dist/dev/';

replaceVersionNumber();
createNpmFiles();

function loginfo(text) {
    const date = new Date();
    const prefix = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds().toString().padStart(2, '0') + ' - [post.build] ';
    console.log(`${prefix}${text}`);
}
 
function replaceVersionNumber() {
    loginfo(`Updating dist version number to ${version}`);
    r.replaceInFileSync({
        files: [`./${targetFolder}lib/dlid-backup.class.js`],
        from: '%DLID-BACKUP-VERSION%',
        to: version
    });
}
 
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    const v = Math.floor(Math.log(bytes) / Math.log(1024))
    var i = parseInt( v.toString()  );
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
 };

function createNpmFiles() {
    const fs = require('fs');
    const { argv } = require('process');
    const packageContent = fs.readFileSync('./package.json');
    const packageJson = JSON.parse(packageContent);
    let version = packageJson.version;

    if (!fs.existsSync(`./${targetFolder}bin`)) {
        fs.mkdirSync(`./${targetFolder}bin`)
    }


    loginfo(`Creating ${targetFolder}package.json`);

    let package = packageJson;
    delete packageJson.devDependencies;
    delete packageJson.scripts;
    packageJson.main = './lib/dlid-backup.class.js';
    packageJson.bin = './bin/index.js';

    fs.writeFileSync(`./${targetFolder}package.json`, JSON.stringify(package, null, 2));

    loginfo(`Copying LICENSE.md`);
    fs.copyFileSync('./LICENSE.md', `./${targetFolder}/LICENSE.md`);

    loginfo(`Copying README.md`);
    fs.copyFileSync('./README.md', `./${targetFolder}/README.md`);

    loginfo(`Creating ${targetFolder}bin/index.js`);

    let debugInfo = '';
    if (!isRelease) {
        debugInfo = `console.log('###\\n###\\### \x1b[1m\x1b[33mDLID-BACKUP DEVELOPMENT BUILD\x1b[0m. USE npm run build to create release.\\n###\\n\\n');\n`;
    }

    fs.writeFileSync(`./${targetFolder}bin/index.js`, `#!/usr/bin/env node
${debugInfo}require('../lib/run');
    `);

 
getSize(`./${targetFolder}`, (err, size) => {
  if (err) { throw err; }
 
  loginfo(bytesToSize(size));
});


} 
