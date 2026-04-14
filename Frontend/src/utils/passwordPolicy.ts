export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, minúscula y carácter especial.';

export const PASSWORD_POLICY_REQUIREMENTS = [
  'Mínimo 8 caracteres',
  'Al menos una letra mayúscula',
  'Al menos una letra minúscula',
  'Al menos un carácter especial',
];

export type PasswordPolicyResult = {
  minLength: boolean;
  upper: boolean;
  lower: boolean;
  special: boolean;
};

export function validatePasswordPolicy(value: string): PasswordPolicyResult {
  return {
    minLength: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export function getPasswordPolicyIssues(value: string): string[] {
  const result = validatePasswordPolicy(value);
  const issues: string[] = [];
  if (!result.minLength) issues.push(PASSWORD_POLICY_REQUIREMENTS[0]);
  if (!result.upper) issues.push(PASSWORD_POLICY_REQUIREMENTS[1]);
  if (!result.lower) issues.push(PASSWORD_POLICY_REQUIREMENTS[2]);
  if (!result.special) issues.push(PASSWORD_POLICY_REQUIREMENTS[3]);
  return issues;
}

export function isStrongPassword(value: string): boolean {
  return getPasswordPolicyIssues(value).length === 0;
}