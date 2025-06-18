export interface NormyQueryMeta extends Record<string, unknown> {
  normalize?: boolean;
}

declare module '@tanstack/query-core' {
  interface Register {
    queryMeta: NormyQueryMeta;
    mutationMeta: NormyQueryMeta;
  }
}
