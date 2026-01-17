-- ========================================
-- 1. Create Schema
-- ========================================
DROP SCHEMA IF EXISTS climatecrop CASCADE;
DROP TABLE IF EXISTS public.staging_crop_data CASCADE;

CREATE SCHEMA IF NOT EXISTS climatecrop;

-- ========================================
-- 2. Create Staging Table (matches CSV columns)
-- ========================================
CREATE TABLE IF NOT EXISTS public.staging_crop_data (
    "Avg_Price_per_kg" FLOAT,
    "Avg_Yield_maunds_per_acre" FLOAT,
    "Area_acres" FLOAT,
    "Year" INT,
    "Max_Price_PKR" FLOAT,
    "expected_effect" FLOAT,
    "Avg_Yield_kg_per_acre" FLOAT,
    "Min_Price_PKR" FLOAT,
    "climate_impact_score" FLOAT,
    "expected_revenue" BIGINT,
    "Crop" TEXT,
    "ph" FLOAT,
    "Avg_Price_PKR" FLOAT,
    "N" FLOAT,
    "K" FLOAT,
    "revenue_norm" FLOAT,
    "expected_risk" FLOAT,
    "temperature" TEXT,
    "Fertilizer_Type" TEXT,
    "climate_effect_percent" FLOAT,
    "Production_kg" BIGINT,
    "temperature_norm" FLOAT,
    "rainfall" FLOAT,
    "humidity" FLOAT,
    "Decision_Tree_Predicted_Revenue" BIGINT,
    "Total_Revenue_PKR" BIGINT,
    "XGBoost_Tuned_Predicted_Revenue" BIGINT,
    "Expected_Disease" TEXT,
    "climate_score" FLOAT,
    "Season" TEXT,
    "Temperature_Category" TEXT,
    "Soil_Type" TEXT,
    "Production_tons_Copy" FLOAT,
    "P" FLOAT,
    "XGBoost_Predicted_Revenue" BIGINT,
    "rainfall_norm" FLOAT,
    "climate_risk_level" TEXT,
    "Random_Forest_Predicted_Revenue" BIGINT,
    "district" TEXT,
    "Recommended_Pesticide" TEXT,
    "Variety" TEXT
);

-- ========================================
-- 3. Create Dimension Tables
-- ========================================
CREATE TABLE IF NOT EXISTS climatecrop.dim_crop (
    crop_id SERIAL PRIMARY KEY,
    crop_name VARCHAR(50),
    variety VARCHAR(100),
    fertilizer_type VARCHAR(100),
    recommended_pesticide VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS climatecrop.dim_location (
    location_id SERIAL PRIMARY KEY,
    district VARCHAR(100),
    soil_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS climatecrop.dim_time (
    time_id SERIAL PRIMARY KEY,
    year INT,
    season VARCHAR(20)
);

-- ========================================
-- 4. Create Fact Table
-- ========================================
CREATE TABLE IF NOT EXISTS climatecrop.fact_crop_yield (
    fact_id SERIAL PRIMARY KEY,
    crop_id INT REFERENCES climatecrop.dim_crop(crop_id),
    location_id INT REFERENCES climatecrop.dim_location(location_id),
    time_id INT REFERENCES climatecrop.dim_time(time_id),
    area_acres FLOAT,
    avg_yield_maunds_per_acre FLOAT,
    avg_yield_kg_per_acre FLOAT,
    production_kg FLOAT,
    production_tons FLOAT,
    avg_price_per_kg FLOAT,
    total_revenue_pkr FLOAT,
    expected_revenue FLOAT,
    climate_score FLOAT,
    climate_effect_percent FLOAT
);

-- ========================================
-- 5. Populate Dimension Tables
-- ========================================
 -- Corrected dimension inserts
INSERT INTO climatecrop.dim_crop(crop_name, variety, fertilizer_type, recommended_pesticide)
SELECT DISTINCT "Crop", "Variety", "Fertilizer_Type", "Recommended_Pesticide"
FROM public.staging_crop_data;

INSERT INTO climatecrop.dim_location(district, soil_type)
SELECT DISTINCT "district", "Soil_Type"
FROM public.staging_crop_data;

INSERT INTO climatecrop.dim_time(year, season)
SELECT DISTINCT "Year", "Season"
FROM public.staging_crop_data;


INSERT INTO climatecrop.fact_crop_yield(
    crop_id, location_id, time_id,
    area_acres, avg_yield_maunds_per_acre, avg_yield_kg_per_acre,
    production_kg, production_tons, avg_price_per_kg,
    total_revenue_pkr, expected_revenue, climate_score, climate_effect_percent
)
SELECT
    c.crop_id,
    l.location_id,
    t.time_id,
    s."Area_acres",
    s."Avg_Yield_maunds_per_acre",
    s."Avg_Yield_kg_per_acre",
    s."Production_kg",
    s."Production_tons_Copy",
    s."Avg_Price_per_kg",
    s."Total_Revenue_PKR",
    s."expected_revenue",
    s."climate_score",
    s."climate_effect_percent"
FROM public.staging_crop_data s
JOIN climatecrop.dim_crop c
    ON s."Crop" = c.crop_name AND s."Variety" = c.variety
JOIN climatecrop.dim_location l
    ON s."district" = l.district AND s."Soil_Type" = l.soil_type
JOIN climatecrop.dim_time t
    ON s."Year" = t.year AND s."Season" = t.season;

-- ========================================
-- 7. Quick check of table rows
-- ========================================
--TRUNCATE TABLE climatecrop.fact_crop_yield, 
               --climatecrop.dim_crop, 
               --climatecrop.dim_location, 
               --climatecrop.dim_time
--RESTART IDENTITY CASCADE;

SELECT COUNT(*) FROM public.staging_crop_data;
-- Should return 1230


SELECT 'Crop Dimension' AS table_name, COUNT(*) AS row_count FROM climatecrop.dim_crop;
SELECT 'Location Dimension' AS table_name, COUNT(*) AS row_count FROM climatecrop.dim_location;
SELECT 'Time Dimension' AS table_name, COUNT(*) AS row_count FROM climatecrop.dim_time;
SELECT 'Fact Table' AS table_name, COUNT(*) AS row_count FROM climatecrop.fact_crop_yield;


