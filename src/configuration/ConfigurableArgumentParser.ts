import { Configurable } from "../types";
import { CollectorBase } from "../types/CollectorBase.type";
import { TargetBase } from "../types/TargetBase.type";

export class ConfigurableArgumentParser {
  // constructor(prefixes: string[], configurables: Configurable[], args: string[]) {

  //   let { configName, settings, remainingArguments } = this.extractArguments(prefixes[0], prefixes[1], args, configurables);

  //   console.log( configName, JSON.stringify(settings, null, 2), remainingArguments );


  // }

  private escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  }

  public extractArguments(shortPrefix: string, longPrefix: string, args: string[], configurables: Configurable[], expectedType: any) {

    const short = this.escapeRegExp(shortPrefix);
    const long = this.escapeRegExp(longPrefix);
    const settings: any = {};
    let collectorName = "";
    let remainingArguments = [];
    let configExists = false;
  

    args.forEach(f => {
      
      const m = f.match(`^(-${short}|--${long})([\\.:])([a-z0-9-]+)(?:=?(.*|$))`);
      
      if (m) {
        const isSelector = m[2] === ':';
        const name = m[3];
        
        if (isSelector) {
          const exists = configurables.find(f => f.name === name && f instanceof expectedType);
          collectorName = name;
          if (exists) {
            configExists = true;
          }
        } else {
          settings[name] = m[4];
        }
      } else {
        remainingArguments.push(f);
      }

    });

    return { collectorName, settings, remainingArguments, configExists };

  }



}

