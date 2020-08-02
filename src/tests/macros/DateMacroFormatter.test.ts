import "reflect-metadata"; 
import { CommandManagerInterface, DateMacroFormatter } from '../../lib';
import { InitializeDependencyInjection } from "../../lib";
import { container } from "tsyringe";
InitializeDependencyInjection();

import globby = require('globby');
import * as chai from 'chai';
import * as TypeMoq from "typemoq";
import { Logger, logger, LogLevel } from "../../util";
import { IDateManager } from "../../lib/dateManager/IDateManager";


const expect = chai.expect;
describe('DateMacroFormatter', async () => {

    logger.setLogLevel(LogLevel.None);
    
    it('Make sure format function invokes IDateManager' , async () => {
        
        const x = TypeMoq.Mock.ofType<IDateManager>()
        x.setup(x => x.formatUtcNow()).returns(() => 'verified');
        container.register("IDateManager", {useValue: x.target});

        const frm = container.resolve("DateMacroFormatter") as DateMacroFormatter;
        expect(frm.format("yyyyMMdd")).equal('verified');

    });

    it('Make sure help returns list of strings' , async () => {

        const frm = container.resolve("DateMacroFormatter") as DateMacroFormatter;
        expect(frm.help().length).greaterThan(0);

    });


});