import globby = require('globby');
import * as chai from 'chai';

const expect = chai.expect;
describe('Glob Tests', async () => {

    it('Project json files' , async () => {
        const paths = await globby(['*.json']);

        expect(paths).to.contain('package-lock.json');
        expect(paths).to.contain('package.json');
        expect(paths).to.contain('tsconfig.json');
    });
    
});