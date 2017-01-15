export default class Changeset {
  public file?: string;
  public name?: string;
  public executionType?: 'once' | 'always' | 'change';
  public context?: string;
  public script?: string;
  public hash?: string;
}
