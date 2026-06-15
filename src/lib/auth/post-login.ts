export function resolvePostLoginPath(
  callbackUrl: string | null,
  tenants: { slug: string }[],
  platformAdmin: boolean
): string {
  const destination = callbackUrl?.trim() || "/";

  if (
    destination !== "/" &&
    !destination.startsWith("/login") &&
    !destination.startsWith("/signup")
  ) {
    return destination;
  }

  if (tenants.length === 1) {
    return `/${tenants[0].slug}/admin`;
  }

  if (tenants.length > 1) {
    return `/${tenants[0].slug}/admin`;
  }

  if (platformAdmin) {
    return "/platform";
  }

  return "/onboarding";
}
