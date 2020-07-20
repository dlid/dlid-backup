import { UserOptionInterface } from '../userOptionManager/UserOptionInterface';
/**
 * A Command defines a valid command in application arguments 
 */
export interface CommandInterface {
    longName: string;
    shortName: string;
    name: string;
}
