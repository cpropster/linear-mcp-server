/**
 * User operation types
 */

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserResponse {
  viewer: User;
}
