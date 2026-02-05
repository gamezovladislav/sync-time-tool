import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined) => {
  if (!value) {
    return [] as string[];
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const config = {
  port: parseNumber(process.env.PORT, 8080),
  minLeadMs: parseNumber(process.env.MIN_LEAD_MS, 200),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS)
};

export const isOriginAllowed = (origin: string | undefined) => {
  if (!origin) {
    return config.allowedOrigins.length === 0;
  }
  if (config.allowedOrigins.length === 0) {
    return true;
  }
  return config.allowedOrigins.includes(origin);
};
