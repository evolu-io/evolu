/**
 * A little helper for pipe logging.
 * `pipe(x, foo, logPipe, bla)`
 * `pipe(x, logPipe(foo), bla)`
 */
export const logPipe = <A>(a: A): A => {
  // eslint-disable-next-line no-console
  console.log(a);
  return a;
};
