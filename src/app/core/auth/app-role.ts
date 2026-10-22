export const APP_ROLES = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN'
} as const;

export type AppRole =
  typeof APP_ROLES[keyof typeof APP_ROLES];