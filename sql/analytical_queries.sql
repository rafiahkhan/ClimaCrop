-- ========================================
-- ANALYTICAL QUERIES FOR CROP DATA WAREHOUSE
-- Run these queries to explore and analyze your data
-- ========================================

-- ========================================
-- 1. BASIC DATA OVERVIEW
-- ========================================

-- Total records in each table
SELECT 'Staging' AS table_name, COUNT(*) AS row_count FROM public.staging_crop_data
UNION ALL
SELECT 'Dim Crop', COUNT(*) FROM climatecrop.dim_crop
UNION ALL
SELECT 'Dim Location', COUNT(*) FROM climatecrop.dim_location
UNION ALL
SELECT 'Dim Time', COUNT(*) FROM climatecrop.dim_time
UNION ALL
SELECT 'Fact Table', COUNT(*) FROM climatecrop.fact_crop_yield;

-- ========================================
-- 2. CROP ANALYSIS
-- ========================================

-- Top 10 crops by total production
SELECT 
    c.crop_name,
    COUNT(f.fact_id) AS record_count,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    AVG(f.production_kg) / 1000.0 AS avg_production_thousands_kg,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
GROUP BY c.crop_name
ORDER BY total_production_millions_kg DESC
LIMIT 10;

-- Crop varieties analysis
SELECT 
    c.crop_name,
    c.variety,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
WHERE c.variety IS NOT NULL
GROUP BY c.crop_name, c.variety
ORDER BY c.crop_name, avg_yield_kg_per_acre DESC
LIMIT 20;

-- Crops with highest yield per acre
SELECT 
    c.crop_name,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.avg_yield_maunds_per_acre) AS avg_yield_maunds_per_acre,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
GROUP BY c.crop_name
ORDER BY avg_yield_kg_per_acre DESC
LIMIT 10;

-- ========================================
-- 3. REVENUE ANALYSIS
-- ========================================

-- Revenue by crop
SELECT 
    c.crop_name,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    MIN(f.total_revenue_pkr) / 1000000.0 AS min_revenue_millions_pkr,
    MAX(f.total_revenue_pkr) / 1000000.0 AS max_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
GROUP BY c.crop_name
ORDER BY total_revenue_billions_pkr DESC;

-- Revenue by district
SELECT 
    l.district,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
GROUP BY l.district
ORDER BY total_revenue_billions_pkr DESC;

-- Revenue by year
SELECT 
    t.year,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.year
ORDER BY t.year;

-- Revenue by season
SELECT 
    t.season,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.season
ORDER BY total_revenue_billions_pkr DESC;

-- ========================================
-- 4. CLIMATE IMPACT ANALYSIS
-- ========================================

-- Climate score distribution
SELECT 
    CASE 
        WHEN s."climate_score" < 0.3 THEN 'Low (0-0.3)'
        WHEN s."climate_score" < 0.6 THEN 'Medium (0.3-0.6)'
        WHEN s."climate_score" < 0.8 THEN 'High (0.6-0.8)'
        ELSE 'Very High (0.8+)'
    END AS climate_score_range,
    COUNT(*) AS record_count,
    AVG(s."climate_score") AS avg_climate_score,
    AVG(s."climate_effect_percent") AS avg_climate_effect_percent,
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS avg_revenue_millions_pkr
FROM public.staging_crop_data s
WHERE s."climate_score" IS NOT NULL
GROUP BY climate_score_range
ORDER BY avg_climate_score;

-- Climate risk level analysis
SELECT 
    s."climate_risk_level",
    COUNT(*) AS record_count,
    AVG(s."climate_score") AS avg_climate_score,
    AVG(s."climate_effect_percent") AS avg_climate_effect_percent,
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS avg_revenue_millions_pkr,
    SUM(s."Total_Revenue_PKR") / 1000000000.0 AS total_revenue_billions_pkr
FROM public.staging_crop_data s
WHERE s."climate_risk_level" IS NOT NULL
GROUP BY s."climate_risk_level"
ORDER BY avg_climate_score DESC;

-- Crops most affected by climate
SELECT 
    s."Crop",
    AVG(s."climate_score") AS avg_climate_score,
    AVG(s."climate_effect_percent") AS avg_climate_effect_percent,
    AVG(s."expected_effect") AS avg_expected_effect,
    COUNT(*) AS record_count
FROM public.staging_crop_data s
WHERE s."climate_score" IS NOT NULL
GROUP BY s."Crop"
ORDER BY avg_climate_effect_percent DESC
LIMIT 10;

-- ========================================
-- 5. LOCATION/DISTRICT ANALYSIS
-- ========================================

-- District performance summary
SELECT 
    l.district,
    l.soil_type,
    COUNT(f.fact_id) AS record_count,
    AVG(f.climate_score) AS avg_climate_score,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
GROUP BY l.district, l.soil_type
ORDER BY total_revenue_millions_pkr DESC;

-- Soil type analysis
SELECT 
    l.soil_type,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.climate_score) AS avg_climate_score,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
WHERE l.soil_type IS NOT NULL
GROUP BY l.soil_type
ORDER BY avg_yield_kg_per_acre DESC;

-- Best performing districts by crop
SELECT 
    c.crop_name,
    l.district,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
GROUP BY c.crop_name, l.district
HAVING COUNT(f.fact_id) >= 3
ORDER BY c.crop_name, avg_yield_kg_per_acre DESC;

-- ========================================
-- 6. TIME-BASED ANALYSIS
-- ========================================

-- Year-over-year production trends
SELECT 
    t.year,
    t.season,
    COUNT(f.fact_id) AS record_count,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    AVG(f.climate_score) AS avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.year, t.season
ORDER BY t.year, t.season;

-- Seasonal analysis
SELECT 
    t.season,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.total_revenue_pkr) / 1000000.0 AS total_revenue_millions_pkr,
    AVG(f.climate_score) AS avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY t.season
ORDER BY total_revenue_millions_pkr DESC;

-- ========================================
-- 7. PREDICTIVE MODEL COMPARISON
-- ========================================

-- Model prediction accuracy comparison
SELECT 
    s."Crop",
    COUNT(*) AS record_count,
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS actual_avg_revenue_millions,
    AVG(s."Decision_Tree_Predicted_Revenue") / 1000000.0 AS dt_predicted_avg_millions,
    AVG(s."Random_Forest_Predicted_Revenue") / 1000000.0 AS rf_predicted_avg_millions,
    AVG(s."XGBoost_Predicted_Revenue") / 1000000.0 AS xgb_predicted_avg_millions,
    AVG(s."XGBoost_Tuned_Predicted_Revenue") / 1000000.0 AS xgb_tuned_predicted_avg_millions
FROM public.staging_crop_data s
WHERE s."Total_Revenue_PKR" IS NOT NULL
GROUP BY s."Crop"
ORDER BY actual_avg_revenue_millions DESC
LIMIT 10;

-- Model prediction differences
SELECT 
    s."Crop",
    AVG(ABS(s."Total_Revenue_PKR" - s."Decision_Tree_Predicted_Revenue")) / 1000000.0 AS dt_avg_error_millions,
    AVG(ABS(s."Total_Revenue_PKR" - s."Random_Forest_Predicted_Revenue")) / 1000000.0 AS rf_avg_error_millions,
    AVG(ABS(s."Total_Revenue_PKR" - s."XGBoost_Predicted_Revenue")) / 1000000.0 AS xgb_avg_error_millions,
    AVG(ABS(s."Total_Revenue_PKR" - s."XGBoost_Tuned_Predicted_Revenue")) / 1000000.0 AS xgb_tuned_avg_error_millions
FROM public.staging_crop_data s
WHERE s."Total_Revenue_PKR" IS NOT NULL
GROUP BY s."Crop"
ORDER BY dt_avg_error_millions
LIMIT 10;

-- ========================================
-- 8. FERTILIZER AND PESTICIDE ANALYSIS
-- ========================================

-- Fertilizer type usage and performance
SELECT 
    c.fertilizer_type,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
WHERE c.fertilizer_type IS NOT NULL
GROUP BY c.fertilizer_type
ORDER BY avg_yield_kg_per_acre DESC
LIMIT 10;

-- Pesticide recommendations by crop
SELECT 
    c.crop_name,
    c.recommended_pesticide,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.climate_score) AS avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
WHERE c.recommended_pesticide IS NOT NULL
GROUP BY c.crop_name, c.recommended_pesticide
ORDER BY c.crop_name, avg_yield_kg_per_acre DESC
LIMIT 20;

-- ========================================
-- 9. COMPREHENSIVE DASHBOARD QUERIES
-- ========================================

-- Overall summary statistics
SELECT 
    COUNT(DISTINCT c.crop_id) AS unique_crops,
    COUNT(DISTINCT l.location_id) AS unique_locations,
    COUNT(DISTINCT t.time_id) AS unique_time_periods,
    COUNT(f.fact_id) AS total_records,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.total_revenue_pkr) / 1000000000.0 AS total_revenue_billions_pkr,
    AVG(f.avg_yield_kg_per_acre) AS overall_avg_yield_kg_per_acre,
    AVG(f.climate_score) AS overall_avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
JOIN climatecrop.dim_time t ON f.time_id = t.time_id;

-- Top performing combinations (Crop + District + Season)
SELECT 
    c.crop_name,
    l.district,
    t.season,
    COUNT(f.fact_id) AS record_count,
    AVG(f.avg_yield_kg_per_acre) AS avg_yield_kg_per_acre,
    AVG(f.total_revenue_pkr) / 1000000.0 AS avg_revenue_millions_pkr,
    AVG(f.climate_score) AS avg_climate_score
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
JOIN climatecrop.dim_time t ON f.time_id = t.time_id
GROUP BY c.crop_name, l.district, t.season
HAVING COUNT(f.fact_id) >= 2
ORDER BY avg_yield_kg_per_acre DESC
LIMIT 20;

-- ========================================
-- 10. RISK AND EXPECTED EFFECT ANALYSIS
-- ========================================

-- Expected risk distribution
SELECT 
    s."expected_risk",
    COUNT(*) AS record_count,
    AVG(s."expected_effect") AS avg_expected_effect,
    AVG(s."climate_effect_percent") AS avg_climate_effect_percent,
    AVG(s."Total_Revenue_PKR") / 1000000.0 AS avg_revenue_millions_pkr
FROM public.staging_crop_data s
WHERE s."expected_risk" IS NOT NULL
GROUP BY s."expected_risk"
ORDER BY avg_expected_effect DESC;

-- Crops with highest expected effect
SELECT 
    s."Crop",
    AVG(s."expected_effect") AS avg_expected_effect,
    AVG(s."climate_effect_percent") AS avg_climate_effect_percent,
    AVG(s."climate_impact_score") AS avg_climate_impact_score,
    COUNT(*) AS record_count
FROM public.staging_crop_data s
WHERE s."expected_effect" IS NOT NULL
GROUP BY s."Crop"
ORDER BY avg_expected_effect DESC
LIMIT 10;

-- ========================================
-- 11. PRICE ANALYSIS
-- ========================================

-- Price analysis by crop
SELECT 
    s."Crop",
    AVG(s."Avg_Price_PKR") AS avg_price_pkr,
    MIN(s."Min_Price_PKR") AS min_price_pkr,
    MAX(s."Max_Price_PKR") AS max_price_pkr,
    AVG(s."Max_Price_PKR" - s."Min_Price_PKR") AS avg_price_range,
    COUNT(*) AS record_count
FROM public.staging_crop_data s
WHERE s."Avg_Price_PKR" IS NOT NULL
GROUP BY s."Crop"
ORDER BY avg_price_pkr DESC;

-- Price trends over time
SELECT 
    t.year,
    t.season,
    AVG(s."Avg_Price_PKR") AS avg_price_pkr,
    COUNT(*) AS record_count
FROM public.staging_crop_data s
JOIN climatecrop.dim_time t ON s."Year" = t.year AND s."Season" = t.season
WHERE s."Avg_Price_PKR" IS NOT NULL
GROUP BY t.year, t.season
ORDER BY t.year, t.season;

-- ========================================
-- 12. AREA AND PRODUCTION EFFICIENCY
-- ========================================

-- Production efficiency (production per acre)
SELECT 
    c.crop_name,
    AVG(f.area_acres) AS avg_area_acres,
    AVG(f.production_kg / NULLIF(f.area_acres, 0)) AS avg_production_per_acre_kg,
    AVG(f.total_revenue_pkr / NULLIF(f.area_acres, 0)) AS avg_revenue_per_acre_pkr,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_crop c ON f.crop_id = c.crop_id
WHERE f.area_acres > 0
GROUP BY c.crop_name
ORDER BY avg_production_per_acre_kg DESC
LIMIT 10;

-- Area utilization by district
SELECT 
    l.district,
    SUM(f.area_acres) AS total_area_acres,
    SUM(f.production_kg) / 1000000.0 AS total_production_millions_kg,
    SUM(f.production_kg) / NULLIF(SUM(f.area_acres), 0) AS production_per_acre_kg,
    COUNT(f.fact_id) AS record_count
FROM climatecrop.fact_crop_yield f
JOIN climatecrop.dim_location l ON f.location_id = l.location_id
WHERE f.area_acres > 0
GROUP BY l.district
ORDER BY production_per_acre_kg DESC;

-- ========================================
-- END OF QUERIES
-- ========================================

