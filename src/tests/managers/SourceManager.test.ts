import "reflect-metadata"; 
import { SourceManagerInterface } from './../../lib/sourceManager/SourceManagerInterface';
import { UserOptionInterface } from '../../lib';
import { InitializeDependencyInjection } from "../../lib";
import { container, autoInjectable } from "tsyringe";
InitializeDependencyInjection();
import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { logger, LogLevel } from "../../util";
import { CollectorBase } from '../../types';
import { CollectorArguments } from '../../types/CollectorArguments.interface';
import { SourceResultInterface } from '../../lib/sourceManager/SourceResultInterface';
import { Archive } from '../../archive/Archive';

const expect = chai.expect;
describe('SourceManager', async () => {

    logger.setLogLevel(LogLevel.None);

    @autoInjectable()
    class Dummy extends CollectorBase<any> {
        public name: string = 'dummy';
        public description: string = 'dummy desc';
        public options?: UserOptionInterface[];
        collect(config: any, args: CollectorArguments): Promise<SourceResultInterface> {
            return Promise.resolve({readmeLines: ['test']});
        }
        explain(config: any, args: CollectorArguments) {
            return Promise.resolve({});
        }

    }

    @autoInjectable()
    class Dummy2 extends CollectorBase<any> {
        public name: string = '';
        public description: string = 'dummy desc';
        public options?: UserOptionInterface[];
        collect(config: any, args: CollectorArguments): Promise<SourceResultInterface> {
            throw new Error("Method not implemented.");
        }
        explain(config: any, args: CollectorArguments) {
            throw new Error("Method not implemented.");
        }

    }

    @autoInjectable()
    class Dummy3 extends CollectorBase<any> {
        public name: string = 'dummy3';
        public description: string = 'dummy desc';
        public options?: UserOptionInterface[];
        collect(config: any, args: CollectorArguments): Promise<SourceResultInterface> {
            return Promise.reject(new Error("Method not implemented."));
        }
        explain(config: any, args: CollectorArguments) {
            throw new Error("Method not implemented.");
        }

    }

    @autoInjectable()
    class Dummy4 {

    }

    it('Get source by name' , async () => {
        
        container.registerType("XMock1", Dummy);

        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;
        srcManager.clear();
        srcManager.add("XMock1");

        expect(srcManager.getAll()).lengthOf(1);
        expect(srcManager.getByName('dummy')).not.undefined;
        
    });

    it('Error if source has no name' , async () => {
        
        container.registerType("XMock2", Dummy2);

        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;
        srcManager.clear();

        expect(() => {
            srcManager.add("XMock2");
        }).throw(`InjectionToken not found "XMock2"`)
        
    });

    it('Token not found' , async () => {
        
        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;

        expect(() => {
            srcManager.add("XMockNot");
        }).throw(`InjectionToken not found "XMockNot"`)
        
    });

    
    it('Not CollectorBase' , async () => {
        container.registerType("Mockx", Dummy4); 
        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;

        expect(() => {
            srcManager.add("Mockx");
        }).throw(`InjectionToken not found "Mockx"`)
        
    });

    
    it('Run source' , async () => {
        const archiveMoq = TypeMoq.Mock.ofType(Archive);

        container.registerType("Dummy", Dummy);

        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;
        srcManager.clear();
        srcManager.add("Dummy");

        const result = await srcManager.runSource(srcManager.getByName('dummy'), [], archiveMoq.target);
        
        expect(result).not.be.undefined;
        expect(result.readmeLines).not.be.undefined;
        expect(result.readmeLines).lengthOf(1);
        expect(result.readmeLines[0]).equal("test");

    });

    it('Run source (failure)' , async () => {
        const archiveMoq = TypeMoq.Mock.ofType(Archive);

        container.registerType("Dummy", Dummy3);

        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;
        srcManager.clear();
        srcManager.add("Dummy");

        let hasError = false;
      try {
        await srcManager.runSource(srcManager.getByName('dummy3'), [], archiveMoq.target);
      } catch (e ) {
          hasError = e.toString().includes('Method not implemented');
      }

      expect(hasError).to.true;

    }); 

    it('Replace existing source' , async () => {
        
        const srcManager = container.resolve("SourceManagerInterface") as SourceManagerInterface;
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