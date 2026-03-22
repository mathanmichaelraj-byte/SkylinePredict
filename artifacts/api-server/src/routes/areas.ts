import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { areasTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ListAreasQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/areas", async (req, res) => {
  const query = ListAreasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { city } = query.data;

  const areas = await db
    .select()
    .from(areasTable)
    .where(city ? sql`${areasTable.city} ILIKE ${`%${city}%`}` : undefined);

  res.json(areas);
});

export default router;
