import * as chai from 'chai';
import alphaNumericSorter from './alpha-numeric-sorter';

const expect = chai.expect;

describe('Alpha Numeric Sorter', async () => {
  it('should sort non numeric strings', async () => {
    const input = ['xyz', 'abc', 'efg', 'tuv', 'lmn'];
    const normalSort = input.sort();
    const alphaNumericSort = input.sort(alphaNumericSorter);

    expect(alphaNumericSort).to.eql(normalSort);
  });

  it('should sort single segment numeric strings', async () => {
    const input = ['123', '1', '12', '20', '50', '2'];
    const expected = ['1', '2', '12', '20', '50', '123'];
    const alphaNumericSort = input.sort(alphaNumericSorter);

    expect(alphaNumericSort).to.eql(expected);
  });

  it('should sort two segment numeric strings', async () => {
    const input = ['a123', 'b1', 'a12', 'a20', 'b50', 'b2'];
    const expected = ['a12', 'a20', 'a123', 'b1', 'b2', 'b50'];
    const alphaNumericSort = input.sort(alphaNumericSorter);

    expect(alphaNumericSort).to.eql(expected);
  });

  it('should sort mixed segment numeric strings', async () => {
    const input = ['a123', 'b1', 'a12', 'a20', '50', '50c', 'b'];
    const expected = ['50', '50c', 'a12', 'a20', 'a123', 'b', 'b1'];
    const alphaNumericSort = input.sort(alphaNumericSorter);

    expect(alphaNumericSort).to.eql(expected);
  });
});
