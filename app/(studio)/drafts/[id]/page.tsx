import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DraftEditor } from "@/components/draft-editor";
import { draftToColors, draftToDims, draftToGrids } from "@/services/drafts";

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DraftPageProps): Promise<Metadata> {
  const { id } = await params;
  const draft = await prisma.draft.findUnique({ where: { id } });
  return { title: draft?.name ?? "Draft" };
}

export default async function DraftPage({ params }: DraftPageProps) {
  const context = await requireStudio();
  const { id } = await params;
  const draft = await prisma.draft.findFirst({ where: { id, studioId: context.studioId } });
  if (!draft) notFound();

  const grids = draftToGrids(draft);
  const colors = draftToColors(draft);
  const dims = draftToDims(draft);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">Draft editor</p>
          <h1>{draft.name}</h1>
        </div>
        <Link href="/drafts" className="quiet-link">
          All drafts
        </Link>
      </div>

      <DraftEditor
        draftId={draft.id}
        canEdit={hasRole(context.role, ["WEAVER", "MANAGER"])}
        canRelease={hasRole(context.role, ["MANAGER"])}
        initial={{
          name: draft.name,
          revision: draft.revision,
          threading: grids.threading,
          tieUp: grids.tieUp,
          treadling: grids.treadling,
          warpColors: colors.warpColors,
          weftColors: colors.weftColors,
          settEpi: dims.settEpi,
          reedWidthCm: dims.reedWidthCm,
          warpLengthCm: dims.warpLengthCm,
          takeUpPct: dims.takeUpPct,
          shrinkagePct: dims.shrinkagePct,
        }}
      />
    </>
  );
}