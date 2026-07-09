const OFFICE_URL = import.meta.env.VITE_OFFICE_URL ?? 'http://localhost:5174';
const POS_URL = import.meta.env.VITE_POS_URL ?? 'http://localhost:5173';

export const links = {
  office: OFFICE_URL,
  officeRegister: `${OFFICE_URL}/register`,
  officeLogin: `${OFFICE_URL}/login`,
  pos: POS_URL,
};
