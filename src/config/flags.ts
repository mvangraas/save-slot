/**
 * Feature flags for external data providers. A provider only runs when its flag is on AND its
 * server-side keys are present, so a missing key can never half-enable an import.
 */
export type ProviderFlags = { igdb: boolean; pricecharting: boolean }

export function providerFlags(
  env: Record<string, string | undefined> = process.env,
): ProviderFlags {
  return {
    igdb: env.FEATURE_IGDB === '1' && !!env.IGDB_CLIENT_ID && !!env.IGDB_CLIENT_SECRET,
    pricecharting: env.FEATURE_PRICECHARTING === '1' && !!env.PRICECHARTING_API_KEY,
  }
}
