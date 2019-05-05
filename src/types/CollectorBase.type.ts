//var AdmZip = require('adm-zip');
import * as AdmZip from 'adm-zip';
import { Archive } from '../archive/Archive';


export abstract class CollectorBase  {
  
  abstract async collect(archive: Archive, options: any);

}

