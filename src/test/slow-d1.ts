/**
 * Hər D1 çağırışına gecikmə əlavə edən sarğı — Prisma əlaqələrinin ardıcıl və ya paralel
 * yükləndiyini integration testində ölçmək üçün (#179, #181). Lokal D1 production-dakı
 * şəbəkə gecikməsini (~50–90 ms) göstərmir; gecikmə olmadan fərq görünmür.
 */
export function slowD1(db: D1Database, delayMs: number, onCall: () => void = () => undefined): D1Database {
  const wrapStatement = (statement: D1PreparedStatement): D1PreparedStatement =>
    new Proxy(statement, {
      get(target, property) {
        const value = Reflect.get(target, property) as unknown;
        if (typeof value !== "function") return value;
        if (property === "bind") {
          return (...args: unknown[]) => wrapStatement((value as (...a: unknown[]) => D1PreparedStatement).apply(target, args));
        }
        if (["all", "raw", "first", "run"].includes(String(property))) {
          return async (...args: unknown[]) => {
            onCall();
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return (value as (...a: unknown[]) => unknown).apply(target, args);
          };
        }
        return (value as (...a: unknown[]) => unknown).bind(target);
      },
    });
  return new Proxy(db, {
    get(target, property) {
      if (property === "prepare") return (sql: string) => wrapStatement(target.prepare(sql));
      const value = Reflect.get(target, property) as unknown;
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  });
}

const CONTEXT = Symbol.for("__cloudflare-context__");

/**
 * `fn`-i yavaş D1 ilə işlədir. Prisma klienti sorğu konteksti (`ctx`) üzrə yaradılır — yeni
 * kontekst yeni (yavaş) klient deməkdir. Qayıdış: müddət (ms) və D1 çağırışlarının sayı.
 */
export async function withSlowD1<T>(db: D1Database, delayMs: number, fn: () => Promise<T>) {
  const globals = globalThis as Record<symbol, { env: Record<string, unknown> } & Record<string, unknown>>;
  const original = globals[CONTEXT];
  let calls = 0;
  globals[CONTEXT] = {
    ...original,
    env: { ...original.env, DB: slowD1(db, delayMs, () => { calls += 1; }) },
    ctx: { waitUntil: () => undefined, passThroughOnException: () => undefined },
  };
  try {
    const started = Date.now();
    const result = await fn();
    return { result, elapsed: Date.now() - started, calls };
  } finally {
    globals[CONTEXT] = original;
  }
}
