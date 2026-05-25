export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length < 8) return idNumber;
  return idNumber.slice(0, 3) + '***********' + idNumber.slice(-4);
}

export function maskName(name: string): string {
  if (!name) return name;
  if (name.length === 1) return '*';
  return name[0] + '*'.repeat(name.length - 1);
}
