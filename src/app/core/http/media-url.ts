import { environment } from '../../../environments/environment';

/**
 * Construit une URL absolue vers un média du backend.
 *
 * Le backend peut renvoyer :
 * - une URL absolue (`http://…`) : elle est conservée telle quelle ;
 * - un chemin déjà préfixé par la base des médias (`/media/…`) ;
 * - un chemin relatif (`projects/mon-image.webp`).
 */
export function resolveMediaUrl(
  path: string | null | undefined
): string | null {
  if (!path) {
    return null;
  }

  const value = path.trim();

  if (!value) {
    return null;
  }

  if (
    /^(https?:)?\/\//i.test(value) ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  const mediaBase = environment.mediaUrl.replace(/\/+$/, '');

  let mediaPath = '/media';

  try {
    mediaPath = new URL(
      mediaBase,
      window.location.origin
    ).pathname.replace(/\/+$/, '');
  } catch {
    // La base des médias reste utilisable même si elle n'est pas une URL.
  }

  let normalized = value;

  if (
    mediaPath &&
    normalized.startsWith(`${mediaPath}/`)
  ) {
    normalized = normalized.slice(mediaPath.length);
  }

  return normalized.startsWith('/')
    ? `${mediaBase}${normalized}`
    : `${mediaBase}/${normalized}`;
}

export function resolveMediaUrls(
  paths: string[] | null | undefined
): string[] {
  if (!paths?.length) {
    return [];
  }

  return paths
    .map(path => resolveMediaUrl(path))
    .filter((url): url is string => url !== null);
}
