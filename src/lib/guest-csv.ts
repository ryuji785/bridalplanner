import Papa from "papaparse";
import { guestCreateSchema } from "@/lib/validators/guest";

export const GUEST_CSV_HEADERS = [
  "id",
  "姓",
  "名",
  "姓カナ",
  "名カナ",
  "関係",
  "新郎新婦側",
  "出欠",
  "郵便番号",
  "住所",
  "メール",
  "電話",
  "食事制限",
  "アレルギー",
  "メモ",
  "同伴者あり",
  "お子様",
] as const;

type GuestCsvHeader = (typeof GUEST_CSV_HEADERS)[number];
type GuestCsvRecord = Partial<Record<GuestCsvHeader, string>>;

export type GuestCsvWriteData = {
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relationship: string;
  side: "bride" | "groom";
  attendanceStatus: "pending" | "attending" | "declined";
  postalCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  dietaryRestrictions: string | null;
  allergies: string | null;
  note: string | null;
  plusOne: boolean;
  isChild: boolean;
};

export type ParsedGuestCsvRow = {
  rowNumber: number;
  id?: string;
  data: GuestCsvWriteData;
};

export type GuestCsvParseResult =
  | { success: true; rows: ParsedGuestCsvRow[] }
  | { success: false; errors: string[] };

type ExportGuest = {
  id: string;
  familyName: string;
  givenName: string;
  familyNameKana: string | null;
  givenNameKana: string | null;
  relationship: string;
  side: string;
  attendanceStatus: string;
  postalCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  dietaryRestrictions: string | null;
  allergies: string | null;
  note: string | null;
  plusOne: boolean;
  isChild: boolean;
};

type ParseResult<T> =
  | { valid: true; value?: T }
  | { valid: false; value: T; message: string };

const sideLabels: Record<"bride" | "groom", string> = {
  bride: "新婦側",
  groom: "新郎側",
};

const statusLabels: Record<"pending" | "attending" | "declined", string> = {
  pending: "未確認",
  attending: "出席",
  declined: "欠席",
};

function normalizeString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeNullableString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseSide(
  value: string | undefined,
  rowNumber: number
): ParseResult<"bride" | "groom"> {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    return { valid: true, value: undefined };
  }

  if (normalized === "bride" || normalized === "新婦側") {
    return { valid: true, value: "bride" };
  }

  if (normalized === "groom" || normalized === "新郎側") {
    return { valid: true, value: "groom" };
  }

  return {
    valid: false,
    value: "bride",
    message:
      `${rowNumber}行目: 新郎新婦側は bride / groom または 新婦側 / 新郎側 で指定してください。`,
  };
}

function parseAttendanceStatus(
  value: string | undefined,
  rowNumber: number
): ParseResult<"pending" | "attending" | "declined"> {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    return { valid: true, value: undefined };
  }

  if (normalized === "pending" || normalized === "未確認") {
    return { valid: true, value: "pending" };
  }

  if (normalized === "attending" || normalized === "出席") {
    return { valid: true, value: "attending" };
  }

  if (normalized === "declined" || normalized === "欠席") {
    return { valid: true, value: "declined" };
  }

  return {
    valid: false,
    value: "pending",
    message:
      `${rowNumber}行目: 出欠は pending / attending / declined または 未確認 / 出席 / 欠席 で指定してください。`,
  };
}

function parseBoolean(
  value: string | undefined,
  rowNumber: number,
  fieldLabel: string
): ParseResult<boolean> {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    return { valid: true, value: undefined };
  }

  if (["true", "1", "はい"].includes(normalized)) {
    return { valid: true, value: true };
  }

  if (["false", "0", "いいえ"].includes(normalized)) {
    return { valid: true, value: false };
  }

  return {
    valid: false,
    value: false,
    message:
      `${rowNumber}行目: ${fieldLabel} は true / false、1 / 0、はい / いいえ で指定してください。`,
  };
}

export function formatGuestCsv(guests: ExportGuest[]) {
  const rows = guests.map((guest) => ({
    id: guest.id,
    姓: guest.familyName,
    名: guest.givenName,
    姓カナ: guest.familyNameKana ?? "",
    名カナ: guest.givenNameKana ?? "",
    関係: guest.relationship,
    新郎新婦側:
      guest.side === "groom" ? sideLabels.groom : sideLabels.bride,
    出欠:
      guest.attendanceStatus === "attending"
        ? statusLabels.attending
        : guest.attendanceStatus === "declined"
          ? statusLabels.declined
          : statusLabels.pending,
    郵便番号: guest.postalCode ?? "",
    住所: guest.address ?? "",
    メール: guest.email ?? "",
    電話: guest.phone ?? "",
    食事制限: guest.dietaryRestrictions ?? "",
    アレルギー: guest.allergies ?? "",
    メモ: guest.note ?? "",
    同伴者あり: guest.plusOne ? "はい" : "いいえ",
    お子様: guest.isChild ? "はい" : "いいえ",
  }));

  return `\uFEFF${Papa.unparse(rows, {
    columns: [...GUEST_CSV_HEADERS],
    newline: "\r\n",
  })}`;
}

export function parseGuestCsv(csvText: string): GuestCsvParseResult {
  const parsed = Papa.parse<GuestCsvRecord>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  const errors: string[] = [];

  if (parsed.errors.length > 0) {
    for (const error of parsed.errors) {
      errors.push(`CSV解析エラー: ${error.message}`);
    }
  }

  const headers = parsed.meta.fields ?? [];
  const missingHeaders = GUEST_CSV_HEADERS.filter(
    (header) => !headers.includes(header)
  );

  if (missingHeaders.length > 0) {
    errors.push(`CSVヘッダーが不足しています: ${missingHeaders.join("、")}`);
  }

  if (parsed.data.length === 0) {
    errors.push("CSVに取り込むデータ行がありません。");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const seenIds = new Set<string>();
  const rows: ParsedGuestCsvRow[] = [];

  parsed.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: string[] = [];
    const id = normalizeString(row.id) || undefined;

    if (id) {
      if (seenIds.has(id)) {
        rowErrors.push(`${rowNumber}行目: id が重複しています。`);
      } else {
        seenIds.add(id);
      }
    }

    const side = parseSide(row["新郎新婦側"], rowNumber);
    const attendanceStatus = parseAttendanceStatus(row["出欠"], rowNumber);
    const plusOne = parseBoolean(row["同伴者あり"], rowNumber, "同伴者あり");
    const isChild = parseBoolean(row["お子様"], rowNumber, "お子様");

    if (!side.valid) rowErrors.push(side.message);
    if (!attendanceStatus.valid) rowErrors.push(attendanceStatus.message);
    if (!plusOne.valid) rowErrors.push(plusOne.message);
    if (!isChild.valid) rowErrors.push(isChild.message);

    const validationTarget = {
      familyName: normalizeString(row["姓"]),
      givenName: normalizeString(row["名"]),
      familyNameKana: normalizeNullableString(row["姓カナ"]) ?? undefined,
      givenNameKana: normalizeNullableString(row["名カナ"]) ?? undefined,
      relationship: normalizeString(row["関係"]),
      side: side.value,
      attendanceStatus: attendanceStatus.value,
      postalCode: normalizeNullableString(row["郵便番号"]) ?? undefined,
      address: normalizeNullableString(row["住所"]) ?? undefined,
      email: normalizeNullableString(row["メール"]) ?? undefined,
      phone: normalizeNullableString(row["電話"]) ?? undefined,
      dietaryRestrictions:
        normalizeNullableString(row["食事制限"]) ?? undefined,
      allergies: normalizeNullableString(row["アレルギー"]) ?? undefined,
      note: normalizeNullableString(row["メモ"]) ?? undefined,
      plusOne: plusOne.value,
      isChild: isChild.value,
    };

    const validation = guestCreateSchema.safeParse(validationTarget);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      for (const messages of Object.values(fieldErrors)) {
        for (const message of messages ?? []) {
          rowErrors.push(`${rowNumber}行目: ${message}`);
        }
      }
      errors.push(...rowErrors);
      return;
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    const validatedData = validation.data;

    rows.push({
      rowNumber,
      id,
      data: {
        familyName: validationTarget.familyName,
        givenName: validationTarget.givenName,
        familyNameKana: normalizeNullableString(row["姓カナ"]),
        givenNameKana: normalizeNullableString(row["名カナ"]),
        relationship: validationTarget.relationship,
        side: validatedData.side,
        attendanceStatus: validatedData.attendanceStatus,
        postalCode: normalizeNullableString(row["郵便番号"]),
        address: normalizeNullableString(row["住所"]),
        email: normalizeNullableString(row["メール"]),
        phone: normalizeNullableString(row["電話"]),
        dietaryRestrictions: normalizeNullableString(row["食事制限"]),
        allergies: normalizeNullableString(row["アレルギー"]),
        note: normalizeNullableString(row["メモ"]),
        plusOne: validatedData.plusOne,
        isChild: validatedData.isChild,
      },
    });
  });

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, rows };
}
