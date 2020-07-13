const fs = require('fs');
const { argv } = require('process');
const packageContent = fs.readFileSync('./package.json');
const packageJson = JSON.parse(packageContent);
let version = packageJson.version;

if (argv.includes('--development')) {
    version += ' DEVELOPMENT BUILD';
}

const r = require('replace-in-file');



console.log("UPDATE DIST VERSION", version);


r.replaceInFileSync({
    files: ['./dist/index.js'],
    from: '%DLID-BACKUP-VERSION%',
    to: version
});
 
// 


