
import * as mocha from 'mocha';
import * as chai from 'chai';
import * as tmp from 'tmp';
import * as fs from 'fs';
import { assert } from 'console';
import { propertyParser } from './propertyParser.class';

const expect = chai.expect;
describe('parseAsStringArray', () => {

  it('Simple comma separated string' , async () => {
    var result = propertyParser.parseAsStringArray(`hej,kaka`);
    expect(result.value).not.to.be.undefined;
    expect(result.value.length).to.equal(2);
    expect(result.value[0]).to.equal('hej');
    expect(result.value[1]).to.equal('kaka');

  });

  it('Comma separated string with random quotes' , async () => {
    var result = propertyParser.parseAsStringArray(`he"j,k"aka`);

    expect(result.value).not.to.be.undefined;
    expect(result.value.length).to.equal(2);
    expect(result.value[0]).to.equal('he"j');
    expect(result.value[1]).to.equal('k"aka');

  });
});