import { CollectorArguments } from './CollectorArguments.interface';
import { UserOptionInterface, ParsedCommand } from '../lib';

export abstract class CollectorBase<T>  {
  
  public abstract name: string;

  public abstract description: string;

  public abstract options?: UserOptionInterface[];

  abstract async collect(config: T, args: CollectorArguments); 

  /**
   * Before options are parsed - thhe collector can modify
   *
   * @param {string[]} parameters
   * @returns {{ [key: string]: any }}
   * @memberof CollectorBase
   */
  prepareParsedCommand(command: ParsedCommand): void {
  }
 
}
