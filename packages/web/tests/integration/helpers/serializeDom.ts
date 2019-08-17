interface ElementJson {
  tag: string;
  attributes: { [name: string]: string };
  children: (ElementJson | string)[];
}

export function serializeDom() {
  // We need exact DOM structure but not everything.
  function elementToJson(element: Element): ElementJson {
    return {
      tag: element.tagName,
      attributes: Array.from(element.attributes)
        .map(attr => ({ name: attr.name, value: attr.value }))
        .reduce(
          (object, attr) =>
            // eslint-disable-next-line prefer-object-spread
            Object.assign({}, object, { [attr.name]: attr.value }),
          {},
        ),
      children: Array.from(element.childNodes)
        .filter(child => child.nodeType === 1 || child.nodeType === 3)
        .map(child => {
          if (child.nodeType === 3) return child.nodeValue || '';
          return elementToJson(child as Element);
        }),
    };
  }
  // return elementToJson(document.documentElement);
  return elementToJson(document.querySelector('#__next') as Element);
}
