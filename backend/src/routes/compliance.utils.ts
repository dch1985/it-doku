type BodyLike = object | null | undefined;

function hasOwn(body: BodyLike, key: string): boolean {
  return Boolean(body && Object.prototype.hasOwnProperty.call(body, key));
}

/**
 * Keeps omitted patch fields as `undefined` so partial updates do not clear stored values.
 */
export function getOptionalNullableStringField(
  body: BodyLike,
  key: string,
): string | null | undefined {
  if (!hasOwn(body, key)) {
    return undefined;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : value ?? null;
}
