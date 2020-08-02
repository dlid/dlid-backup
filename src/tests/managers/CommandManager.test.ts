import "reflect-metadata"; 
import { CommandManagerInterface } from '../../lib';
import { InitializeDependencyInjection } from "../../lib";
import { container } from "tsyringe";
InitializeDependencyInjection();

import globby = require('globby');
import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { Logger, logger, LogLevel } from "../../util";


const expect = chai.expect;
describe('CommandManager', async () => {

     logger.setLogLevel(LogLevel.None);
    

    it('Set Command should overwrite available commands' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longo', shortName: 'l', name: 'LongTest'
        });

        expect(cmdManager.getAll()).lengthOf(1);
        expect(cmdManager.getAll().find(f => f.longName === 'longo')).not.undefined;

        cmdManager.setCommands({
            longName: 'longo2', shortName: 'a', name: 'LongTest2'
        });

        expect(cmdManager.getAll()).lengthOf(1);
        expect(cmdManager.getAll().find(f => f.longName === 'longo2')).not.undefined;

    });

    it('Get by long name' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longo', shortName: 'l', name: 'LongTest'
        });

        expect(cmdManager.getByLongName('longo')).not.undefined;
        expect(cmdManager.getByLongName('longo2')).to.be.undefined;
    });

    it('Get by long name (no value)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longo', shortName: 'l', name: 'LongTest'
        });

        expect(cmdManager.getByLongName(undefined)).to.be.undefined;
        expect(cmdManager.getByLongName('')).to.be.undefined;
    });

    it('Get by short name' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longo', shortName: 'l', name: 'LongTest'
        });

        expect(cmdManager.getByShortName('l')).not.undefined;
        expect(cmdManager.getByShortName('longo2')).to.be.undefined;
    });

    it('Get by short name (no value)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longo', shortName: 'l', name: 'LongTest'
        });

        expect(cmdManager.getByShortName(undefined)).to.be.undefined;
        expect(cmdManager.getByShortName('')).to.be.undefined;
    });

    it('Parse simple command (--longname)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['--longname']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('longname');
        expect(cmd.options).lengthOf(0);
        expect(cmd.parameters).lengthOf(0);

    });

    it('Parse simple command with parameters (--longname some argument)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['--longname', 'param1', 'param 2']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('longname');
        expect(cmd.options).lengthOf(0);
        expect(cmd.parameters).lengthOf(2);
        expect(cmd.parameters[0]).equal('param1');
        expect(cmd.parameters[1]).equal('param 2');

    });

    it('Parse simple command with options (--longname --longname.size 5)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['--longname', '--longname.size', '5']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('longname');
        expect(cmd.options).lengthOf(1);
        expect(cmd.options[0].values).lengthOf(1);
        expect(cmd.options[0].values[0]).equal('5');

    });

    it('Parse simple command with multiple values in option (--longname --longname.size 5 12)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['--longname', '--longname.size', '5', '12']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('longname');
        expect(cmd.options).lengthOf(1);
        expect(cmd.options[0].values).lengthOf(2);
        expect(cmd.options[0].values[0]).equal('5');
        expect(cmd.options[0].values[1]).equal('12');

    });

    it('Parse simple command with multiple values in separate options (--longname --longname.size 5 --longname.size 12)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['--longname', '--longname.size', '5', '--longname.size', '12']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('longname');
        expect(cmd.options).lengthOf(1);
        expect(cmd.options[0].values).lengthOf(2);
        expect(cmd.options[0].values[0]).equal('5');
        expect(cmd.options[0].values[1]).equal('12');

    });

    it('Error when setting command with long shortName' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        expect(() => {
            cmdManager.setCommands({
                longName: 'longname', shortName: 'hello', name: 'LongTest'
            });
        }).throw("Command shortName must not be longer than 1 character");

       


    });

    it('Parse cmd1, cmd2 then cmd1.option' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands(
            {longName: 'cmd1', shortName: '1', name: 'Command 1'},
            {longName: 'cmd2', shortName: '1', name: 'Command 1'}
        );

        const parsed = cmdManager.parseFromCommandLineParameters(['--cmd1', '--cmd1.size', '5', '12', '--cmd2', '--cmd2.option', 'hi', '--cmd1.extra', 'world']);
  

        let cmd = parsed.find(c => c.commandLongName === 'cmd1');
        expect(cmd).not.undefined;
        expect(cmd.commandLongName).equal('cmd1');
        expect(cmd.options).lengthOf(2);
        expect(cmd.options[0].key).equal('size');
        expect(cmd.options[0].values).lengthOf(2);
        expect(cmd.options[0].values[0]).equal('5');
        expect(cmd.options[0].values[1]).equal('12');
        expect(cmd.options[1].key).equal('extra');
        expect(cmd.options[1].values).lengthOf(1);
        expect(cmd.options[1].values[0]).equal('world');

        cmd = parsed.find(c => c.commandLongName === 'cmd2');
        expect(cmd.commandLongName).equal('cmd2');
        expect(cmd.options).lengthOf(1);
        expect(cmd.options[0].key).equal('option');
        expect(cmd.options[0].values).lengthOf(1);
        expect(cmd.options[0].values[0]).equal('hi');

    });

    it('Throw error for non-initialized option' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        expect(() => {
            const parsed = cmdManager.parseFromCommandLineParameters(['--longname.size', '5', '12']);
        }).throw("Option specified for non-initialized longname");
    });

    it('Throw error for non-existing command' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;
        expect(() => {
            const parsed = cmdManager.parseFromCommandLineParameters(['--nonexisting', 'test']);
        }).throw("Unknown parameter --nonexisting");
    });

    it('Parse should not recognize short commands (-l)' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands({
            longName: 'longname', shortName: 'l', name: 'LongTest'
        });

        const parsed = cmdManager.parseFromCommandLineParameters(['-l']);

        const cmd = parsed.find(c => c.commandLongName === 'longname');
        expect(cmd).to.be.undefined;

    });

    it('Find by short name' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands(
            {longName: 'cmd1', shortName: '1', name: 'Command 1'}
        );

        expect(cmdManager.find('-1')).not.undefined;
        expect(cmdManager.find('/1')).not.undefined;
        expect(cmdManager.find('1')).not.undefined;

    });

    it('Find by long name' , async () => {
        const cmdManager = container.resolve("CommandManagerInterface") as CommandManagerInterface;

        cmdManager.setCommands(
            {longName: 'cmd1', shortName: '1', name: 'Command 1'}
        );

        expect(cmdManager.find('--cmd1')).not.undefined;
        expect(cmdManager.find('/cmd1')).not.undefined;
        expect(cmdManager.find('cmd1')).not.undefined;

    }); 

});