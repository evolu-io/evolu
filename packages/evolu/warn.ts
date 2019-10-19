/**
 * Something like tiny-invariant, but with console.warn instead of throwing.
 * With typed functional programming, we never throw. App should "fail" silently.
 * For rare situations when external data are invalid, console.warn is good enough.
 * https://github.com/gcanti/fp-ts/issues/973
 */
export function warn(message: string) {
  // eslint-disable-next-line no-console
  warn(message);
}
