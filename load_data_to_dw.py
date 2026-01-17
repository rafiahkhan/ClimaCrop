#!/usr/bin/env python3
"""
Script to load CSV data into PostgreSQL Data Warehouse
Usage: python3 load_data_to_dw.py
Database connection parameters are loaded from environment variables or .env file
"""

import csv
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ========================================
# Database Connection Parameters
# ========================================
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'clima'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', '123'),
    'port': int(os.getenv('DB_PORT', '5432'))
}

# CSV file path
CSV_FILE = 'all_crops_validated.csv'

# ========================================
# Connect to Database
# ========================================
def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ Connected to database successfully")
        return conn
    except psycopg2.Error as e:
        print(f"✗ Error connecting to database: {e}")
        sys.exit(1)

# ========================================
# Create Schema and Tables
# ========================================
def create_schema(conn):
    cursor = conn.cursor()
    
    try:
        # Drop existing schema and tables
        cursor.execute("DROP SCHEMA IF EXISTS climatecrop CASCADE;")
        cursor.execute("DROP TABLE IF EXISTS public.staging_crop_data CASCADE;")
        
        # Create schema
        cursor.execute("CREATE SCHEMA IF NOT EXISTS climatecrop;")
        
        # Create staging table
        cursor.execute("""
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
                "expected_risk" TEXT,
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
        """)
        
        # Create dimension tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS climatecrop.dim_crop (
                crop_id SERIAL PRIMARY KEY,
                crop_name VARCHAR(50),
                variety VARCHAR(100),
                fertilizer_type VARCHAR(100),
                recommended_pesticide VARCHAR(200)
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS climatecrop.dim_location (
                location_id SERIAL PRIMARY KEY,
                district VARCHAR(100),
                soil_type VARCHAR(50)
            );
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS climatecrop.dim_time (
                time_id SERIAL PRIMARY KEY,
                year INT,
                season VARCHAR(20)
            );
        """)
        
        # Create fact table
        cursor.execute("""
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
        """)
        
        conn.commit()
        print("✓ Schema and tables created successfully")
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"✗ Error creating schema: {e}")
        raise

# ========================================
# Load CSV Data
# ========================================
def load_csv_data(conn):
    cursor = conn.cursor()
    
    if not os.path.exists(CSV_FILE):
        print(f"✗ Error: CSV file '{CSV_FILE}' not found")
        sys.exit(1)
    
    # Map CSV columns to staging table columns
    # Note: CSV has 'c' as first column (skipped) and doesn't have 'Avg_Price_per_kg'
    column_mapping = {
        "Avg_Price_per_kg": None,  # Not in CSV, will be NULL
        "Avg_Yield_maunds_per_acre": "Avg_Yield_maunds_per_acre",
        "Area_acres": "Area_acres",
        "Year": "Year",
        "Max_Price_PKR": "Max_Price_PKR",
        "expected_effect": "expected_effect",
        "Avg_Yield_kg_per_acre": "Avg_Yield_kg_per_acre",
        "Min_Price_PKR": "Min_Price_PKR",
        "climate_impact_score": "climate_impact_score",
        "expected_revenue": "expected_revenue",
        "Crop": "Crop",
        "ph": "ph",
        "Avg_Price_PKR": "Avg_Price_PKR",
        "N": "N",
        "K": "K",
        "revenue_norm": "revenue_norm",
        "expected_risk": "expected_risk",
        "temperature": "temperature",
        "Fertilizer_Type": "Fertilizer_Type",
        "climate_effect_percent": "climate_effect_percent",
        "Production_kg": "Production_kg",
        "temperature_norm": "temperature_norm",
        "rainfall": "rainfall",
        "humidity": "humidity",
        "Decision_Tree_Predicted_Revenue": "Decision_Tree_Predicted_Revenue",
        "Total_Revenue_PKR": "Total_Revenue_PKR",
        "XGBoost_Tuned_Predicted_Revenue": "XGBoost_Tuned_Predicted_Revenue",
        "Expected_Disease": "Expected_Disease",
        "climate_score": "climate_score",
        "Season": "Season",
        "Temperature_Category": "Temperature_Category",
        "Soil_Type": "Soil_Type",
        "Production_tons_Copy": "Production_tons_Copy",
        "P": "P",
        "XGBoost_Predicted_Revenue": "XGBoost_Predicted_Revenue",
        "rainfall_norm": "rainfall_norm",
        "climate_risk_level": "climate_risk_level",
        "Random_Forest_Predicted_Revenue": "Random_Forest_Predicted_Revenue",
        "district": "district",
        "Recommended_Pesticide": "Recommended_Pesticide",
        "Variety": "Variety"
    }
    
    # Define data types for each column to ensure proper conversion
    column_types = {
        "Avg_Price_per_kg": float,
        "Avg_Yield_maunds_per_acre": float,
        "Area_acres": float,
        "Year": int,
        "Max_Price_PKR": float,
        "expected_effect": float,
        "Avg_Yield_kg_per_acre": float,
        "Min_Price_PKR": float,
        "climate_impact_score": float,
        "expected_revenue": int,
        "Crop": str,
        "ph": float,
        "Avg_Price_PKR": float,
        "N": float,
        "K": float,
        "revenue_norm": float,
        "expected_risk": str,  # TEXT - contains "Medium", "Low", etc.
        "temperature": str,  # TEXT - numeric as string
        "Fertilizer_Type": str,
        "climate_effect_percent": float,
        "Production_kg": int,
        "temperature_norm": float,
        "rainfall": float,
        "humidity": float,
        "Decision_Tree_Predicted_Revenue": int,
        "Total_Revenue_PKR": int,
        "XGBoost_Tuned_Predicted_Revenue": int,
        "Expected_Disease": str,
        "climate_score": float,
        "Season": str,
        "Temperature_Category": str,
        "Soil_Type": str,
        "Production_tons_Copy": float,
        "P": float,
        "XGBoost_Predicted_Revenue": int,
        "rainfall_norm": float,
        "climate_risk_level": str,
        "Random_Forest_Predicted_Revenue": int,
        "district": str,
        "Recommended_Pesticide": str,
        "Variety": str
    }
    
    def convert_value(value, target_type):
        """Convert value to target type, handling None and empty strings"""
        if value is None or value == '':
            return None
        
        try:
            if target_type == int:
                # Try to convert to int, handle floats
                try:
                    return int(float(value))
                except (ValueError, TypeError):
                    return None
            elif target_type == float:
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return None
            elif target_type == str:
                return str(value).strip()
            else:
                return value
        except Exception:
            return None
    
    staging_columns = list(column_mapping.keys())
    insert_query = f"""
        INSERT INTO public.staging_crop_data ({', '.join(['"' + col + '"' for col in staging_columns])})
        VALUES %s
    """
    
    try:
        row_count = 0
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = []
            
            for row in reader:
                # Map CSV values to staging table columns with proper type conversion
                values = []
                for staging_col, csv_col in column_mapping.items():
                    if csv_col is None:
                        values.append(None)  # Column not in CSV
                    else:
                        value = row.get(csv_col, None)
                        target_type = column_types.get(staging_col, str)
                        converted_value = convert_value(value, target_type)
                        values.append(converted_value)
                rows.append(tuple(values))
                
                # Batch insert every 1000 rows
                if len(rows) >= 1000:
                    execute_values(cursor, insert_query, rows)
                    row_count += len(rows)
                    rows = []
                    print(f"  Loaded {row_count} rows...", end='\r')
            
            # Insert remaining rows
            if rows:
                execute_values(cursor, insert_query, rows)
                row_count += len(rows)
        
        conn.commit()
        print(f"\n✓ Loaded {row_count} rows into staging table")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error loading CSV data: {e}")
        raise

# ========================================
# Populate Dimension Tables
# ========================================
def populate_dimensions(conn):
    cursor = conn.cursor()
    
    try:
        # Populate dim_crop
        cursor.execute("""
            INSERT INTO climatecrop.dim_crop(crop_name, variety, fertilizer_type, recommended_pesticide)
            SELECT DISTINCT 
                "Crop", 
                "Variety", 
                "Fertilizer_Type", 
                "Recommended_Pesticide"
            FROM public.staging_crop_data
            WHERE "Crop" IS NOT NULL;
        """)
        crop_count = cursor.rowcount
        print(f"✓ Populated dim_crop with {crop_count} rows")
        
        # Populate dim_location
        cursor.execute("""
            INSERT INTO climatecrop.dim_location(district, soil_type)
            SELECT DISTINCT 
                "district", 
                "Soil_Type"
            FROM public.staging_crop_data
            WHERE "district" IS NOT NULL;
        """)
        location_count = cursor.rowcount
        print(f"✓ Populated dim_location with {location_count} rows")
        
        # Populate dim_time
        cursor.execute("""
            INSERT INTO climatecrop.dim_time(year, season)
            SELECT DISTINCT 
                "Year", 
                "Season"
            FROM public.staging_crop_data
            WHERE "Year" IS NOT NULL;
        """)
        time_count = cursor.rowcount
        print(f"✓ Populated dim_time with {time_count} rows")
        
        conn.commit()
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"✗ Error populating dimensions: {e}")
        raise

# ========================================
# Populate Fact Table
# ========================================
def populate_fact_table(conn):
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
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
                ON s."Crop" = c.crop_name 
                AND COALESCE(s."Variety", '') = COALESCE(c.variety, '')
            JOIN climatecrop.dim_location l
                ON s."district" = l.district 
                AND COALESCE(s."Soil_Type", '') = COALESCE(l.soil_type, '')
            JOIN climatecrop.dim_time t
                ON s."Year" = t.year 
                AND COALESCE(s."Season", '') = COALESCE(t.season, '');
        """)
        
        fact_count = cursor.rowcount
        conn.commit()
        print(f"✓ Populated fact_crop_yield with {fact_count} rows")
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"✗ Error populating fact table: {e}")
        raise

# ========================================
# Verify Data Load and Provide Insights
# ========================================
def verify_data(conn):
    cursor = conn.cursor()
    
    try:
        # Basic counts
        cursor.execute("SELECT COUNT(*) FROM public.staging_crop_data;")
        staging_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM climatecrop.dim_crop;")
        crop_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM climatecrop.dim_location;")
        location_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM climatecrop.dim_time;")
        time_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM climatecrop.fact_crop_yield;")
        fact_count = cursor.fetchone()[0]
        
        print("\n" + "="*70)
        print("DATA LOAD VERIFICATION")
        print("="*70)
        print(f"Staging Table:        {staging_count:,} rows")
        print(f"Crop Dimension:       {crop_count:,} rows")
        print(f"Location Dimension:   {location_count:,} rows")
        print(f"Time Dimension:       {time_count:,} rows")
        print(f"Fact Table:           {fact_count:,} rows")
        print("="*70)
        
        # Data Quality Checks
        print("\n" + "="*70)
        print("DATA QUALITY CHECKS")
        print("="*70)
        
        # Check for NULLs in critical fields
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE "Crop" IS NULL) as null_crops,
                COUNT(*) FILTER (WHERE "Year" IS NULL) as null_years,
                COUNT(*) FILTER (WHERE "district" IS NULL) as null_districts,
                COUNT(*) FILTER (WHERE "Production_kg" IS NULL) as null_production
            FROM public.staging_crop_data;
        """)
        nulls = cursor.fetchone()
        print(f"NULL values - Crops: {nulls[0]}, Years: {nulls[1]}, Districts: {nulls[2]}, Production: {nulls[3]}")
        
        # Data Insights
        print("\n" + "="*70)
        print("DATA INSIGHTS")
        print("="*70)
        
        # Top crops by production
        cursor.execute("""
            SELECT "Crop", COUNT(*) as records, 
                   SUM("Production_kg")/1000000.0 as total_production_millions_kg,
                   AVG("Total_Revenue_PKR")/1000000.0 as avg_revenue_millions
            FROM public.staging_crop_data
            WHERE "Crop" IS NOT NULL
            GROUP BY "Crop"
            ORDER BY total_production_millions_kg DESC
            LIMIT 5;
        """)
        print("\nTop 5 Crops by Production:")
        print(f"{'Crop':<20} {'Records':<10} {'Production (M kg)':<20} {'Avg Revenue (M PKR)':<20}")
        print("-" * 70)
        for row in cursor.fetchall():
            print(f"{row[0]:<20} {row[1]:<10} {row[2]:<20.2f} {row[3]:<20.2f}")
        
        # Districts analysis
        cursor.execute("""
            SELECT "district", COUNT(*) as records,
                   AVG("climate_score") as avg_climate_score,
                   AVG("Total_Revenue_PKR")/1000000.0 as avg_revenue_millions
            FROM public.staging_crop_data
            WHERE "district" IS NOT NULL
            GROUP BY "district"
            ORDER BY records DESC
            LIMIT 5;
        """)
        print("\nTop 5 Districts by Record Count:")
        print(f"{'District':<20} {'Records':<10} {'Avg Climate Score':<20} {'Avg Revenue (M PKR)':<20}")
        print("-" * 70)
        for row in cursor.fetchall():
            print(f"{row[0]:<20} {row[1]:<10} {row[2]:<20.2f} {row[3]:<20.2f}")
        
        # Year range
        cursor.execute("""
            SELECT MIN("Year") as min_year, MAX("Year") as max_year, 
                   COUNT(DISTINCT "Year") as unique_years
            FROM public.staging_crop_data
            WHERE "Year" IS NOT NULL;
        """)
        year_info = cursor.fetchone()
        print(f"\nYear Range: {year_info[0]} to {year_info[1]} ({year_info[2]} unique years)")
        
        # Climate risk distribution
        cursor.execute("""
            SELECT "climate_risk_level", COUNT(*) as count,
                   AVG("climate_score") as avg_score
            FROM public.staging_crop_data
            WHERE "climate_risk_level" IS NOT NULL
            GROUP BY "climate_risk_level"
            ORDER BY count DESC;
        """)
        print("\nClimate Risk Level Distribution:")
        print(f"{'Risk Level':<20} {'Count':<10} {'Avg Climate Score':<20}")
        print("-" * 50)
        for row in cursor.fetchall():
            print(f"{row[0]:<20} {row[1]:<10} {row[2]:<20.2f}")
        
        # Revenue statistics
        cursor.execute("""
            SELECT 
                MIN("Total_Revenue_PKR")/1000000.0 as min_revenue_millions,
                MAX("Total_Revenue_PKR")/1000000.0 as max_revenue_millions,
                AVG("Total_Revenue_PKR")/1000000.0 as avg_revenue_millions,
                SUM("Total_Revenue_PKR")/1000000000.0 as total_revenue_billions
            FROM public.staging_crop_data
            WHERE "Total_Revenue_PKR" IS NOT NULL;
        """)
        revenue = cursor.fetchone()
        print("\nRevenue Statistics (PKR):")
        print(f"  Min:    {revenue[0]:,.2f} million")
        print(f"  Max:    {revenue[1]:,.2f} million")
        print(f"  Avg:    {revenue[2]:,.2f} million")
        print(f"  Total:  {revenue[3]:,.2f} billion")
        
        print("\n" + "="*70)
        print("✓ Data verification and insights completed successfully!")
        print("="*70)
        
    except psycopg2.Error as e:
        print(f"✗ Error verifying data: {e}")

# ========================================
# Main Execution
# ========================================
def main():
    print("="*50)
    print("Loading Data into Data Warehouse")
    print("="*50)
    
    conn = connect_db()
    
    try:
        # Step 1: Create schema and tables
        print("\n[1/5] Creating schema and tables...")
        create_schema(conn)
        
        # Step 2: Load CSV data
        print("\n[2/5] Loading CSV data into staging table...")
        load_csv_data(conn)
        
        # Step 3: Populate dimension tables
        print("\n[3/5] Populating dimension tables...")
        populate_dimensions(conn)
        
        # Step 4: Populate fact table
        print("\n[4/5] Populating fact table...")
        populate_fact_table(conn)
        
        # Step 5: Verify data
        print("\n[5/5] Verifying data load...")
        verify_data(conn)
        
        print("\n✓ Data load completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Error during data load: {e}")
        sys.exit(1)
    
    finally:
        conn.close()
        print("\n✓ Database connection closed")

if __name__ == "__main__":
    main()

