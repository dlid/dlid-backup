import { CollectorArguments } from './CollectorArguments.interface';
import { UserOptionInterface } from '../lib';

export abstract class CollectorBase<T>  {
  
  public abstract name: string;

  public abstract description: string;

  public abstract options?: UserOptionInterface[]

  abstract async collect(config: T, args: CollectorArguments);

}
