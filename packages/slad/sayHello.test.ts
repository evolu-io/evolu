import sayHello from './sayHello';

test('sayHello can greet a user', () => {
  const user = { name: 'TypeScript' };
  expect(sayHello(user)).toBe('Hello TypeScript!');
});
