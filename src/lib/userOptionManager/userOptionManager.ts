import { UserOptionManagerInterface } from ".";
import { UserOptionInterface } from "./UserOptionInterface";
import { ParsedCommand } from "../commandManager";
import { ParameterException } from "../../exceptions";

export class UserOptionManager implements UserOptionManagerInterface {

    public resolveFromParsedCommand(options: UserOptionInterface[], cmd: ParsedCommand): { [key: string]: any } {

  //      console.log( options.map(f => f.key) );
//        console.log("Resolve options", cmd);

        let result: any = {};

        options.forEach(o => {
            const definedOption = cmd.options.find(opt => opt.key === o.key);
            if (definedOption) {
                console.log(o.key, "==", definedOption.values);
            } else if (o.defaultValue) {
                console.log(o.key, "==", "(default)", o.defaultValue);
            } else if (o.isRequired) {
                console.error("IS REQUIRED YO!", o.key);
                throw new ParameterException(o.key, null, 'Required');
            }
        });


        return result;
    }

}
