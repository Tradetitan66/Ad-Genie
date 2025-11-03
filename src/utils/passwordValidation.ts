export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function validatePassword(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Weak';
  let color = 'red';

  if (score >= 5) {
    label = 'Strong';
    color = 'green';
  } else if (score >= 4) {
    label = 'Good';
    color = 'amber';
  } else if (score >= 3) {
    label = 'Fair';
    color = 'orange';
  }

  return {
    score,
    label,
    color,
    requirements,
  };
}

export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters',
    'One uppercase letter',
    'One lowercase letter',
    'One number',
    'One special character',
  ];
}
