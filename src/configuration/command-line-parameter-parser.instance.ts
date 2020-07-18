import { Configurable } from "../types";
import { CollectorBase } from "../types/CollectorBase.type";
import { TargetBase } from "../types/TargetBase.type";
import { logger, Logger } from '../util/logger';

/**
 * Responsible for extracting command line parameters for the given type (-s or -t)

 */
class CommandLineParameterParser {

  private log: Logger;

  constructor() {
      this.log = logger.child('ConfigArgParser');
  }

  private escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  public extractArguments(shortPrefix: string, longPrefix: string, args: string[], configurables: Configurable[], expectedType: any): { [key: string]: any } {

    this.log.debug(`Looking for parameter -${shortPrefix}|--${longPrefix} using registered types ${ configurables.map(f => f.name).join(', ') }`);

    const short = this.escapeRegExp(shortPrefix);
    const long = this.escapeRegExp(longPrefix);
    const settings: any = {};
    let collectorName = "";
    let remainingArguments = [];
    let configExists = false;

    console.log("parsing");
  console.log(args);

    args.forEach((f, ix) => {
      
      const m = f.match(`^(-${short}|--${long})([\\.:])([a-z0-9-]+)(?:=?(.*|$))`);
      
      if (m) {
        const isSelector = m[2] === ':';
        const name = m[3];
        const identifier = `${m[1]}${m[2]}${m[3]}`;
        this.log.debug(`[${identifier}] Analyzing parameter`, ix)
        
        if (isSelector) {
          this.log.debug(`[${identifier}] is a Type Selector`, f)
          const exists = configurables.find(f => f.name === name && f instanceof expectedType);
          collectorName = name;
          if (exists) {
            configExists = true;
          }
        } else {
          this.log.debug(`[${identifier}] is a Value`, m[4])
          if (settings[name]) {
            this.log.debug(`[${identifier}] has already been added`, name)
            if (!settings['__multi']) {
              settings['__multi'] = {};
            }
            if(!settings['__multi'][name]) {
              settings['__multi'][name] = [settings[name]];
            }
            settings['__multi'][name].push(m[4]);
            this.log.debug(`[${identifier}] Multivalue was updated`, settings['__multi'][name]);
          } else {
            this.log.debug(`[${identifier}] Single value added`, m[4])
            settings[name] = m[4];
          }
        }
      } else {
        remainingArguments.push(f);
      }

    });

    console.log(collectorName, settings);

    return { collectorName, settings, remainingArguments, configExists };

  }



}

const commandLineParser = new CommandLineParameterParser();
export { commandLineParser };

