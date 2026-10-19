import { purgeTelegramDeliveries } from "./delivery";
import { purgeTelegramLinkTokens } from "./linking";
import { purgeSupportTickets } from "./support";
import { purgeTelegramUpdates } from "./webhook";

/**
 * Gündəlik baxım (`runPhase2Maintenance`): saxlama müddətləri `policy.ts`-dədir. Hər addım ayrıca udulur —
 * biri alınmasa digərləri işləyir, baxım işi də sınmır. İdempotentdir.
 */
export async function purgeTelegramData(now: Date = new Date()) {
  const [updates, deliveries, tokens, supportTickets] = await Promise.all([
    purgeTelegramUpdates(now).catch(() => 0),
    purgeTelegramDeliveries(now).catch(() => 0),
    purgeTelegramLinkTokens(now).catch(() => 0),
    purgeSupportTickets(now).catch(() => 0),
  ]);
  return { updates, deliveries, tokens, supportTickets };
}
