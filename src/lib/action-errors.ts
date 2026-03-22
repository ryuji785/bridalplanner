import { Prisma } from "@prisma/client";

export function isMissingRecordError(error: unknown) {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025") ||
    (error instanceof Error && error.name === "NotFoundError")
  );
}
