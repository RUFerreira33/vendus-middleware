export type Config = {
  INTERNAL_API_KEY: string;
  VENDUS_BASE_URL: string;
  VENDUS_API_KEY: string;
  ALLOWED_ORIGINS: string;
};

function must(name: keyof Config): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getConfig(): Config {
  return {
    INTERNAL_API_KEY: must("INTERNAL_API_KEY"),
    VENDUS_BASE_URL: must("VENDUS_BASE_URL").replace(/\/+$/, ""),
    VENDUS_API_KEY: must("VENDUS_API_KEY"),
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "*"
  };
}
