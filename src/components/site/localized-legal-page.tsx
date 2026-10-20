import { Fragment } from "react";
import { LegalArticle, type LegalDocumentKey } from "@/components/site/legal-article";
import { siteConfig } from "@/config/site";
import type { LegalDocument } from "@/i18n/legal";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const EMAIL_PATTERN = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";

/** Mətndəki bütün e-poçt ünvanlarını (info@, security@, finance@ …) və şirkət telefonunu kliklənən link edir. */
function LinkedText({ text, phone, phoneHref }: { text: string; phone: string; phoneHref: string }) {
  const pattern = new RegExp(`(${EMAIL_PATTERN}|${escapeRegExp(phone)})`, "g");
  const tokens = text.split(pattern);
  return (
    <>
      {tokens.map((token, index) =>
        index % 2 === 1 ? (
          token === phone ? (
            <a key={index} href={phoneHref}>{token}</a>
          ) : (
            <a key={index} href={`mailto:${token}`}>{token}</a>
          )
        ) : (
          <Fragment key={index}>{token}</Fragment>
        ),
      )}
    </>
  );
}

export function LocalizedLegalPage({
  document,
  documentKey,
  path,
  actionAfterSection,
}: {
  document: LegalDocument;
  documentKey: LegalDocumentKey;
  path: string;
  /** Verilmiş id-li bölmənin mətnindən dərhal sonra göstərilən əməl (məs. «Cookie parametrləri» düyməsi). */
  actionAfterSection?: { id: string; node: React.ReactNode };
}) {
  const { phone, phoneHref } = siteConfig;
  const linked = (text: string) => <LinkedText text={text} phone={phone} phoneHref={phoneHref} />;
  // Hər h2 lövbər alır: sabit id varsa o (Meta keçidi), yoxsa sıra nömrəsi — mündəricat bunlara aparır.
  const sections = document.sections.map((section, index) => {
    if (section.level === 3) return { section, anchor: section.id };
    const position = document.sections.slice(0, index + 1).filter((item) => item.level !== 3).length;
    return { section, anchor: section.id ?? `bolme-${position}` };
  });
  const toc = sections
    .filter(({ section }) => section.level !== 3)
    .map(({ section, anchor }) => ({ id: anchor!, label: section.heading }));
  return (
    <LegalArticle
      title={document.title}
      description={document.description}
      updatedAt={document.updatedAt}
      path={path}
      activeDocument={documentKey}
      toc={toc}
      company={{
        legalName: siteConfig.legalName,
        voen: siteConfig.legal.voen,
        address: siteConfig.addressFull,
        email: siteConfig.email,
        phone,
        phoneHref,
      }}
    >
      <p>{document.introduction}</p>
      {sections.map(({ section, anchor }) => {
        const Heading = section.level === 3 ? "h3" : "h2";
        return (
          <Fragment key={section.heading}>
            <Heading id={anchor}>{section.heading}</Heading>
            {section.intro ? <p>{linked(section.intro)}</p> : null}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={`${bullet.label ?? ""}${bullet.text}`}>
                    {bullet.label ? (
                      <>
                        <strong>{bullet.label}</strong>{" "}
                      </>
                    ) : null}
                    {linked(bullet.text)}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.table ? (
              <>
                {/* Mobil ekranda hər sətir kartdır — cədvəl üfüqi sürüşməsin. */}
                <ul className="!flex !gap-3 !pl-0 sm:!hidden">
                  {section.table.rows.map((row) => (
                    <li key={row.join("|")} className="!list-none rounded-lg border border-line bg-ivory/40 p-4 !pl-4">
                      <p className="font-medium text-ink [overflow-wrap:anywhere]">
                        {section.table?.codeFirstColumn ? <code className="font-mono text-[13px]">{row[0]}</code> : row[0]}
                      </p>
                      <dl className="mt-2 flex flex-col gap-1.5 text-sm">
                        {row.slice(1).map((cell, cellIndex) => (
                          <div key={cellIndex}>
                            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">{section.table?.columns[cellIndex + 1]}</dt>
                            <dd>{linked(cell)}</dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
                {/* `relative` — içindəki element sənədi üfüqi daşdırmasın (CLAUDE.md responsive qaydası). */}
                <div className="relative hidden overflow-x-auto rounded-lg border border-line sm:block" role="region" aria-label={section.heading} tabIndex={0}>
                  <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                    <thead>
                      <tr>
                        {section.table.columns.map((column) => (
                          <th key={column} scope="col" className="border-b border-line-strong bg-ivory px-4 py-3 align-bottom text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row.join("|")} className="border-b border-line last:border-b-0 even:bg-ivory/40">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-3 align-top">
                              {cellIndex === 0 && section.table?.codeFirstColumn ? (
                                <code className="rounded-xs bg-ivory px-1 py-0.5 font-mono text-xs text-ink [overflow-wrap:anywhere]">{cell}</code>
                              ) : cellIndex === 0 ? (
                                <span className="font-medium text-ink">{cell}</span>
                              ) : (
                                linked(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{linked(paragraph)}</p>
            ))}
            {actionAfterSection && actionAfterSection.id === section.id ? <div>{actionAfterSection.node}</div> : null}
          </Fragment>
        );
      })}
    </LegalArticle>
  );
}
