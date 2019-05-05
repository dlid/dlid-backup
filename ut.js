define("src/types/CollectorBase.type", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var CollectorBase = /** @class */ (function () {
        function CollectorBase() {
        }
        return CollectorBase;
    }());
    exports.CollectorBase = CollectorBase;
});
define("src/types/TargetBase.type", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var TargetBase = /** @class */ (function () {
        function TargetBase() {
        }
        return TargetBase;
    }());
    exports.TargetBase = TargetBase;
});
define("src/configuration/ConfigurableArgumentParser", ["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var ConfigurableArgumentParser = /** @class */ (function () {
        function ConfigurableArgumentParser() {
        }
        // constructor(prefixes: string[], configurables: Configurable[], args: string[]) {
        //   let { configName, settings, remainingArguments } = this.extractArguments(prefixes[0], prefixes[1], args, configurables);
        //   console.log( configName, JSON.stringify(settings, null, 2), remainingArguments );
        // }
        ConfigurableArgumentParser.prototype.escapeRegExp = function (text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        };
        ConfigurableArgumentParser.prototype.extractArguments = function (shortPrefix, longPrefix, args, configurables, expectedType) {
            var short = this.escapeRegExp(shortPrefix);
            var long = this.escapeRegExp(longPrefix);
            var settings = {};
            var collectorName = "";
            var remainingArguments = [];
            var configExists = false;
            args.forEach(function (f) {
                var m = f.match("^(-" + short + "|--" + long + ")([\\.:])([a-z0-9-]+)(?:=?(.*|$))");
                if (m) {
                    var isSelector = m[2] === ':';
                    var name_1 = m[3];
                    if (isSelector) {
                        var exists = configurables.find(function (f) { return f.name === name_1 && f instanceof expectedType; });
                        collectorName = name_1;
                        if (exists) {
                            configExists = true;
                        }
                    }
                    else {
                        settings[name_1] = m[4];
                    }
                }
                else {
                    remainingArguments.push(f);
                }
            });
            return { collectorName: collectorName, settings: settings, remainingArguments: remainingArguments, configExists: configExists };
        };
        return ConfigurableArgumentParser;
    }());
    exports.ConfigurableArgumentParser = ConfigurableArgumentParser;
});
define("index", ["require", "exports", "./src/collectors", "./src/targets", "./src/types", "src/configuration/ConfigurableArgumentParser", "src/types/CollectorBase.type", "src/types/TargetBase.type"], function (require, exports, collectors_1, targets_1, types_1, ConfigurableArgumentParser_1, CollectorBase_type_1, TargetBase_type_1) {
    "use strict";
    exports.__esModule = true;
    var fs = require('fs');
    var path = require('path');
    // dlid-backup --job config-files --archive=config-files-{year}W{week}.zip --output weekly/{year}W{week}/ --save 10
    // dlid-backup /s:mysql /s.host=localhost /s.port=3306
    var DlidBackup = /** @class */ (function () {
        function DlidBackup(configurables) {
            this.configurables = configurables;
        }
        /**
        *
        * @param configFilePath
        */
        DlidBackup.prototype.load = function (configFilePath) {
            return new Promise(function (reolve, reject) {
            });
        };
        DlidBackup.prototype.config = function (config) {
        };
        DlidBackup.prototype.help = function () {
            console.log("\ndlid-backup [run|explain]\n -s:<type> --source:<type>               Pick a source to make a backup of (mysql)\n -s.<option>=val --source.<option>=val   Set an option for the source\n -t:<type> --target:<type>               Pick a target where to save the backup\n -t.<option>=val --target.<option>=val   Set an option for the target\n -o=filename.zip                         The filename of the resulting zip archive\n \n dlid-backup -s   To run a guide to create source parameters\n dlid-backup -t   To run a guide to setup target parameters\n dlid-backup -o   To show available macros for output filename\n \n                ");
        };
        DlidBackup.prototype.parseArguments = function () {
            var argparser = new ConfigurableArgumentParser_1.ConfigurableArgumentParser();
            var args = process.argv.slice(2);
            if (args.length === 0) {
                this.help();
                return;
            }
            if (args[0] !== 'explain' && args[0] !== 'run' && args[0] !== 'save') {
                throw new Error('First parameter must be ACTION (run, explain or dry-run)');
            }
            var source = argparser.extractArguments('s', 'source', args, this.configurables, CollectorBase_type_1.CollectorBase);
            if (!source.collectorName) {
                throw new Error("Source is required");
            }
            if (!source.configExists) {
                throw new Error("Source type '" + source.collectorName + "' was not found");
            }
            var target = argparser.extractArguments('t', 'target', source.remainingArguments, this.configurables, TargetBase_type_1.TargetBase);
            if (!target.collectorName) {
                throw new Error("Target is required");
            }
            if (!target.configExists) {
                throw new Error("Target type '" + target.collectorName + "' was not found");
            }
            console.log("source", source);
            console.log("target", target);
            var collector = this.configurables.find(function (cfg) { return cfg.name === source.collectorName; });
            var targetCollector = this.configurables.find(function (cfg) { return cfg.name === target.collectorName; });
            var sourceSettings = this.setupConfigurable(collector, source.settings);
            var targetSettings = this.setupConfigurable(targetCollector, target.settings);
            var errors = this.verifyRequiredSettings(collector, sourceSettings);
            errors.concat(this.verifyRequiredSettings(targetCollector, targetSettings));
            if (errors.length > 0) {
                console.log("\n\n\u001B[31m" + errors.join('\n') + "\u001B[0m\n\n");
                throw new Error("Configuration error");
            }
            console.log(errors);
            console.log(collector.explain(sourceSettings));
            console.log(targetCollector.explain(targetSettings));
        };
        DlidBackup.prototype.verifyRequiredSettings = function (cfg, settings) {
            var options = cfg.getOptions();
            var errors = [];
            options.forEach(function (op) {
                if (op.isRequired && typeof settings[op.key] === 'undefined') {
                    var type = cfg instanceof CollectorBase_type_1.CollectorBase ? '-s' : '-t';
                    errors.push("[" + cfg.name + "] option '" + type + "." + op.key + "' is required ");
                }
            });
            return errors;
        };
        DlidBackup.prototype.setupConfigurable = function (cfg, settings) {
            var _this = this;
            var options = cfg.getOptions();
            var keys = Object.keys(settings);
            var result = {};
            keys.forEach(function (propertyName) {
                var property = options.find(function (option) { return option.key === propertyName; });
                if (property) {
                    var prop = _this.parseProperty(cfg.name, propertyName, property, settings[propertyName]);
                    if (prop.error) {
                        throw new Error(prop.error);
                    }
                    result[propertyName] = prop.value;
                }
                else {
                    throw new Error("unknown property " + propertyName);
                }
            });
            options.forEach(function (op) {
                if (typeof result[op.key] === 'undefined') {
                    if (typeof op.defaultValue !== 'undefined') {
                        result[op.key] = op.defaultValue;
                    }
                }
            });
            return result;
        };
        DlidBackup.prototype.typeToSting = function (type) {
            switch (type) {
                case types_1.ConfigurableSettingType.StringArray:
                    return 'string[]';
                case types_1.ConfigurableSettingType.String:
                    return 'string';
                case types_1.ConfigurableSettingType.Int:
                    return 'int';
                case types_1.ConfigurableSettingType.IntArray:
                    return 'int[]';
                case types_1.ConfigurableSettingType.FilePath:
                    return 'filepath';
                case types_1.ConfigurableSettingType.FolderPath:
                    return 'folderpath';
                default:
                    return 'unknown';
            }
        };
        DlidBackup.prototype.parseProperty = function (configurableName, propertyName, prop, originalValue) {
            var parsedValue = null;
            switch (prop.type) {
                case types_1.ConfigurableSettingType.String:
                    parsedValue = this.parseAsString(originalValue);
                    break;
                case types_1.ConfigurableSettingType.Int:
                    parsedValue = this.parseAsInt(originalValue);
                    break;
                case types_1.ConfigurableSettingType.StringArray:
                    parsedValue = this.parseAsStringArray(originalValue);
                    break;
                case types_1.ConfigurableSettingType.FilePath:
                    parsedValue = this.parseAsFilePath(originalValue);
                    break;
                case types_1.ConfigurableSettingType.FolderPath:
                    parsedValue = this.parseAsFolderPath(originalValue);
                    break;
                default:
                    parsedValue.error = propertyName + " Property type '" + this.typeToSting(prop.type) + "' is not implemented";
                    break;
            }
            var value = parsedValue.value;
            var error = parsedValue.error;
            return { value: value, error: error };
        };
        DlidBackup.prototype.parseAsString = function (val) {
            var error = '';
            var value = null;
            if (typeof val === 'undefined' || val === null) {
                value = '';
            }
            else {
                value = val.toString();
            }
            return { error: error, value: value };
        };
        DlidBackup.prototype.parseAsFilePath = function (val) {
            var error = '';
            var value = null;
            if (typeof val === 'undefined' || val === null) {
                value = '';
            }
            var tries = [path.resolve(val)];
            tries.push(path.join(__dirname, val));
            for (var i = 0; i < tries.length; i++) {
                try {
                    if (fs.existsSync(tries[i])) {
                        value = tries[i];
                        break;
                    }
                }
                catch (err) {
                    console.error(err);
                }
            }
            if (!value) {
                error = 'Could not find file ' + val;
            }
            return { error: error, value: value };
        };
        DlidBackup.prototype.parseAsFolderPath = function (val) {
            var error = '';
            var value = null;
            if (typeof val === 'undefined' || val === null) {
                value = '';
            }
            var tries = [path.resolve(val)];
            tries.push(path.join(__dirname, val));
            for (var i = 0; i < tries.length; i++) {
                try {
                    fs.statSync(tries[i]);
                    value = tries[i];
                    break;
                }
                catch (err) {
                    console.error(err);
                }
            }
            if (!value) {
                error = 'Could not find folder ' + val;
            }
            return { error: error, value: value };
        };
        DlidBackup.prototype.parseAsStringArray = function (val) {
            var error = '';
            var value = null;
            var m = val.match(/^(.) /);
            var separator = ',';
            if (m) {
                separator = m[1];
                val = val.substring(m[0].length);
            }
            value = val.split(separator).map(function (f) { return f.trim(); }).filter(function (f) { return f; });
            return { error: error, value: value };
        };
        DlidBackup.prototype.parseAsInt = function (val) {
            var error = '';
            var value = null;
            if (typeof val === 'undefined' || val === null) {
                error = 'no value';
            }
            if (val.toString().match(/^\d+$/)) {
                value = parseInt(val, 10);
            }
            else {
                error = 'Invalid int: ' + val.toString();
            }
            return { error: error, value: value };
        };
        return DlidBackup;
    }());
    var bak = new DlidBackup([new collectors_1.FolderCollector(), new collectors_1.MySqlCollector(), new targets_1.FileSystemTarget()]);
    bak.parseArguments();
});
// .then()
// .catch(err => err)
