/**
 * Something like tiny-invariant, but with console.warn instead of throwing.
 * With typed functional programming, we never throw. App must "fail" silently.
 * Instead of throwing, we use console.warn.
 * https://github.com/gcanti/fp-ts/issues/973
 */
export const warn = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(message);
};
