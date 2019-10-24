/**
 * A little helper for pipe logging.
 * `pipe(x, foo, logPipe, bla)`
 * `pipe(x, logPipe(foo), bla)`
 */
export const logPipe = <T>(arg: T): T => {
  // eslint-disable-next-line no-console
  console.log(arg);
  return arg;
};
