import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PostCardData, ProjectCardData } from "@/lib/queries";
import { AgencyCard } from "../agency-card";
import { PostCard } from "../post-card";
import { ProjectCard } from "../project-card";

describe("public kolleksiya kartları", () => {
  it("agentlik, layihə və bloq kartının əsas linkini 44 px hədəf edir", () => {
    const agencyHtml = renderToStaticMarkup(
      <AgencyCard
        agency={{
          id: "agency-1",
          name: "Luxe Partners",
          slug: "luxe-partners",
          logoUrl: null,
          phone: "+994 12 000 00 00",
          address: "Bakı",
          propertyCount: 12,
        }}
      />,
    );
    const projectHtml = renderToStaticMarkup(
      <ProjectCard
        project={{
          id: "project-1",
          name: "Sahil Residence",
          slug: "sahil-residence",
          summary: "Premium yaşayış layihəsi",
          projectType: "RESIDENTIAL",
          status: "ONGOING",
          year: 2027,
          coverUrl: null,
          city: { name: "Bakı" },
        } as ProjectCardData}
      />,
    );
    const postHtml = renderToStaticMarkup(
      <PostCard
        post={{
          id: "post-1",
          title: "Əmlak seçimi",
          slug: "emlak-secimi",
          excerpt: "Doğru seçim üçün bələdçi.",
          coverUrl: null,
          coverAlt: "",
          readMinutes: 4,
          publishedAt: new Date("2026-08-20T10:00:00Z"),
          category: { name: "Bələdçi", slug: "beledci" },
        } as PostCardData}
      />,
    );

    expect(agencyHtml).toMatch(/<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*href="\/agentlikler\//);
    expect(projectHtml).toMatch(/<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*href="\/layiheler\//);
    expect(postHtml).toMatch(/<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*href="\/blog\//);
  });
});
