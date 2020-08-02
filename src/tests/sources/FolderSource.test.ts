import { FolderCollector, FolderSourceOptions } from './../../collectors/folder/FolderCollector';
import "reflect-metadata"; 
import { InitializeDependencyInjection } from "../../lib";
import { container } from "tsyringe";


import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { logger, LogLevel } from "../../util";
import { Archive } from '../../archive/Archive';
import path = require('path');


const expect = chai.expect;
describe('FolderSource', async () => {

     logger.setLogLevel(LogLevel.None);

     let addedFolders: { [key: string]: string} = {};

    /**
     * Prepare for each test
     */
     function setup(beforeCreatingFolderSource?: () =>  void): { folderSource: FolderCollector, archive: Archive } {
        container.clearInstances();
        InitializeDependencyInjection();
        addedFolders = {};
        const archive = TypeMoq.Mock.ofType(Archive);
        archive.setup(x => x.addLocalFolder(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
        .returns((a,b) => {
            addedFolders[a] = b;
            return;
        });

        if (beforeCreatingFolderSource) {
            beforeCreatingFolderSource();
        }

        const folderSource = container.resolve("FolderCollector") as FolderCollector;
        return { folderSource: folderSource, archive: archive.target };

     }


    it('Basic add folder' , async () => {
        const tst = setup();
        
        await tst.folderSource.collect({
            folder: ['C:\\my\\folder'],
        } as FolderSourceOptions, {
            archive: tst.archive
        });

        expect(addedFolders['C:\\my\\folder']).equal('\\folder');

      //  console.log("c", addedFiles);
        
    });

    it('Basic add folder custom zip folder' , async () => {
        const tst = setup();

        const options = tst.folderSource.options;

        expect(options).lengthOf(1);
        
        await tst.folderSource.collect({
            folder: ['@hello(C:\\my\\folder)'],
        } as FolderSourceOptions, {
            archive: tst.archive
        });

        expect(addedFolders['C:\\my\\folder']).equal('\\hello');

      //  console.log("c", addedFiles);
        
    });

});