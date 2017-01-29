export default class Changeset {
  public file?: string;
  public name?: string;
  public executionType?: 'once' | 'always' | 'change';
  public context?: string;
  public script?: string;
  public hash?: string;

  constructor (properties?: any) {
    if (properties) {
      Object.assign(this, properties);
    }
  }

  public formatName (): string {
    return `${this.file}${this.name ? ':' : ''}${this.name}`;
  }
}
