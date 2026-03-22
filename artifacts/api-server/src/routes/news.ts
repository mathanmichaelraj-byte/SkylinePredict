import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { newsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import { ListNewsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/news", async (req, res) => {
  const query = ListNewsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { area, limit } = query.data;

  const articles = await db
    .select()
    .from(newsTable)
    .where(area ? sql`${newsTable.area} ILIKE ${`%${area}%`}` : undefined)
    .orderBy(desc(newsTable.publishedAt))
    .limit(limit ?? 10);

  res.json(
    articles.map(a => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
    }))
  );
});

export default router;
