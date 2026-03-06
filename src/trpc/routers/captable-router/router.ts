import { createTRPCRouter } from "@/trpc/api/trpc";
import { getCapTableProcedure } from "./procedures/get-captable";
import { importSharesProcedure } from "./procedures/import-shares";

export const capTableRouter = createTRPCRouter({
  getCapTable: getCapTableProcedure,
  importShares: importSharesProcedure,
});
