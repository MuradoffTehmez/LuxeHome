import { Fragment } from "react";
import { LegalArticle } from "@/components/site/legal-article";
import type { LegalDocument } from "@/i18n/public-content";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function LinkedParagraph({
  text,
  email,
  phone,
  phoneHref,
}: {
  text: string;
  email: string;
  phone: string;
  phoneHref: string;
}) {
  const tokens = text.split(new RegExp(`(${escapeRegExp(email)}|${escapeRegExp(phone)})`, "g"));

  return (
    <p>
      {tokens.map((token, index) => (
        <Fragment key={`${token}-${index}`}>
          {token === email ? <a href={`mailto:${email}`}>{email}</a> : token === phone ? <a href={phoneHref}>{phone}</a> : token}
        </Fragment>
      ))}
    </p>
  );
}

export function LocalizedLegalPage({
  document,
  path,
  email,
  phone,
  phoneHref,
}: {
  document: LegalDocument;
  path: string;
  email: string;
  phone: string;
  phoneHref: string;
}) {
  return (
    <LegalArticle
      title={document.title}
      description={document.description}
      updatedAt={document.updatedAt}
      path={path}
    >
      <p>{document.introduction}</p>
      {document.sections.map((section) => (
        <Fragment key={section.heading}>
          <h2>{section.heading}</h2>
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={`${bullet.label ?? ""}${bullet.text}`}>
                  {bullet.label ? (
                    <>
                      <strong>{bullet.label}</strong>{" "}
                    </>
                  ) : null}
                  {bullet.text}
                </li>
              ))}
            </ul>
          ) : null}
          {section.paragraphs?.map((paragraph) => (
            <LinkedParagraph
              key={paragraph}
              text={paragraph}
              email={email}
              phone={phone}
              phoneHref={phoneHref}
            />
          ))}
        </Fragment>
      ))}
    </LegalArticle>
  );
}
