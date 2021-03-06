# dlid-backup
CLI tool to make a simple backup from a source to a target

```
dlid-backup 
 ACTION = run | help
 -s:COLLECTOR_TYPE 
 [-s.COLLECTOR_PROPERTY=value]...
 -t:TARGET_TYPE 
 [-s.TARGET_PROPERTY=value]...
```
 
All files are collected into a ZIP archive. This ZIP file is then sent to the target.

# Installation

    npm install dlid-backup

## Example - MySQL backup
The MySQL backup will use mysqldump and will only work for the local server.

```
dlid-backup
 run
 -s:mysql                                                # We want to make a MySQL backup
 -s.host=localhost                                       # from a local server
 -s.include=wp_*                                         # of all databases starting with wp_*
 -t:filesystem                                           # Save the backup in the local filesystem
 -t.folder=/usr/david/bak                                # in this folder
 -t.filename={date:yyyy'-'MM'-'dd}-{date}-{date}-wp.zip  # with this filename {these} values are macros  (2020-07-15-wp.zip)
 -t.keep=3                                               # Keep maximum 3 files in the target location that...
 -t.keep-match=*_wp-zip                                  # ..match this pattern - ending with_wp.zip
```

## Collector

A collector is used to gather data/files and put it inside a zip archive. These are the current collectors.

- Filesystem - Zip files using glob patterns or zip an entire folder
- MySQL - Zip SQL database dumps

## Target

A Target is where the Collected zip file should be stored. These are the current targets:

- Filesystem
- Firebase

# Development

```
# Installation
npm install
npm start    # Will watch files and build to dist/ folder

# Run dlid-backup
node ./     # Will run developmente build (dist/bin/index.js)

# Build npm-package
npm run build   # Will build into release/ folder

# Tests
npm test       # Will run tests
```

------------------

Changes

## 0.5.2 (2020-07-16)
- Added Target: Synology FileStation


--------------------------------

More documentation and examples will come - this is just the first release

--------------------------------

### Firebase target

### Firebase key
Download from [Firebase console](https://console.firebase.google.com/project/dlid-backup/settings/serviceaccounts/adminsdk)

## folder.js

Not completed

### MySQL preparations

You should make sure `root` can run `mysqldump` and `mysql` commands without passwords in the command line.

`mysql_config_editor set --login-path=client --host=localhost --user=root --password`

**NOTE!** Put " around the password if it contains special characters

Enter password then connect without parameters (or using parameter --login-path=hej if you named it hej)

### Cron

Cron jobs should be setup to execute mysqldump, compress and upload files

- Montly backup at 00:15 the first of each month. Save 12 backup files.
- Weekly backup at 00:30 the first day of each week. Save 12 backup files.
- Weekdaily backup at 00:15 every day. Max 7 files will exist at any one time.

```
15 00 1 * * nodejs /usr/local/sbin/dlid-backup/db.js --dateformat="YYYY-MM" -z="mysql-backup" -p="{hostname}/mysql/monthly" --keep 12 > /usr/local/sbin/dlid-backup/mysql-monthly.log
30 00 * * 1 nodejs /usr/local/sbin/dlid-backup/db.js --dateformat="YYYY[W]WW" -z="mysql-backup" -p="{hostname}/mysql/weekly" --keep 12 > /usr/local/sbin/dlid-backup/mysql-weekly.log
05 00 * * * nodejs /usr/local/sbin/dlid-backup/db.js --dateformat="ddd" -z="mysql-backup" -p="{hostname}/mysql/weekdaily" > /usr/local/sbin/dlid-backup/mysql-weekdaily.log
