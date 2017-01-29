const splitExpression = /(\d+)/g;

export default function alphaNumericSorter (input1: string, input2: string): number {
  const segments1 = input1.split(splitExpression);
  const segments2 = input2.split(splitExpression);
  const maxSegments = Math.max(segments1.length, segments2.length);

  for (let i = 0; i < maxSegments; i++) {
    if (segments1[i] !== segments2[i]) {
      const value1 = isNaN(parseInt(segments1[i], 10)) ? segments1[i] : parseInt(segments1[i], 10);
      const value2 = isNaN(parseInt(segments2[i], 10)) ? segments2[i] : parseInt(segments2[i], 10);

      if (value1 === undefined || value2 === undefined) {
        return segments1.length - segments2.length;
      } else if (typeof value1 === typeof value2) {
        return (value1 < value2) ? -1 : 1;
      } else {
        return typeof value1 === 'number' ? -1 : 0;
      }
    }
  }
  return 0;
}
