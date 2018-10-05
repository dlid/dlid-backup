// https://medium.com/@stardusteric/nodejs-with-firebase-storage-c6ddcf131ceb
const fs = require('fs');
const moment = require('moment');
var AdmZip = require('adm-zip');
const upload = require('./upload');
const zlib = require('zlib');
const os = require('os');
const path = require('path');


// node .\db.js --dateformat="ddd" -z="mysql-backup" -p="mysql/weekdaily"
// node .\db.js --dateformat="YYYY[W]WW" -z="mysql-backup" -p="mysql/weekly" -keep 10
// node .\db.js --dateformat="YYYY-MM" -z="mysql-backup" -p="mysql/monthly" -keep 12

// creating archives
var zip = new AdmZip();
    
var paramDef = {'dateformat': true, 'zipname' : true, 'path' : true, 'keep': true},
    paramAliases = {'d': 'dateformat', 'z' : 'zipname', 'p':'path', 'k' : 'keep'},
    params = process.argv.slice(2).reduce((px, p) => {
        p = p.indexOf('--') === 0 ? p = p.substr(2) : p;
        p = p.indexOf('-') === 0 ? p = p.substr(1) : p;
        
        var d = p.split('=', 2),
            paramName = d[0],
            value = d.length > 1 ? d[1] : true;
        if (paramAliases[paramName]) paramName = paramAliases[paramName];
        px[paramName] = value;
        return px;

    }, {});

if (!params.dateformat) {
    params.dateformat = `YYYY-MM-DD`;
}

if (!params.zipname) params.zipname = null;
if(params.path) {
    if (params.path[params.path.length-1] !== '/')
        params.path+='/';
} else {
    params.path = "";
}

params.path = params.path ? params.path.replace('{hostname}', os.hostname().toLowerCase()) : params.path;

params.keep = parseInt(params.keep, 10);
if(isNaN(params.keep)) params.keep = 1;


const mysqlpath = `C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\`;

function cmd(name, params) {
    
    if (os.type() === 'Windows_NT') {
        name = '"' + mysqlpath + name + ".exe" + '"';
        return `${name} ${params} -u root -pdd9HtAtBR8Jzp6` 
    } else {
        return `${name} ${params}`;
    }
}

const { exec } = require('child_process');
const exclude = ['mysql','performance_schema','sys', 'information_schema'];

function linesplit(string) {

    var character = '\r\n';
    if (string.indexOf(character) === -1) {
        if (string.indexOf('\n') !== -1) {
            character = '\n';
        } else if (string.indexOf('\r') !== -1) {
            character = '\r';
        }
    }
    return string.split(character);
}

function getDatabases() {
    return new Promise((resolve, reject) => {
        exec(cmd(`mysql`, `-e "SHOW DATABASES" -N`), (err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(linesplit(stdout).filter(item => item && exclude.indexOf(item) === -1));
        });
    });
}

async function dumpDatabase(name) {
    return new Promise((resolve, reject) => {
        exec(cmd(`mysqldump`, `--databases "${name}"`), (err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }

            setTimeout(() => resolve(stdout), 1500);
        });
    });
}


console.log(`[db] Fetching database list...`);
getDatabases().then(async databases => {
    var willSendthis = zip.toBuffer();


    console.log(`[db] Found ${databases.length} databases`);
    if (databases.length== 0) {
        console.log(`[db] Exiting`);
        return;   
    }
    for(let i = 0; i < databases.length; i++) {
        let outputFilename = moment().format(params.dateformat) + `_${databases[i]}.sql`;
        console.log(`[db] Dumping '${databases[i]}'`);
        await dumpDatabase(databases[i]).then(ok => {
            var content = ok;
            console.log(`[db] Adding to zip as ${outputFilename}`);
            zip.addFile(outputFilename, Buffer.alloc(content.length, content), "");
        }).catch(f => {
            console.log(`[db] Error occured`, f);
        })
    }
    const zipName = moment().format(params.dateformat) + (params.zipname ? `_${params.zipname}` : "") +  ".zip";
    var zipFilename = os.tmpdir + path.sep + zipName;
    let destpath = params.path + zipName;
    console.log(`[db] Saving zip file ${zipFilename}`)
    zip.writeZip(zipFilename);
    console.log(`[db] Uploading file to ${destpath}`)
   await upload.uploadFile(zipFilename, destpath).catch(fe => {
        console.log("[db] error uploading file", fe);
    })

    console.log("[db] deleting temporary zip file");
    fs.unlinkSync(zipFilename);
    
    console.log(`[db] Cleaning up history in ${params.path}. Keeping ${params.keep} file(s)`)
    await upload.deleteHistory(params.path, params.keep).then(() => {
    }).catch(e => {
        console.log(`Error cleaning up history`,e)
    });



});



  // Show databases
  // mysql -e "SHOW DATABASES" -N -u root -pdd9HtAtBR8Jzp6

