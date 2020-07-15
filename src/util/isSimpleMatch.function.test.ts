import globby = require('globby');
import * as chai from 'chai';
import { isSimpleMatch } from './isSimpleMatch.function';

const expect = chai.expect;
describe('isSimpleMatch function', async () => {

    it('Test' , async () => {
        expect(isSimpleMatch('hejsan', 'hej*')).to.eq(true);
        expect(isSimpleMatch('hejsan', '*hej')).to.eq(false);
        expect(isSimpleMatch('hejsanhej', '*hej')).to.eq(true);
    });
    
}); 