
// import * as mocha from 'mocha';
// import * as chai from 'chai';
// import * as tmp from 'tmp';
// import * as fs from 'fs';
// import { assert } from 'console';
// import { propertyParser } from './propertyParser.class';
// import { ConfigurableSetting, ConfigurableSettingType } from '../types';
// import { DlidBackupConfiguration } from './dlid-backup-configuration.class';
// import { FilesystemCollector, MySqlCollector } from '../collectors';
// import { FileSystemTarget, SynologyFilestationTarget } from '../targets';


// const expect = chai.expect;
// describe('DlidBackupConfiguration normalizeParameters', () => {

//     let configurables = [
//         new FilesystemCollector(),
//         new MySqlCollector(),
//         new SynologyFilestationTarget(),
//         new FileSystemTarget()
//     ]

//     function create(...args: string[]) {
//         return new DlidBackupConfiguration(configurables, args);
//     }

//     it('Normalize -hej' , async () => {
//         const c = create(null,null,'run', '-hej')
//             .parseArguments();

//         expect(c).lengthOf(1);
//         expect(c[0]).equal('-hej');
//     });

//   it('Normalize /s=mysql' , async () => {
  
//     const c = create(null,null,'run', '/s=mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Normalize /s mysql' , async () => {
  
//     const c = create(null,null,'run', '/s', 'mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });


//   it('Normalize /s="some test"' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/s=some test')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('some test');
//   });

//   it('Normalize /s:"some test"' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/s:some test')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('some test');
//   });


//   it('Normalize /s "some test"' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/s', 'some test')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('some test');
//   });


//   it('Normalize /source=mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/source=mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Normalize /source mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/source', 'mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Normalize /source mysql -s hello' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '/source', 'mysql', '-s', 'hello')
//         .parseArguments();

//     expect(c).lengthOf(4);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//     expect(c[2]).equal('--source');
//     expect(c[3]).equal('hello');
//   });


//   it('Normalize -s=mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '-s=mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Normalize -s:mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '-s:mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Normalize -s mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '-s', 'mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });


//   it('Normalize --source=mysql' , async () => {
//     // cmd line argument /s="some test" will become the string '/s=some test' in argv
//     const c = create(null,null,'run', '--source=mysql')
//         .parseArguments();

//     expect(c).lengthOf(2);
//     expect(c[0]).equal('--source');
//     expect(c[1]).equal('mysql');
//   });

//   it('Ignore unknown --test=mysql' , async () => {
//     const c = create(null,null,'run', '--test=mysql')
//         .parseArguments();

//     expect(c).lengthOf(1);
//     expect(c[0]).equal('--test=mysql');
//   });

//   it('Ignore unknown - when starting with known --sourcea=mysql' , async () => {
//     const c = create(null,null,'run', '--sourcea=mysql')
//         .parseArguments();

//     expect(c).lengthOf(1);
//     expect(c[0]).equal('--sourcea=mysql');
//   });


//   it('Ignore short - when also including more characters -sap=mysql' , async () => {
//     const c = create(null,null,'run', '-sap=mysql')
//         .parseArguments();

//     expect(c).lengthOf(1);
//     expect(c[0]).equal('-sap=mysql');
//   });

//   it('Parse Command -s=mysql' , async () => {
//     const c = create(null,null,'run', '-s=mysql');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

// ///    console.log(commands);
    
//     expect(commands).lengthOf(1);
//     expect(commands[0].commandLongName).equal("source");
//     expect(commands[0].options).lengthOf(0);
//     expect(commands[0].parameters).lengthOf(1);
//     expect(commands[0].parameters[0]).equal('mysql');

//   });

//   it('Parse Command -s=mysql /s.attr 5' , async () => {
//     const c = create(null,null,'run', '-s=mysql', '/s.attr', '5');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

// ///    console.log(commands);
    
//     expect(commands).lengthOf(1);
//     expect(commands[0].commandLongName).equal("source");
//     expect(commands[0].options).lengthOf(1);
//     const attr = commands[0].options.find(f => f.key === 'attr');
//     expect(attr).not.undefined;
//     expect(attr.values).lengthOf(1);
//     expect(attr.values[0]).equal('5');
    
//     expect(commands[0].parameters).lengthOf(1);
//     expect(commands[0].parameters[0]).equal('mysql');

//   });

//   it('Parse Command -s=mysql /s.attr 5 /s.attr 12' , async () => {
//     const c = create(null,null,'run', '-s=mysql', '/s.attr', '5', '/s.attr', '12');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

// ///    console.log(commands);
    
//     expect(commands).lengthOf(1);
//     expect(commands[0].commandLongName).equal("source");
//     expect(commands[0].options).lengthOf(1);
//     const attr = commands[0].options.find(f => f.key === 'attr');
//     expect(attr).not.undefined;
//     expect(attr.values).lengthOf(2);
//     expect(attr.values[0]).equal('5');
//     expect(attr.values[1]).equal('12');
    
//     expect(commands[0].parameters).lengthOf(1);
//     expect(commands[0].parameters[0]).equal('mysql');

//   });

//   it('Parse Command -s=mysql /s.attr 5 12' , async () => {
//     const c = create(null,null,'run', '-s=mysql', '/s.attr', '5', '12');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

//     expect(commands).lengthOf(1);
//     expect(commands[0].commandLongName).equal("source");
//     expect(commands[0].options).lengthOf(1);

//     const attr = commands[0].options.find(f => f.key === 'attr');
//     expect(attr).not.undefined;
//     expect(attr.values).lengthOf(2);
//     expect(attr.values[0]).equal('5');
//     expect(attr.values[1]).equal('12');
    
//     expect(commands[0].parameters).lengthOf(1);
//     expect(commands[0].parameters[0]).equal('mysql');

//   });

//   it('Parse Command -s=mysql /target filesystem' , async () => {
//     const c = create(null,null,'run', '-s=mysql', '/target', 'filesystem');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

//     expect(commands).lengthOf(2);
//     expect(commands[0].commandLongName).equal("source");
//     expect(commands[1].commandLongName).equal("target");

//     expect(commands[0].options).lengthOf(0);
//     expect(commands[1].options).lengthOf(0);

//     expect(commands[0].parameters).lengthOf(1);
//     expect(commands[0].parameters[0]).equal('mysql');

//     expect(commands[1].parameters).lengthOf(1);
//     expect(commands[1].parameters[0]).equal('filesystem');

//   });

//   it('Parse Command Expect one command /w 2 parameters -s=mysql username@password:localhost:1604' , async () => {
//     const c = create(null,null,'run', '-s=mysql', 'username@password:localhost:1604');
//     const args = c.parseArguments();
//     const commands = c.parseCommands(args);

//     expect(commands).lengthOf(1);
//     expect(commands[0].parameters).lengthOf(2);
//     expect(commands[0].parameters[0]).equal('mysql');
//     expect(commands[0].parameters[1]).equal('username@password:localhost:1604');

//   });

//   it('Parse Command - error when setting option for unspecified target' , async () => {
//     const c = create(null,null,'run', '-s=glob', '-s.glob=C:\\ost\\**\\*.js', '/t.a=ost');
//     const args = c.parseArguments();

//     expect(() => c.parseCommands(args)).to.throw("Option specified for non-initialized target")

//   });

// });
