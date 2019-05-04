# dlid-backup
Backup scripts to dump database, zip and upload to a firestore

- A Collector is used to gather data to be backed up from the Source
- A Target is defined to tell where the data should be stored
- The Output will be a ZIP file stored in the *Target* location

```
dlid-backup 
 -s:COLLECTOR_TYPE 
 [-s.COLLECTOR_PROPERTY=value]...
 -t:TARGET_TYPE 
 [-s.TARGET_PROPERTY=value]...
 -o ZIP_FILENAME.zip
```


```

dlid-backup
 -s:mysql                        # We want to make a MySQL backup
 -s.host=localhost               # from a local server
 -s.include=wp_*                 # of all databases starting with wp_*
 -t:filesystem                   # Save the backup in the local filesystem
 -t.path=/usr/david/bak          # in this folder
 -o={year}-{month}-{date}-wp.zip # with this filename {these} values are macros
```

## Collector

A collector is used to gather data/files and put it inside a zip archive

## Target

A Target is where the Collected zip file should be stored

### Firebase target

### Firebase key
Download from [Firebase console](https://console.firebase.google.com/project/dlid-backup/settings/serviceaccounts/adminsdk)

-----------------------------------

## db.js

- `--dateformat` moment.js date format. Will be prefix to filenames (zip file and database sql file names)
- `--p` destination FOLDER In firestore. Use {hostname} for current computer name
- `--keep` After upload only this many files in firestore are saved
- `-z` Zip file name. dateformat will be prepended

System databases are ignored (`const exclude = ['mysql','performance_schema','sys', 'information_schema'];` line 64)

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
```