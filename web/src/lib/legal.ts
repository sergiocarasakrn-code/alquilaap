// Datos del titular de Alquilaap para las páginas legales. Se configuran con variables de entorno
// para no tener que tocar el código: LEGAL_NAME, LEGAL_TAX_ID, LEGAL_ADDRESS, CONTACT_EMAIL.
export const LEGAL = {
  name: process.env.LEGAL_NAME || "[Razón social pendiente]",
  taxId: process.env.LEGAL_TAX_ID || "[CIF pendiente]",
  address: process.env.LEGAL_ADDRESS || "[Domicilio pendiente], Valencia, España",
  email: process.env.CONTACT_EMAIL || "[email de contacto pendiente]",
  updated: "12 de noviembre de 2026",
};
