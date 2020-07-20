import { GenericClassDecorator } from "./GenericClassDecorator";
import { Type } from "typescript";

export const Injectable = () : GenericClassDecorator<Type> => {
    return (target: Type) => {
        console.log("OK STORE", target);
      // do something with `target`, e.g. some kind of validation or passing it to the Injector and store them
    };
};
