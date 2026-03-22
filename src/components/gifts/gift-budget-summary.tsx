import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatYen } from "@/lib/utils";

type BudgetSummary = {
  totalItems: number;
  totalCost: number;
  averagePerTarget: number;
  totalAssignments: number;
  assignedTargetCount: number;
  categoryBreakdown: Record<string, { count: number; totalCost: number }>;
};

const categoryLabels: Record<string, string> = {
  main: "メイン記念品",
  sweets: "引菓子",
  petite: "プチギフト",
};

type Props = {
  summary: BudgetSummary;
};

export function GiftBudgetSummary({ summary }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              引き出物総額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatYen(summary.totalCost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均単価
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatYen(summary.averagePerTarget)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.assignedTargetCount}件に割り当て
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              割当数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalAssignments}件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              登録ギフト数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalItems}件</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">カテゴリ別内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(summary.categoryBreakdown).map(([category, data]) => (
              <div
                key={category}
                className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <span className="font-medium">
                    {categoryLabels[category] ?? category}
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({data.count}件)
                  </span>
                </div>
                <span className="font-mono font-medium">
                  {formatYen(data.totalCost)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
