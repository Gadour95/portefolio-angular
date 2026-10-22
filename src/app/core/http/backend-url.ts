import {
  environment
} from '../../../environments/environment';

export function isBackendRequest(requestUrl: string): boolean {
  try {
    const base = new URL(
      environment.apiUrl,
      window.location.origin
    );

    const target = new URL(
      requestUrl,
      window.location.origin
    );

    const basePath = base.pathname.replace(/\/+$/, '');

    const allowedPrefixes = [
      `${basePath}/api/`,
      `${basePath}/media/`
    ];

    return (
      target.origin === base.origin &&
      allowedPrefixes.some(prefix =>
        target.pathname.startsWith(prefix)
      )
    );
  } catch {
    return false;
  }
}