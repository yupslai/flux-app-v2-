export interface User {
  id: string;
  email: string;
  password?: string;
  type?: 'guest' | 'regular';
}
