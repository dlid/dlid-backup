import { Archive } from './Archive';

import * as mocha from 'mocha';
import * as chai from 'chai';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { assert } from 'console';



const expect = chai.expect;
describe('Archive', () => {

  it('Zip a text string' , async () => {
    var filename = tmp.tmpNameSync({postfix: '.zip'})

    expect(1).to.equal(1);
    var a = new Archive(filename);
    a.addString('filename.txt', 'this is the zip content');
    await a.save();

    const exists = fs.existsSync(filename);
    expect(exists).to.eq(true);

    fs.unlinkSync(filename);
  });

});