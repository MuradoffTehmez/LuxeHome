/**
 * Sorğunun ömrünün sonu (#270): cavab gövdəsi tam göndəriləndə (və ya klient bağlantını kəsəndə)
 * və `waitUntil`-ə verilən bütün fon işləri bitəndə qeydiyyatdan keçmiş təmizləmə funksiyaları
 * çağırılır.
 *
 * Nə üçün lazımdır: Prisma klienti sorğu başına qurulur (#96), hər klient isə izolyatın ortaq
 * wasm yaddaşında öz query engine-ini yaradır (~1,6 MB). Workers-də o yaddaş `FinalizationRegistry`
 * ilə geri qaytarılmır — `$disconnect()` çağırılmasa, izolyat yaşadıqca yaddaş xətti böyüyür və
 * nəhayət yeni engine yaradıla bilmir: D1-ə toxunan bütün marşrutlar 500 verir. Klient isə nə vaxt
 * «artıq lazım olmadığını» bilmir — React cavabı axınla göndərir, `waitUntil` işləri cavabdan
 * sonra da işləyir. Bu modul o anı `worker.ts`-də müəyyən edir.
 *
 * Əlaqə bundle-lar arasındadır: `worker.ts` və OpenNext worker-i ayrı-ayrı yığılır, ona görə
 * qeydiyyat funksiyası modul dəyişəni ilə deyil, `ctx`-in özündə qlobal simvolla ötürülür
 * (`registerRequestCleanup`). Sarğı olmayan mühitdə (test, `next dev`) qeydiyyat heç nə etmir.
 */

/** `ctx` üzərindəki qeydiyyat açarı — hər iki bundle eyni simvolu görür. */
export const REQUEST_CLEANUP = Symbol.for("luxehome.requestCleanup");

type Cleanup = () => unknown;
type CleanupCarrier = { [REQUEST_CLEANUP]?: (cleanup: Cleanup) => void };

/**
 * Təmizləmə funksiyasını sorğunun sonuna yazır. `ctx` sarğıdan keçməyibsə `false` qaytarır —
 * çağıran tərəf onda təmizləməni özü həll etməlidir (və ya etməməlidir).
 */
export function registerRequestCleanup(ctx: unknown, cleanup: Cleanup): boolean {
  const register = (ctx as CleanupCarrier | null | undefined)?.[REQUEST_CLEANUP];
  if (typeof register !== "function") return false;
  register(cleanup);
  return true;
}

export type RequestLifetime = {
  /** OpenNext-ə ötürülən `ctx` — `waitUntil` izlənir, qalan hər şey əsl `ctx`-ə gedir. */
  ctx: ExecutionContext;
  /**
   * Cavabı qaytarmazdan əvvəl çağırılır: gövdə bitəndə ömür bağlanır. Cavab yoxdursa (xəta) və ya
   * gövdəsi çağıran tərəfdən artıq oxunubsa `null` ver — onda yalnız fon işləri gözlənilir.
   */
  finish<T extends Response | null>(response: T): T;
};

/** Cavab gövdəsini ötürür və tam göndərilməsini (və ya kəsilməsini) gözləyən promise qaytarır. */
function trackBody(response: Response): { response: Response; done: Promise<unknown> } {
  if (!response.body || response.status === 101 || (response as Response & { webSocket?: unknown }).webSocket) {
    return { response, done: Promise.resolve() };
  }
  const { readable, writable } = new TransformStream();
  // Klient bağlantını kəsəndə `pipeTo` rədd olunur — o da ömrün sonudur.
  const done = response.body.pipeTo(writable).catch(() => undefined);
  return { response: new Response(readable, response), done };
}

export function trackRequestLifetime(ctx: ExecutionContext): RequestLifetime {
  const pending: Promise<unknown>[] = [];
  const cleanups: Cleanup[] = [];
  let finished = false;

  const tracked = new Proxy(ctx, {
    get(target, prop) {
      if (prop === "waitUntil") {
        return (promise: Promise<unknown>) => {
          pending.push(Promise.resolve(promise).catch(() => undefined));
          target.waitUntil(promise);
        };
      }
      if (prop === REQUEST_CLEANUP) return (cleanup: Cleanup) => cleanups.push(cleanup);
      const value = Reflect.get(target, prop, target);
      // `ExecutionContext` metodları native-dir — `this` əsl obyekt olmalıdır.
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  async function settle(body: Promise<unknown>): Promise<void> {
    await body;
    // Fon işi başqa fon işi aça bilər (məs. keş yenilənməsi) — siyahı sabitləşənə qədər gözlənilir.
    let seen = 0;
    while (seen < pending.length) {
      const batch = pending.slice(seen);
      seen = pending.length;
      await Promise.allSettled(batch);
    }
    for (const cleanup of cleanups.splice(0)) {
      try {
        await cleanup();
      } catch (error) {
        console.error("[request-lifetime] təmizləmə alınmadı:", error);
      }
    }
  }

  return {
    ctx: tracked,
    finish<T extends Response | null>(response: T): T {
      if (finished) return response;
      finished = true;
      if (!response) {
        ctx.waitUntil(settle(Promise.resolve()));
        return response;
      }
      const body = trackBody(response);
      ctx.waitUntil(settle(body.done));
      return body.response as T;
    },
  };
}
