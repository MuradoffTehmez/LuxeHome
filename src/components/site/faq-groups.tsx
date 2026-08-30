import { ChevronDown } from "lucide-react";

export type FaqDisplayGroup = {
  title: string;
  items: Array<{ question: string; answer: string }>;
};

/** Site dəstəyi və hüquqi FAQ üçün eyni əlçatan, JavaScript-siz accordion. */
export function FaqGroups({ groups, answersAreHtml = false }: { groups: FaqDisplayGroup[]; answersAreHtml?: boolean }) {
  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="font-display text-xl text-ink">{group.title}</h2>
          <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-paper">
            {group.items.map((item) => (
              <details key={item.question} className="group px-4 sm:px-5">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-2 text-left text-sm font-medium text-ink marker:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item.question}</span>
                  <ChevronDown className="mt-0.5 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                {answersAreHtml ? (
                  <div className="prose-luxe pb-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: item.answer }} />
                ) : (
                  <p className="pb-4 text-sm leading-relaxed text-ink-soft [overflow-wrap:anywhere]">{item.answer}</p>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
