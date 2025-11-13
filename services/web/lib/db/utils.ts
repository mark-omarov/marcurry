export function nowIso() {
  return new Date().toISOString();
}

export function toSnakeCase(input: string): string {
  return input.replace(/\s+/g, '_').toLowerCase();
}
