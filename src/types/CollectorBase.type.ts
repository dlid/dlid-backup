//var AdmZip = require('adm-zip');
import * as AdmZip from 'adm-zip';
import { Archive } from '../archive/Archive';
import { CollectorArguments } from './CollectorArguments.interface';


export abstract class CollectorBase  {
  
  public abstract description: string;

  abstract async collect(args: CollectorArguments);

}

