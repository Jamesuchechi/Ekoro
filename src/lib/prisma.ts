import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

// Resolves a hostname to an IPv4 address synchronously using a child process.
// This resolves the known Prisma DNS/connection timeout bugs with Supabase poolers.
function resolvePoolerHost(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString;
  
  const hostPattern = /@([^:/]+):/i;
  const match = connectionString.match(hostPattern);
  if (!match) return connectionString;
  
  const hostname = match[1];
  // Only target Supabase pooler hostnames
  if (!hostname.includes("pooler.supabase.com")) return connectionString;

  try {
    // Resolve DNS using Node's dns module inside execSync (synchronous)
    const resolvedIp = execSync(
      `node -e "require('dns').resolve4('${hostname}', (err, ips) => { if (ips && ips.length) console.log(ips[0]); })"`
    )
      .toString()
      .trim();

    if (resolvedIp && /^[0-9.]+$/.test(resolvedIp)) {
      console.log(`[Prisma Init] Resolved pooler host ${hostname} -> ${resolvedIp}`);
      return connectionString.replace(hostname, resolvedIp);
    }
  } catch (error) {
    console.error("[Prisma Init] Sync DNS resolution failed:", error);
  }

  // Fallback to static IP if resolution failed but we are using the known aws-0-eu-west-1 pooler
  if (hostname === "aws-0-eu-west-1.pooler.supabase.com") {
    console.log(`[Prisma Init] Falling back to static IP for ${hostname}`);
    return connectionString.replace(hostname, "34.241.16.247");
  }

  return connectionString;
}

const databaseUrl = resolvePoolerHost(process.env.DATABASE_URL);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;

