const OFFICE_URL = import.meta.env.VITE_OFFICE_URL ?? 'http://localhost:5174';

export const links = {
  office: OFFICE_URL.replace(/\/$/, ''),
  officeBilling: `${OFFICE_URL.replace(/\/$/, '')}/billing`,
};

export const appConfig = {
  name: 'BlurayPOS HR',
  tagline: 'Employees, payroll, attendance, leave, and performance — for your store team.',
};
