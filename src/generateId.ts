import { randomBytes } from 'crypto'

export function generateId(): string {
  return randomBytes(16).toString('hex')
}
