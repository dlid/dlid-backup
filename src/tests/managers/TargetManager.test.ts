import "reflect-metadata"; 
import { SourceManagerInterface } from './../../lib/sourceManager/SourceManagerInterface';
import { UserOptionInterface, TargetManagerInterface, TargetResultInterface } from '../../lib';
import { InitializeDependencyInjection } from "../../lib";
import { container, autoInjectable } from "tsyringe";
InitializeDependencyInjection();
import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { logger, LogLevel } from "../../util";
import { CollectorBase, TargetBase, TargetArguments } from '../../types';
import { CollectorArguments } from '../../types/CollectorArguments.interface';
import { SourceResultInterface } from '../../lib/sourceManager/SourceResultInterface';
import { Archive } from '../../archive/Archive';

const expect = chai.expect;
describe('TargetManager', async () => {

    logger.setLogLevel(LogLevel.None);

    @autoInjectable()
    class Dummy extends TargetBase<any> {
        name: string = 'dummy';
        description: string;
        public options?: UserOptionInterface[];
        run(config: any, args: TargetArguments): Promise<TargetResultInterface> {
            return Promise.resolve({readmeLines: ['test']})
        }
        
    }

    @autoInjectable()
    class Dummy2 extends TargetBase<any> {
        name: string = '';
        description: string;
        public options?: UserOptionInterface[];
        run(config: any, args: TargetArguments): Promise<TargetResultInterface> {
            throw new Error("Method not implemented.");
        }

    }

    @autoInjectable()
    class Dummy3 extends TargetBase<any> {
        name: string = 'dummy3';
        description: string;
        public options?: UserOptionInterface[];
        run(config: any, args: TargetArguments): Promise<TargetResultInterface> {
            throw new Error("Method not implemented.");
        }
    }

    @autoInjectable()
    class Dummy4 {

    }

    it('Get target by name' , async () => {
        
        container.registerType("XMock1", Dummy);

        const srcManager = container.resolve("TargetManagerInterface") as TargetManagerInterface;
        srcManager.clear();
        srcManager.add("XMock1");

        expect(srcManager.getAll()).lengthOf(1);
        expect(srcManager.getByName('dummy')).not.undefined;
        
    });

    it('Error if source has no name' , async () => {
        
        container.registerType("XMock2", Dummy2);

        const srcManager = container.resolve("TargetManagerInterface") as TargetManagerInterface;
        srcManager.clear();

        expect(() => {
            srcManager.add("XMock2");
        }).throw(`InjectionToken not found "XMock2"`)
        
    });

    it('Token not found' , async () => {
        
        const srcManager = container.resolve("TargetManagerInterface") as TargetManagerInterface;

        expect(() => {
            srcManager.add("XMockNot");
        }).throw(`InjectionToken not found "XMockNot"`)
        
    });

    
    it('Not CollectorBase' , async () => {
        container.registerType("Mockx", Dummy4); 
        const srcManager = container.resolve("TargetManagerInterface") as TargetManagerInterface;

        expect(() => {
            srcManager.add("Mockx");
        }).throw(`InjectionToken not found "Mockx"`)
        
    });

    
    it('Run source' , async () => {
        const archiveMoq = TypeMoq.Mock.ofType(Archive);

        container.registerType("Dummy", Dummy);

        const mgr = container.resolve("TargetManagerInterface") as TargetManagerInterface;
        mgr.clear();
        mgr.add("Dummy");

        const result = await mgr.runTarget(mgr.getByName('dummy'), [], archiveMoq.target);
        
        expect(result).not.be.undefined;
        expect(result.readmeLines).not.be.undefined;
        expect(result.readmeLines).lengthOf(1);
        expect(result.readmeLines[0]).equal("test");

    });

    it('Run source (failure)' , async () => {
        const archiveMoq = TypeMoq.Mock.ofType(Archive);

        container.registerType("Dummy", Dummy3);

        const mgr = container.resolve("TargetManagerInterface") as TargetManagerInterface;
        mgr.clear();
        mgr.add("Dummy");

        let hasError = false;
      try {
        await mgr.runTarget(mgr.getByName('dummy3'), [], archiveMoq.target);
      } catch (e ) {
          hasError = e.toString().includes('Method not implemented');
      }

      expect(hasError).to.true;

    }); 

    it('Replace existing source' , async () => {
        
        const srcManager = container.resolve("TargetManagerInterface") as TargetManagerInterface;
        srcManager.clear();

        container.registerType("XMock2", Dummy);
        srcManager.add("XMock2");
        expect(srcManager.getAll().filter(f => f.name === 'dummy'));

        container.registerType("XMock2", Dummy3);
        srcManager.add("XMock2");
        srcManager.add("XMock2");
        expect(srcManager.getAll().filter(f => f.name === 'dummy3'));
   
        
    });

  


});