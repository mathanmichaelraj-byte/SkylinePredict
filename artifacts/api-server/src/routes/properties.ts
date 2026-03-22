import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { propertiesTable, landmarksTable, priceHistoryTable, newsTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ListPropertiesQueryParams, GetPropertyParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/properties", async (req, res) => {
  const query = ListPropertiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { city, type, minPrice, maxPrice, valueLabel, verifiedOnly } = query.data;

  const conditions = [];
  if (city) conditions.push(sql`${propertiesTable.city} ILIKE ${`%${city}%`}`);
  if (type) conditions.push(eq(propertiesTable.type, type as any));
  if (minPrice) conditions.push(gte(propertiesTable.askingPrice, minPrice));
  if (maxPrice) conditions.push(lte(propertiesTable.askingPrice, maxPrice));
  if (valueLabel) conditions.push(eq(propertiesTable.valueLabel, valueLabel as any));
  if (verifiedOnly) conditions.push(eq(propertiesTable.verificationStatus, "verified"));

  const properties = await db
    .select()
    .from(propertiesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(properties);
});

router.get("/properties/:id", async (req, res) => {
  const params = GetPropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [property] = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.id, params.data.id));

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  const landmarks = await db
    .select()
    .from(landmarksTable)
    .where(eq(landmarksTable.propertyId, property.id));

  const priceHistory = await db
    .select()
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.propertyId, property.id));

  const areaNews = await db
    .select()
    .from(newsTable)
    .where(sql`${newsTable.area} ILIKE ${`%${property.area}%`}`)
    .limit(3);

  const newsSentiment = areaNews.length > 0
    ? (areaNews.filter(n => n.sentiment === "positive").length > areaNews.filter(n => n.sentiment === "negative").length ? "positive" : areaNews.filter(n => n.sentiment === "negative").length > 0 ? "negative" : "neutral")
    : "neutral";

  const investmentFactors: string[] = [];
  const riskFactors: string[] = [];

  if (property.connectivityScore >= 7) investmentFactors.push("Excellent connectivity to city center");
  if (property.futureOutlook === "high") investmentFactors.push("Strong future appreciation expected");
  if (property.verificationStatus === "verified") investmentFactors.push("Fully verified property documents");
  if (property.valueLabel === "green") investmentFactors.push("Priced at or below fair market value");
  if (landmarks.some(l => l.type === "metro")) investmentFactors.push("Near metro station");
  if (landmarks.some(l => l.type === "it_park")) investmentFactors.push("Close to IT park – high rental demand");
  if (areaNews.some(n => n.sentiment === "positive" && n.topic === "infra")) investmentFactors.push("Positive infrastructure development nearby");

  if (property.valueLabel === "blue") riskFactors.push("Currently overpriced vs fair market value");
  if (property.connectivityScore < 5) riskFactors.push("Low connectivity score");
  if (property.futureOutlook === "low") riskFactors.push("Limited future appreciation potential");
  if (property.verificationStatus === "unverified") riskFactors.push("Property documents not yet verified");
  if (areaNews.some(n => n.sentiment === "negative" && (n.topic === "legal" || n.topic === "environment"))) riskFactors.push("Negative legal or environmental news nearby");

  res.json({
    ...property,
    landmarks: landmarks.map(l => ({ name: l.name, type: l.type, distanceKm: l.distanceKm })),
    newsSentiment,
    newsHeadlines: areaNews.map(n => n.title),
    investmentFactors,
    riskFactors,
    priceHistory: priceHistory.map(p => ({ month: p.month, pricePerSqft: p.pricePerSqft })),
  });
});

export default router;
