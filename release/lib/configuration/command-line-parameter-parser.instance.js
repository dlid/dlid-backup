"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandLineParser = void 0;
const logger_1 = require("../util/logger");
/**
 * Responsible for extracting command line parameters for the given type (-s or -t)

 */
class CommandLineParameterParser {
    constructor() {
        this.log = logger_1.logger.child('ConfigArgParser');
    }
    escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
    extractArguments(shortPrefix, longPrefix, args, configurables, expectedType) {
        this.log.debug(`Looking for parameter -${shortPrefix}|--${longPrefix} using registered types ${configurables.map(f => f.name).join(', ')}`);
        const short = this.escapeRegExp(shortPrefix);
        const long = this.escapeRegExp(longPrefix);
        const settings = {};
        let collectorName = "";
        let remainingArguments = [];
        let configExists = false;
        args.forEach((f, ix) => {
            const m = f.match(`^(-${short}|--${long})([\\.:])([a-z0-9-]+)(?:=?(.*|$))`);
            if (m) {
                const isSelector = m[2] === ':';
                const name = m[3];
                const identifier = `${m[1]}${m[2]}${m[3]}`;
                this.log.debug(`[${identifier}] Analyzing parameter`, ix);
                if (isSelector) {
                    this.log.debug(`[${identifier}] is a Type Selector`, f);
                    const exists = configurables.find(f => f.name === name && f instanceof expectedType);
                    collectorName = name;
                    if (exists) {
                        configExists = true;
                    }
                }
                else {
                    this.log.debug(`[${identifier}] is a Value`, m[4]);
                    if (settings[name]) {
                        this.log.debug(`[${identifier}] has already been added`, name);
                        if (!settings['__multi']) {
                            settings['__multi'] = {};
                        }
                        if (!settings['__multi'][name]) {
                            settings['__multi'][name] = [settings[name]];
                        }
                        settings['__multi'][name].push(m[4]);
                        this.log.debug(`[${identifier}] Multivalue was updated`, settings['__multi'][name]);
                    }
                    else {
                        this.log.debug(`[${identifier}] Single value added`, m[4]);
                        settings[name] = m[4];
                    }
                }
            }
            else {
                remainingArguments.push(f);
            }
        });
        return { collectorName, settings, remainingArguments, configExists };
    }
}
const commandLineParser = new CommandLineParameterParser();
exports.commandLineParser = commandLineParser;
