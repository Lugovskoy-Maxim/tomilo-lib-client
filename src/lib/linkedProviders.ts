/**
 * Извлекает список подключённых провайдеров из ответа API.
 * API может возвращать linkedProviders (string[]) или oauthProviders (массив { provider, providerId }).
 */
export function getLinkedProvidersFromUser(user: {
  linkedProviders?: string[];
  oauthProviders?: Array<{ provider?: string }>;
}): string[] | undefined {
  if (Array.isArray(user.linkedProviders) && user.linkedProviders.length > 0) {
    return user.linkedProviders;
  }
  if (Array.isArray(user.oauthProviders) && user.oauthProviders.length > 0) {
    return user.oauthProviders
      .map(p => p.provider?.toLowerCase())
      .filter((p): p is string => Boolean(p));
  }
  return undefined;
}
