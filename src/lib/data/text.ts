export function removeEmptyRows(input: string): string {
  return input
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

export function extractEmails(input: string): string[] {
  const re =
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;
  const found = input.match(re) ?? [];
  const seen = new Set<string>();
  return found.filter((email) => {
    const lower = email.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}
