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
  return {
    title: `${project.caseStudy.hero.title.en} · PREMPAWEE AI`,
    description: project.caseStudy.hero.subtitle.en,
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
