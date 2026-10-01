import { ChevronDown } from "lucide-react";

export type FaqDisplayGroup = {
  title: string;
  items: Array<{ question: string; answer: string }>;
};

/** Site dəstəyi və hüquqi FAQ üçün eyni əlçatan, JavaScript-siz accordion. */
export function FaqGroups({ groups, answersAreHtml = false }: { groups: FaqDisplayGroup[]; answersAreHtml?: boolean }) {
  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-5">
          <h2 className="font-display text-2xl text-ink">{group.title}</h2>
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper shadow-xs">
            {group.items.map((item) => (
              <details key={item.question} className="group px-5 transition-colors open:bg-ivory/50 sm:px-7">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-5 py-4 text-left text-base leading-snug font-semibold text-ink marker:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item.question}</span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-beige text-ink-soft transition-colors group-open:bg-gold/15 group-open:text-gold-deep"><ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" /></span>
                </summary>
                {answersAreHtml ? (
                  <div className="prose-luxe max-w-none pb-6 text-[0.9375rem] leading-7 text-ink-soft [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: item.answer }} />
                ) : (
                  <p className="pb-6 text-[0.9375rem] leading-7 text-ink-soft [overflow-wrap:anywhere]">{item.answer}</p>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
