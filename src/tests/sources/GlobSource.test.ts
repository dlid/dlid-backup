import { ParsedCommand } from './../../lib/commandManager/ParsedCommand.interface';
import { UserOptionManagerInterface } from './../../lib/userOptionManager/userOptionManagerInterface';
import { FileManagerInterface } from './../../lib/fileManager';
import { TargetResultInterface } from './../../lib/targetManager/TargetResultInterface';
import { GlobSourceOptions } from './../../collectors/glob/GlobCollector';
import { GlobCollector } from '../../collectors/glob/GlobCollector';
import "reflect-metadata"; 
import { CommandManagerInterface } from '../../lib';
import { InitializeDependencyInjection } from "../../lib";
import { container } from "tsyringe";


import globby = require('globby');
import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { Logger, logger, LogLevel } from "../../util";
import { Archive } from '../../archive/Archive';
import { pathToFileURL } from 'url';
import path = require('path');
import { toNamespacedPath } from 'path';


const expect = chai.expect;
describe('GlobSource', async () => {

     logger.setLogLevel(LogLevel.None);

     let addedFiles: { [key: string]: string} = {};

    /**
     * Prepare for each test
     */
     function setup(files: { [pattern: string]: string[] }, beforeCreatingGlobSource?: () =>  void): { globSource: GlobCollector, archive: Archive } {
        container.clearInstances();
        InitializeDependencyInjection();
        addedFiles = {};
        const archive = TypeMoq.Mock.ofType(Archive);
        archive.setup(x => x.addLocalFile(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
        .returns((a,b) => {
            addedFiles[a] = b;
            return;
        });

        const fileManager = TypeMoq.Mock.ofType<FileManagerInterface>();
        fileManager.setup(x => x.glob(TypeMoq.It.isAny()))
        .returns(async globPattern => {
            return Promise.resolve(files[globPattern]);
        });
        fileManager.setup(x => x.getDirectoryName(TypeMoq.It.isAny()))
        .returns(p => {
            return path.dirname(p);
        });
        fileManager.setup(x => x.getBasename(TypeMoq.It.isAny()))
        .returns(p => {
            return path.basename(p);
        })
        fileManager.setup(x => x.join(TypeMoq.It.isAny()))
        .returns((...p: string[]) => {
            return path.join.apply(path, p);
        });
        container.registerInstance("FileManagerInterface", fileManager.target);

        if (beforeCreatingGlobSource) {
            beforeCreatingGlobSource();
        }

        const globSource = container.resolve("GlobCollector") as GlobCollector;
        return { globSource: globSource, archive: archive.target };

     }


    it('Basic add and find target folder name automatically' , async () => {
        const tst = setup(
            {
                './**/**.txt': [ 'C:\\files\\file1.txt', 'C:\\files\\hello\\file1.txt']
            }
        );
        
        await tst.globSource.collect({
            pattern: ['./**/**.txt'],
        } as GlobSourceOptions, {
            archive: tst.archive
        });

        expect(addedFiles['C:\\files\\file1.txt']).equal('\\files\\file1.txt');
        expect(addedFiles['C:\\files\\hello\\file1.txt']).equal('\\files\\hello\\file1.txt');

      //  console.log("c", addedFiles);
        
    });

    it('Basic add multiple globs and find target folder name automatically' , async () => {
        const tst = setup(
            {
                './**/**.txt': [ 'C:\\files\\file1.txt', 'C:\\files\\hello\\file1.txt'],
                './**/**.js': [ 'F:\\src\\file1.js', 'F:\\file2.js']
            }
        );
        
        await tst.globSource.collect({
            pattern: ['./**/**.txt', './**/**.js'],
        } as GlobSourceOptions, {
            archive: tst.archive
        });

        // Common path is "files"
         expect(addedFiles['C:\\files\\file1.txt']).equal('\\files\\file1.txt');
         expect(addedFiles['C:\\files\\hello\\file1.txt']).equal('\\files\\hello\\file1.txt');

        // Common path is "f"
        expect(addedFiles['F:\\src\\file1.js']).equal('\\F\\src\\file1.js');
        expect(addedFiles['F:\\file2.js']).equal('\\F\\file2.js');

    });

    it('Basic add Single file match' , async () => {
        const tst = setup(
            {
                './**/**.txt': [ '/var/etc/cfg/configfiles/setup.json'],
            }
        );
        
        await tst.globSource.collect({
            pattern: ['./**/**.txt'],
        } as GlobSourceOptions, {
            archive: tst.archive
        });

         expect(addedFiles['/var/etc/cfg/configfiles/setup.json']).equal('\\configfiles\\setup.json');
    });

    it('Basic add Single file match and custom target folder' , async () => {
        const tst = setup(
            {
                './**/**.txt': [ '/var/etc/cfg/configfiles/setup.json'],
            }
        );
        
        await tst.globSource.collect({
            pattern: ['@folder1(./**/**.txt)'],
        } as GlobSourceOptions, { 
            archive: tst.archive
        });

         expect(addedFiles['/var/etc/cfg/configfiles/setup.json']).equal('\\folder1\\setup.json');
    });

    it('Basic add multiple file match and custom target folder' , async () => {
        const tst = setup(
            {
                './**/**.txt': [ 
                    '/var/etc/cfg/configfiles/setup.json',
                    '/var/etc/cfg/configfiles/childfolder/setup2.json'
                ],
            }
        );
        
        await tst.globSource.collect({
            pattern: ['@folder1(./**/**.txt)'],
        } as GlobSourceOptions, { 
            archive: tst.archive
        });

         expect(addedFiles['/var/etc/cfg/configfiles/setup.json']).equal('\\folder1\\setup.json');
         expect(addedFiles['/var/etc/cfg/configfiles/childfolder/setup2.json']).equal('\\folder1\\childfolder\\setup2.json');

    });

    it('Prepare command parameters as glob pattern' , async () => {
        

        const prepared: { optionName: string, value: string }[] = [];
        const mock = TypeMoq.Mock.ofType<UserOptionManagerInterface>();
        mock.setup(m => m.addOptionValue(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((a: ParsedCommand, optionName: string, optionValue: string) => {
            prepared.push({
                optionName: optionName,
                value: optionValue
            });
        });

        const tst = setup({}, () => {
            container.registerInstance("UserOptionManagerInterface", mock.target);
        });

        expect(tst.globSource.options?.length).greaterThan(0);
        

        const cmd = {
            commandLongName: 'name',
            options: [],
            parameters: ['glob', '/var/*.txt']
        } as ParsedCommand;

        tst.globSource.prepareParsedCommand(cmd);

        expect(prepared.find(o => o.optionName === 'pattern' && o.value === '/var/*.txt')).not.undefined;
        
        console.log(prepared);

    });

    it('Prepare undefined parameters' , async () => {
        

        const prepared: { optionName: string, value: string }[] = [];
        const mock = TypeMoq.Mock.ofType<UserOptionManagerInterface>();
        mock.setup(m => m.addOptionValue(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((a: ParsedCommand, optionName: string, optionValue: string) => {
            prepared.push({
                optionName: optionName,
                value: optionValue
            });
        });

        const tst = setup({}, () => {
            container.registerInstance("UserOptionManagerInterface", mock.target);
        });

        const cmd = {
            commandLongName: 'name',
            options: []
        } as ParsedCommand;

        expect(prepared).lengthOf(0);
    });

    it('Prepare empty parameters' , async () => {
        

        const prepared: { optionName: string, value: string }[] = [];
        const mock = TypeMoq.Mock.ofType<UserOptionManagerInterface>();
        mock.setup(m => m.addOptionValue(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((a: ParsedCommand, optionName: string, optionValue: string) => {
            prepared.push({
                optionName: optionName,
                value: optionValue
            });
        });

        const tst = setup({}, () => {
            container.registerInstance("UserOptionManagerInterface", mock.target);
        });

        const cmd = {
            commandLongName: 'name',
            options: [],
            parameters: []
        } as ParsedCommand;

        expect(prepared).lengthOf(0);
    });

    it('Prepare only one (source name) parameters' , async () => {
        

        const prepared: { optionName: string, value: string }[] = [];
        const mock = TypeMoq.Mock.ofType<UserOptionManagerInterface>();
        mock.setup(m => m.addOptionValue(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((a: ParsedCommand, optionName: string, optionValue: string) => {
            prepared.push({
                optionName: optionName,
                value: optionValue
            });
        });

        const tst = setup({}, () => {
            container.registerInstance("UserOptionManagerInterface", mock.target);
        });

        const cmd = {
            commandLongName: 'name',
            options: [],
            parameters: ['glob']
        } as ParsedCommand;

        expect(prepared).lengthOf(0);
    });


});