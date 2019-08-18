interface ElementJson {
  type: string;
  props: { [name: string]: string };
  children: (ElementJson | string)[];
}

// Note serializeDom function is serialized itself for Puppeteer so
// all it needs must be defined inside.
function serializeDom() {
  // We need exact DOM structure but not everything I suppose.
  function elementToJson(element: Element): ElementJson {
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
  }
  return elementToJson(document.querySelector('#__next') as Element);
}

// That's how we trick Jest to have pretty format like react-test-render has.
// It's impossible to have own formatting as far as I know, because
// toMatchSnapshot somehow escape quotes and maybe something else.
function ensurePrettyFormat(element: ElementJson) {
  Object.defineProperty(element, '$$typeof', {
    value: Symbol.for('react.test.json'),
  });
  element.children.forEach(child => {
    if (typeof child === 'string') return;
    ensurePrettyFormat(child);
  });
}

export async function pageDom() {
  // https://jestjs.io/docs/en/expect#expectextendmatchers
  const json = await page.evaluate(serializeDom);
  ensurePrettyFormat(json);
  return json;
}
