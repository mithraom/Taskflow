export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export function getPasswordError(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!PASSWORD_REGEX.test(password)) {
    return "Password must include an uppercase letter, a lowercase letter, a number, and a special character";
  }
  return null;
}