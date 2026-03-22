import { requireWeddingAccess } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  getGifts,
  getGiftGroups,
  getGiftBudgetSummary,
} from "@/actions/gift-actions";
import { GiftCatalog } from "@/components/gifts/gift-catalog";
import { GiftGuestAssignmentView } from "@/components/gifts/gift-guest-assignment-view";
import { GiftGroupAssignmentView } from "@/components/gifts/gift-assignment-view";
import { GiftBudgetSummary } from "@/components/gifts/gift-budget-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PageProps = {
  params: { weddingId: string };
};

export default async function GiftsPage({ params }: PageProps) {
  await requireWeddingAccess(params.weddingId);

  const [gifts, groups, budgetSummary, guests] = await Promise.all([
    getGifts(params.weddingId),
    getGiftGroups(params.weddingId),
    getGiftBudgetSummary(params.weddingId),
    prisma.guest.findMany({
      where: { weddingId: params.weddingId },
      include: {
        giftAssignments: {
          include: {
            gift: true,
          },
        },
      },
      orderBy: [
        { side: "asc" },
        { familyNameKana: "asc" },
        { familyName: "asc" },
        { givenNameKana: "asc" },
        { givenName: "asc" },
      ],
    }),
  ]);

  const catalogGifts = gifts.map((gift) => ({
    id: gift.id,
    name: gift.name,
    category: gift.category,
    unitPrice: gift.unitPrice,
    supplier: gift.supplier,
    note: gift.note,
  }));

  const giftOptions = gifts.map((gift) => ({
    id: gift.id,
    name: gift.name,
    category: gift.category,
    unitPrice: gift.unitPrice,
  }));

  const guestTargets = guests.map((guest) => ({
    id: guest.id,
    familyName: guest.familyName,
    givenName: guest.givenName,
    relationship: guest.relationship,
    side: guest.side,
    attendanceStatus: guest.attendanceStatus,
    assignments: guest.giftAssignments.map((assignment) => ({
      id: assignment.id,
      quantity: assignment.quantity,
      gift: {
        id: assignment.gift.id,
        name: assignment.gift.name,
        unitPrice: assignment.gift.unitPrice,
        category: assignment.gift.category,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">引き出物管理</h1>
        <p className="mt-1 text-muted-foreground">
          ギフトの登録、個別・グループ割当、予算の確認を行います。
        </p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="catalog">カタログ</TabsTrigger>
          <TabsTrigger value="guests">個別割当</TabsTrigger>
          <TabsTrigger value="groups">グループ割当</TabsTrigger>
          <TabsTrigger value="budget">予算</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <GiftCatalog gifts={catalogGifts} weddingId={params.weddingId} />
        </TabsContent>

        <TabsContent value="guests">
          <GiftGuestAssignmentView guests={guestTargets} gifts={giftOptions} />
        </TabsContent>

        <TabsContent value="groups">
          <GiftGroupAssignmentView
            groups={groups}
            gifts={giftOptions}
            weddingId={params.weddingId}
          />
        </TabsContent>

        <TabsContent value="budget">
          <GiftBudgetSummary summary={budgetSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
