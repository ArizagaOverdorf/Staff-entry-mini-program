import { v4 as uuidv4 } from 'uuid';

export function generateStaffId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().slice(0, 6).toUpperCase();
  return `SF${timestamp}${random}`;
}
