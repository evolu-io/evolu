import path from 'path';

export function pageUrl(name: string) {
  const isCI = process.env.IS_NOW || process.env.CI;
  if (isCI)
    return `file://${path.join(__dirname, '..', 'out', `${name}.html`)}`;
  return `http://localhost:3000/${name}`;
}
