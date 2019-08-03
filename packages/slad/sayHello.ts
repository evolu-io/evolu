interface User {
  name: string;
}

const sayHello = (user: User): string => `Hello ${user.name}!`;

export default sayHello;
