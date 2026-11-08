import {
  environment
} from '../../../environments/environment';

function toUrl(value: string): URL {
  return new URL(value, window.location.origin);
}

function normalizePath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '');

  return normalized.length > 0 ? normalized : '/';
}

function matchesBase(target: URL, base: URL): boolean {
  if (target.origin !== base.origin) {
    return false;
  }

  const basePath = normalizePath(base.pathname);

  return (
    target.pathname === basePath ||
    target.pathname.startsWith(`${basePath}/`)
  );
}

/**
 * Vérifie si l'URL cible l'API ou les médias du backend.
 */
export function isBackendRequest(requestUrl: string): boolean {
  try {
    const target = toUrl(requestUrl);

    return (
      matchesBase(target, toUrl(environment.apiUrl)) ||
      matchesBase(target, toUrl(environment.mediaUrl))
    );
  } catch {
    return false;
  }
}

/**
 * Vérifie si l'URL cible une route admin de l'API.
 * Seules ces requêtes reçoivent le token Keycloak.
 */
export function isAdminApiRequest(requestUrl: string): boolean {
  try {
    const target = toUrl(requestUrl);
    const api = toUrl(environment.apiUrl);

    if (target.origin !== api.origin) {
      return false;
    }

    const adminPath = `${normalizePath(api.pathname)}/admin`;

    return (
      target.pathname === adminPath ||
      target.pathname.startsWith(`${adminPath}/`)
    );
  } catch {
    return false;
  }
}
