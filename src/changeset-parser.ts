import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import Changeset from './changeset';

const changesetExpression = /^--changeset(.*)$/m;
const typeExpression = /type:([^\s]+)/;
const contextExpression = /context:([^\s]+)/;

function computeHash (content: string): string {
  const hash = crypto.createHash('sha1');
  hash.update(content);
  return hash.digest('hex');
}

export default class ChangesetParser {
  public static parseFile (filename: string, basePath: string = '/'): Changeset[] {
    const content = fs.readFileSync(filename, 'utf8');
    let relativePath = path.relative(basePath, filename);

    if (basePath === '/') {
      relativePath = '/' + relativePath;
    }

    return ChangesetParser.parseFileContent(relativePath, content);
  }

  public static parseFileContent (filename: string, content: string): Changeset[] {
    const changesets = [];
    const changesetMap: any = {};

    if (content.indexOf(`--migration`) !== 0) {
      throw new Error('Changeset file must start with --migration');
    }

    const components = content.split(changesetExpression).slice(1);

    for (let i = 0; i < components.length; i += 2) {
      const descriptor = components[i];
      const script = components[i + 1].trim();
      const typeMatch = typeExpression.exec(descriptor);
      const contextMatch = contextExpression.exec(descriptor);

      const nameEnd = Math.min(
        descriptor.length,
        typeMatch ? typeMatch.index : descriptor.length,
        contextMatch ? contextMatch.index : descriptor.length,
      );

      const name = descriptor.substring(0, nameEnd).trim();

      if (!script) {
        throw new Error(`Changeset '${filename}:${name}' is empty`);
      }

      if (name in changesetMap) {
        throw new Error(`Duplicate changeset '${name}' already defined in ${filename}`);
      }

      const changeset = new Changeset({
        file: filename,
        name,
        script,
        executionType: typeMatch ? typeMatch[1] : 'once',
        context: contextMatch ? contextMatch[1] : null,
        hash: computeHash(script),
      });

      changesetMap[name] = changeset;

      changesets.push(changeset);
    }

    return changesets;
  }
}
