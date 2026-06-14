export function readOptionalNullableText(
  body: Record<string, unknown> | undefined,
  key: string,
): string | null | undefined {
  if (!body || !Object.prototype.hasOwnProperty.call(body, key)) {
    return undefined;
  }

  const value = body[key];
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return typeof value === 'string' ? value : null;
}
