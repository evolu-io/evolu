import path from 'path';

export function pageUrl(name: string) {
  if (process.env.JEST_WATCH) {
    return `http://localhost:3000/${name}`;
  }
  return `file://${path.join(__dirname, '..', 'out', `${name}.html`)}`;
}
