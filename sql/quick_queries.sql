-- ========================================
-- QUICK QUERIES - Essential Analytics
-- Run these for quick insights
-- ========================================

-- 1. Overall Summary
SELECT 
    COUNT(DISTINCT c.crop_id) AS unique_crops,
    COUNT(DISTINCT l.location_id) AS unique_locations,
    COUNT(f.fact_id) AS total_records,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
JOIN climatecrop.dim_location l ON f.location_id = l.location_id;

-- 2. Top 10 Crops by Revenue
SELECT 
    c.crop_name,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
GROUP BY c.crop_name
ORDER BY total_revenue_millions_pkr DESC
LIMIT 10;

-- 3. Top 10 Districts by Revenue
SELECT 
    l.district,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count,
    AVG(f.climate_score) AS avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
GROUP BY l.district
ORDER BY total_revenue_millions_pkr DESC
LIMIT 10;

-- 4. Revenue by Year
SELECT 
    t.year,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.year
ORDER BY t.year;

-- 5. Climate Risk Distribution
SELECT 
    s."climate_risk_level",
    COUNT(*) AS record_count,
    AVG(s."climate_score") AS avg_climate_score,
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS avg_revenue_millions_pkr
FROM public.staging_crop_data s
WHERE s."climate_risk_level" IS NOT NULL
GROUP BY s."climate_risk_level"
ORDER BY avg_climate_score DESC;

-- 6. Best Yielding Crops
SELECT 
    c.crop_name,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
GROUP BY c.crop_name
ORDER BY avg_yield_kg_per_acre DESC
LIMIT 10;

-- 7. Seasonal Performance
SELECT 
    t.season,
    COUNT(f.fact_id) AS record_count,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.season
ORDER BY total_revenue_millions_pkr DESC;

-- 8. Model Prediction Comparison
SELECT 
    s."Crop",
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS actual_avg_millions,
    AVG(s."XGBoost_Tuned_Predicted_Revenue") / 1000000.0 AS predicted_avg_millions,
    AVG(ABS(s."Total_Revenue_PKR" - s."XGBoost_Tuned_Predicted_Revenue")) / 1000000.0 AS avg_error_millions
FROM public.staging_crop_data s
WHERE s."Total_Revenue_PKR" IS NOT NULL
GROUP BY s."Crop"
ORDER BY actual_avg_millions DESC
LIMIT 10;

-- 9. Crop-District Best Combinations
SELECT 
    c.crop_name,
    l.district,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
GROUP BY c.crop_name, l.district
HAVING COUNT(f.fact_id) >= 2
ORDER BY avg_yield_kg_per_acre DESC
LIMIT 15;

-- 10. Price Analysis by Crop
SELECT 
    s."Crop",
    AVG(s."Avg_Price_PKR") AS avg_price_pkr,
    MIN(s."Min_Price_PKR") AS min_price_pkr,
    MAX(s."Max_Price_PKR") AS max_price_pkr,
    COUNT(*) AS record_count
FROM public.staging_crop_data s
WHERE s."Avg_Price_PKR" IS NOT NULL
GROUP BY s."Crop"
ORDER BY avg_price_pkr DESC;

