import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PROJECTS } from "@/lib/portfolio-data";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return PROJECTS.filter((p) => p.caseStudy !== undefined).map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project?.caseStudy) return {};
  // Stub-first release pattern (CLAUDE.md Case Study Pattern):
  // when any screenshot is stubbed, hide the page from Google until the
  // follow-up PR lands the real assets + flips stubbed=false.
  const hasStubbedScreenshots = project.caseStudy.screenshots.some(
    (s) => s.stubbed,
  );
  return {
    title: `${project.caseStudy.hero.title.en} · PREMPAWEE AI`,
    description: project.caseStudy.hero.subtitle.en,
    ...(hasStubbedScreenshots && {
      robots: { index: false, follow: false },
    }),
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project?.caseStudy) notFound();

  return <CaseStudyShell caseStudy={project.caseStudy} slug={project.slug} />;
}
