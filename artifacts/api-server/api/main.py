import os
import math
from typing import Optional, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="PropertyIntel API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_conn():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def snake_to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def to_camel(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {snake_to_camel(k): to_camel(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_camel(i) for i in obj]
    return obj


def rows_to_camel(rows) -> list:
    return [to_camel(dict(r)) for r in rows]


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/healthz")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


# ─── Properties ───────────────────────────────────────────────────────────────

@app.get("/api/properties")
def list_properties(
    city: Optional[str] = None,
    type: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    valueLabel: Optional[str] = None,
    verifiedOnly: Optional[bool] = None,
    q: Optional[str] = None,
):
    conn = get_conn()
    cur = conn.cursor()

    sql = "SELECT * FROM properties WHERE 1=1"
    params: list = []

    if city:
        sql += " AND city ILIKE %s"
        params.append(f"%{city}%")
    if type:
        sql += " AND type = %s"
        params.append(type)
    if minPrice is not None:
        sql += " AND asking_price >= %s"
        params.append(minPrice)
    if maxPrice is not None:
        sql += " AND asking_price <= %s"
        params.append(maxPrice)
    if valueLabel:
        sql += " AND value_label = %s"
        params.append(valueLabel)
    if verifiedOnly:
        sql += " AND verification_status = 'verified'"
    if q:
        sql += " AND (title ILIKE %s OR area ILIKE %s OR address ILIKE %s OR city ILIKE %s)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"])

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return JSONResponse(content=rows_to_camel(rows))


@app.get("/api/search")
def search_properties(q: str, city: Optional[str] = "Chennai", limit: int = 8):
    """Fast search endpoint returning property + area suggestions."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, title, area, city, lat, lng, asking_price, value_label, type
        FROM properties
        WHERE (title ILIKE %s OR area ILIKE %s OR address ILIKE %s)
          AND city ILIKE %s
        ORDER BY value_score DESC
        LIMIT %s
    """, (f"%{q}%", f"%{q}%", f"%{q}%", f"%{city}%", limit))
    props = [to_camel(dict(r)) for r in cur.fetchall()]

    cur.execute("""
        SELECT DISTINCT area, city, AVG(lat) as lat, AVG(lng) as lng
        FROM properties
        WHERE area ILIKE %s AND city ILIKE %s
        GROUP BY area, city
        LIMIT 5
    """, (f"%{q}%", f"%{city}%"))
    areas = [to_camel(dict(r)) for r in cur.fetchall()]

    # Also search areas table
    cur.execute("""
        SELECT name as area, city, lat, lng
        FROM areas
        WHERE (name ILIKE %s OR city ILIKE %s)
        LIMIT 5
    """, (f"%{q}%", f"%{city}%"))
    area_rows = [to_camel(dict(r)) for r in cur.fetchall()]
    
    # Merge areas
    existing_names = {a["area"] for a in areas}
    for ar in area_rows:
        if ar["area"] not in existing_names:
            areas.append(ar)

    conn.close()
    return JSONResponse(content={"properties": props, "areas": areas[:6]})


@app.get("/api/properties/{prop_id}")
def get_property(prop_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT * FROM properties WHERE id = %s", (prop_id,))
    prop = cur.fetchone()
    if not prop:
        conn.close()
        raise HTTPException(status_code=404, detail="Property not found")

    prop = dict(prop)

    cur.execute("SELECT name, type, distance_km AS \"distanceKm\" FROM landmarks WHERE property_id = %s", (prop_id,))
    landmarks = [dict(r) for r in cur.fetchall()]

    cur.execute("SELECT month, price_per_sqft AS \"pricePerSqft\" FROM price_history WHERE property_id = %s ORDER BY id", (prop_id,))
    price_history = [dict(r) for r in cur.fetchall()]

    cur.execute(
        "SELECT title, sentiment, topic FROM news WHERE area ILIKE %s LIMIT 3",
        (f"%{prop['area']}%",)
    )
    area_news = cur.fetchall()
    conn.close()

    positives = sum(1 for n in area_news if n["sentiment"] == "positive")
    negatives = sum(1 for n in area_news if n["sentiment"] == "negative")
    if positives > negatives:
        news_sentiment = "positive"
    elif negatives > positives:
        news_sentiment = "negative"
    else:
        news_sentiment = "neutral"

    investment_factors: list[str] = []
    risk_factors: list[str] = []

    if prop["connectivity_score"] >= 7:
        investment_factors.append("Excellent connectivity to city center")
    if prop["future_outlook"] == "high":
        investment_factors.append("Strong future appreciation expected")
    if prop["verification_status"] == "verified":
        investment_factors.append("Fully verified property documents")
    if prop["value_label"] == "green":
        investment_factors.append("Priced at or below fair market value")
    if any(l["type"] == "metro" for l in landmarks):
        investment_factors.append("Near metro / MRTS station")
    if any(l["type"] == "it_park" for l in landmarks):
        investment_factors.append("Close to IT park — high rental demand")
    if any(n["sentiment"] == "positive" and n["topic"] == "infra" for n in area_news):
        investment_factors.append("Positive infrastructure development news")

    if prop["value_label"] == "blue":
        risk_factors.append("Currently overpriced vs fair market value")
    if prop["connectivity_score"] < 5:
        risk_factors.append("Low connectivity score")
    if prop["future_outlook"] == "low":
        risk_factors.append("Limited future appreciation potential")
    if prop["verification_status"] == "unverified":
        risk_factors.append("Property documents not yet verified")
    if any(n["sentiment"] == "negative" and n["topic"] in ("legal", "environment") for n in area_news):
        risk_factors.append("Negative legal or environmental news nearby")

    result = {
        **to_camel(prop),
        "landmarks": landmarks,
        "newsSentiment": news_sentiment,
        "newsHeadlines": [n["title"] for n in area_news],
        "investmentFactors": investment_factors,
        "riskFactors": risk_factors,
        "priceHistory": price_history,
    }
    return JSONResponse(content=result)


# ─── Areas ────────────────────────────────────────────────────────────────────

@app.get("/api/areas")
def list_areas(city: Optional[str] = None):
    conn = get_conn()
    cur = conn.cursor()
    if city:
        cur.execute("SELECT * FROM areas WHERE city ILIKE %s ORDER BY future_score DESC", (f"%{city}%",))
    else:
        cur.execute("SELECT * FROM areas ORDER BY future_score DESC")
    rows = cur.fetchall()
    conn.close()
    return JSONResponse(content=rows_to_camel(rows))


# ─── Places (POIs) ────────────────────────────────────────────────────────────

@app.get("/api/places")
def list_places(
    city: Optional[str] = "Chennai",
    type: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
):
    conn = get_conn()
    cur = conn.cursor()

    sql = "SELECT * FROM places WHERE 1=1"
    params: list = []

    if city:
        sql += " AND city ILIKE %s"
        params.append(f"%{city}%")
    if type:
        sql += " AND type = %s"
        params.append(type)
    if lat is not None and lng is not None and radius_km is not None:
        sql += """
          AND (
            6371 * acos(LEAST(1.0, GREATEST(-1.0,
              cos(radians(%s)) * cos(radians(lat)) *
              cos(radians(lng) - radians(%s)) +
              sin(radians(%s)) * sin(radians(lat))
            )))
          ) <= %s
        """
        params.extend([lat, lng, lat, radius_km])

    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    return JSONResponse(content=rows_to_camel(rows))


# ─── Price Prediction Engine ───────────────────────────────────────────────────

@app.get("/api/predict")
def predict_property_value(
    area: str,
    target_year: int,
    city: Optional[str] = "Chennai",
    property_type: Optional[str] = "flat",
    area_sqft: Optional[float] = None,
):
    """
    AI Price Prediction Engine
    Predicts property value for a given area and target year.
    Uses area stats, POI density, historical appreciation, and market signals.
    """
    import datetime
    current_year = datetime.datetime.now().year
    years_ahead = target_year - current_year

    if years_ahead < 0:
        raise HTTPException(status_code=400, detail="Target year must be in the future")
    if years_ahead > 20:
        raise HTTPException(status_code=400, detail="Cannot predict more than 20 years ahead")

    conn = get_conn()
    cur = conn.cursor()

    # 1. Get area data
    cur.execute("""
        SELECT * FROM areas WHERE name ILIKE %s AND city ILIKE %s LIMIT 1
    """, (f"%{area}%", f"%{city}%"))
    area_row = cur.fetchone()

    # Fallback: find nearest area by name similarity
    if not area_row:
        cur.execute("SELECT * FROM areas WHERE city ILIKE %s ORDER BY future_score DESC LIMIT 1", (f"%{city}%",))
        area_row = cur.fetchone()

    if not area_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Area not found")

    area_data = dict(area_row)

    # 2. Get average price from properties in this area
    cur.execute("""
        SELECT AVG(price_per_sqft) as avg_psqft, AVG(value_score) as avg_vs, COUNT(*) as count
        FROM properties
        WHERE area ILIKE %s AND city ILIKE %s AND type = %s
    """, (f"%{area}%", f"%{city}%", property_type))
    prop_stats = cur.fetchone()

    base_psqft = area_data.get("avg_price_per_sqft") or 6000
    if prop_stats and prop_stats["avg_psqft"]:
        # Blend area average with property-type-specific average
        base_psqft = (float(base_psqft) + float(prop_stats["avg_psqft"])) / 2

    # 3. Get POI score for the area
    area_lat = area_data["lat"]
    area_lng = area_data["lng"]
    cur.execute("SELECT type FROM places WHERE city ILIKE %s", (f"%{city}%",))
    all_places = cur.fetchall()

    hospitals = schools = colleges = police = parks = metros = 0
    for p in all_places:
        # We already have all places in memory, filter by proximity
        pass

    cur.execute("""
        SELECT type, COUNT(*) as cnt FROM places
        WHERE city ILIKE %s
          AND (6371 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians(%s)) * cos(radians(lat)) *
            cos(radians(lng) - radians(%s)) +
            sin(radians(%s)) * sin(radians(lat))
          )))) <= 5
        GROUP BY type
    """, (f"%{city}%", area_lat, area_lng, area_lat))
    poi_counts = {row["type"]: row["cnt"] for row in cur.fetchall()}

    hospitals = poi_counts.get("hospital", 0)
    schools = poi_counts.get("school", 0) + poi_counts.get("college", 0)
    police = poi_counts.get("police_station", 0)
    parks = poi_counts.get("park", 0)
    metros = poi_counts.get("metro_station", 0)

    # POI-based amenity boost (0-30% growth boost)
    poi_score = min(hospitals * 3 + schools * 2.5 + police * 2 + parks * 2 + metros * 3, 30)
    poi_boost = poi_score / 100  # e.g. 0.15 for 15% boost to growth rate

    # 4. Base annual growth rate from area data
    base_appreciation = float(area_data.get("appreciation_1y") or 8.0) / 100
    future_score = float(area_data.get("future_score") or 7.0)

    # Clamp and weight
    base_rate = min(max(base_appreciation, 0.02), 0.25)

    # Property type modifier
    type_modifier = {
        "flat": 1.0,
        "villa": 1.05,
        "house": 0.98,
        "plot": 1.12,  # plots appreciate faster in fast-growing areas
    }.get(property_type or "flat", 1.0)

    # Final annual growth rates
    optimistic_rate = min((base_rate * 1.3 + poi_boost * 0.5) * type_modifier, 0.30)
    base_rate_final = min((base_rate + poi_boost * 0.3) * type_modifier, 0.22)
    conservative_rate = min((base_rate * 0.65) * type_modifier, 0.15)

    # 5. Compute yearly projections
    projections = []
    for y in range(current_year, target_year + 1):
        yr_ahead = y - current_year
        opt_psqft = round(base_psqft * ((1 + optimistic_rate) ** yr_ahead))
        base_psqft_yr = round(base_psqft * ((1 + base_rate_final) ** yr_ahead))
        cons_psqft = round(base_psqft * ((1 + conservative_rate) ** yr_ahead))

        opt_total = round(opt_psqft * area_sqft) if area_sqft else None
        base_total = round(base_psqft_yr * area_sqft) if area_sqft else None
        cons_total = round(cons_psqft * area_sqft) if area_sqft else None

        projections.append({
            "year": y,
            "optimisticPsqft": opt_psqft,
            "basePsqft": base_psqft_yr,
            "conservativePsqft": cons_psqft,
            "optimisticTotal": opt_total,
            "baseTotal": base_total,
            "conservativeTotal": cons_total,
        })

    # 6. Target year result
    target = projections[-1] if projections else {}
    
    # 7. Key drivers
    drivers = []
    if metros > 0:
        drivers.append({"factor": f"{int(metros)} metro station(s) within 5km", "impact": "high", "effect": "positive"})
    if hospitals > 0:
        drivers.append({"factor": f"{int(hospitals)} hospital(s) within 5km", "impact": "medium", "effect": "positive"})
    if schools > 0:
        drivers.append({"factor": f"{int(schools)} school/college(s) within 5km", "impact": "medium", "effect": "positive"})
    if parks > 0:
        drivers.append({"factor": f"{int(parks)} park(s) within 5km", "impact": "low", "effect": "positive"})
    if future_score >= 8.5:
        drivers.append({"factor": "High infrastructure development planned", "impact": "high", "effect": "positive"})
    elif future_score >= 7.0:
        drivers.append({"factor": "Moderate infrastructure development", "impact": "medium", "effect": "positive"})
    else:
        drivers.append({"factor": "Limited infrastructure development", "impact": "medium", "effect": "negative"})

    # Sentiment
    cur.execute("""
        SELECT sentiment, COUNT(*) as cnt FROM news WHERE area ILIKE %s GROUP BY sentiment
    """, (f"%{area}%",))
    sentiment_rows = {row["sentiment"]: row["cnt"] for row in cur.fetchall()}
    pos = sentiment_rows.get("positive", 0)
    neg = sentiment_rows.get("negative", 0)
    area_sentiment = "positive" if pos > neg else ("negative" if neg > pos else "neutral")

    if area_sentiment == "positive":
        drivers.append({"factor": "Positive area news & sentiment", "impact": "medium", "effect": "positive"})
    elif area_sentiment == "negative":
        drivers.append({"factor": "Negative area sentiment detected", "impact": "medium", "effect": "negative"})

    conn.close()

    return JSONResponse(content={
        "area": area_data["name"],
        "city": city,
        "propertyType": property_type,
        "currentYear": current_year,
        "targetYear": target_year,
        "yearsAhead": years_ahead,
        "basePricePerSqft": round(base_psqft),
        "targetPricePerSqft": target.get("basePsqft"),
        "targetOptimisticPsqft": target.get("optimisticPsqft"),
        "targetConservativePsqft": target.get("conservativePsqft"),
        "targetBaseTotal": target.get("baseTotal"),
        "targetOptimisticTotal": target.get("optimisticTotal"),
        "targetConservativeTotal": target.get("conservativeTotal"),
        "baseAnnualGrowthRate": round(base_rate_final * 100, 2),
        "optimisticAnnualGrowthRate": round(optimistic_rate * 100, 2),
        "conservativeAnnualGrowthRate": round(conservative_rate * 100, 2),
        "amenityScore": round(poi_score),
        "futurePotentialScore": future_score,
        "areaSentiment": area_sentiment,
        "projections": projections,
        "drivers": drivers,
        "areaSqft": area_sqft,
    })


# ─── News ─────────────────────────────────────────────────────────────────────

@app.get("/api/news")
def list_news(area: Optional[str] = None, limit: int = 20):
    conn = get_conn()
    cur = conn.cursor()
    if area:
        cur.execute(
            "SELECT * FROM news WHERE area ILIKE %s ORDER BY published_at DESC LIMIT %s",
            (f"%{area}%", limit)
        )
    else:
        cur.execute("SELECT * FROM news ORDER BY published_at DESC LIMIT %s", (limit,))
    rows = cur.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = to_camel(dict(r))
        pub = d.get("publishedAt")
        d["publishedAt"] = pub.isoformat() if hasattr(pub, "isoformat") else (pub or "")
        result.append(d)
    return JSONResponse(content=result)
