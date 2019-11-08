import path from 'path';
import { ClickOptions, Keyboard } from 'puppeteer';
import * as i from 'fp-ts/lib/IO';
import { ElementID } from 'evolu';

export const pageUrl = (name: string) => {
  if (process.env.JEST_WATCH) {
    return `http://localhost:3000/${name}`;
  }
  return `file://${path.join(__dirname, '..', 'out', `${name}.html`)}`;
};

// This waiting is required for CI and Puppeteer sometimes.
export const pageAwaitFor50ms = async () => {
  // This seems to be safe.
  const waitForDuration = 50;
  await page.waitFor(waitForDuration);
};

export const pageGoto = async (name: string) => {
  const url = pageUrl(name);
  await page.goto(url);
  await pageAwaitFor50ms();
};

// Note on MacOS, keyboard shortcuts like ⌘ A -> Select All do not work. See #1313
// https://github.com/GoogleChrome/puppeteer/issues/1313
// tldr; We can not use ⌘ for anything, not even for moving to line / page ends, etc.
// Meta works only in Linux and Windows and there are also different shortcuts.
// We rely on native text writing and selection anyway, because that's what
// contentEditable does well. If not, add platform and browser-specific test.
// Therefore, for key navigation, we use arrows only.
// There will be platform dependent edge cases among elements etc. That's fine.
export const pressMany = async (key: string, count: number) => {
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
    // Waiting after key press is necessary, otherwise, Puppeteer will fail.
    await pageAwaitFor50ms();
  }
};

interface ElementJson {
  type: string;
  props: { [name: string]: string };
  children: (ElementJson | string)[];
}

// Note serializeDom function is serialized itself for Puppeteer so
// all it needs must be defined inside.
const serializeDom = () => {
  // We need exact DOM structure but not everything I suppose.
  const elementToJson = (element: Element): ElementJson => {
    return {
      type: element.tagName.toLowerCase(),
      props: Array.from(element.attributes)
        .map(attr => ({ name: attr.name, value: attr.value }))
        .reduce((object, attr) => {
          // eslint-disable-next-line prefer-object-spread
          return Object.assign({}, object, { [attr.name]: attr.value });
        }, {}),
      children: Array.from(element.childNodes)
        .filter(child => child.nodeType === 1 || child.nodeType === 3)
        .map(child => {
          // We wrap text with · characters to explicitly denote TextNodes.
          if (child.nodeType === 3) return `·${child.nodeValue || ''}·`;
          return elementToJson(child as Element);
        }),
    };
  };
  return elementToJson(document.querySelector('#__next') as Element);
};

// That's how we trick Jest to have pretty format like react-test-render has.
// It's impossible to have own formatting as far as I know, because
// toMatchSnapshot somehow escape quotes and maybe something else.
const ensurePrettyFormat = (element: ElementJson) => {
  Object.defineProperty(element, '$$typeof', {
    value: Symbol.for('react.test.json'),
  });
  element.children.forEach(child => {
    if (typeof child === 'string') return;
    ensurePrettyFormat(child);
  });
};

export const pageDom = async () => {
  // https://jestjs.io/docs/en/expect#expectextendmatchers
  const json = await page.evaluate(serializeDom);
  ensurePrettyFormat(json);
  return json;
};

export const pageClick = async (selector: string, options?: ClickOptions) => {
  await page.click(selector, options);
  await pageAwaitFor50ms();
};

export const pageKeyboard: Keyboard = [
  'down',
  'press',
  'sendCharacter',
  'type',
  'up',
].reduce(
  (object, name) => {
    return {
      ...object,
      // @ts-ignore
      [name]: async (...args) => {
        // @ts-ignore
        await page.keyboard[name](...args);
        await pageAwaitFor50ms();
      },
    };
  },
  {} as Keyboard,
);

export const createStableIDFactory = (): i.IO<ElementID> => {
  let lastID = 0;
  beforeEach(async () => {
    lastID = 0;
  });
  return () => ((lastID++).toString() as unknown) as ElementID;
};
