// import { Type } from "typescript";

// export const IoC = new class {
//     // Injector implementation
//     public get<T>(target: any) {
//         let tokens = Reflect.getMetadata('design:paramtypes', target) || [],
//         injections = tokens.map(token => IoC.get<any>(token));
        
//         console.log("get?", target, tokens, injections);

//         return new target(...injections);
//     }

//     private 

//     public set(name: string, obj: object) {

//     }

// };