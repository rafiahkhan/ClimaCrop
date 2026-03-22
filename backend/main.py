from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import Optional, List
import csv
import io
import os
import uuid
import asyncio

# -----------------------------------
# 1. FastAPI App
# -----------------------------------
app = FastAPI(title="ClimaCrop API", version="1.0.0")

# -----------------------------------
# 2. CORS – allow React to connect
# -----------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow everything during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------
# 3. PostgreSQL Connection String
# -----------------------------------
DB_URL = "postgresql+psycopg2://postgres:1234@localhost:5432/climacrop"

try:
    engine = create_engine(DB_URL, pool_pre_ping=True)
    # Test connection
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("Please check:")
    print("1. PostgreSQL is running")
    print("2. Database 'climacrop' exists")
    print("3. Username and password are correct")
    engine = None

# -----------------------------------
# 4. Helper Functions
# -----------------------------------
def row_to_dict(row):
    """Convert SQLAlchemy row to dictionary"""
    if hasattr(row, '_mapping'):
        return dict(row._mapping)
    elif hasattr(row, '_asdict'):
        return row._asdict()
    else:
        return {col: getattr(row, col) if hasattr(row, col) else row[col] for col in row.keys()}

# -----------------------------------
# 5. Root Endpoint
# -----------------------------------
@app.get("/")
def root():
    return {
        "message": "ClimaCrop API is running!",
        "version": "1.0.0",
        "endpoints": {
            "crops": "/crops",
            "revenue_prediction": "/revenue-prediction",
            "fertilizer_pest_control": "/fertilizer-pest-control",
            "upload_data": "/upload-data",
            "diagnose": "/diagnose",
            "pipeline_load": "POST /pipeline/load-data",
            "pipeline_status": "GET /pipeline/status",
            "check_staging_count": "GET /check-staging-count",
            "chatbot": "/api/chatbot/chat",
            "chatbot_health": "/api/chatbot/health"
        }
    }

# -----------------------------------
# 6. Get Crops List
# -----------------------------------
@app.get("/crops")
def get_crops():
    """Get unique crop list from data warehouse"""
    if engine is None:
        return {"error": "Database connection not available", "crops": [], "main_crops": []}
    
    try:
        with engine.connect() as conn:
            # Get all crops from staging table
            query = text("""
                SELECT DISTINCT "Crop" as crop_name
                FROM public.staging_crop_data
                WHERE "Crop" IS NOT NULL
                ORDER BY "Crop"
            """)
            rows = conn.execute(query)
            all_crops = [row[0] for row in rows if row[0]]
            
            # Identify main crops (most common ones)
            main_crops_query = text("""
                SELECT "Crop" as crop_name, COUNT(*) as count
                FROM public.staging_crop_data
                WHERE "Crop" IS NOT NULL
                GROUP BY "Crop"
                ORDER BY count DESC
                LIMIT 5
            """)
            main_rows = conn.execute(main_crops_query)
            main_crops = [row[0] for row in main_rows if row[0]]
            
            return {
                "crops": all_crops,
                "main_crops": main_crops if main_crops else all_crops[:5]
            }
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error in /crops endpoint: {error_msg}")
        return {"error": f"Database error: {error_msg}", "crops": [], "main_crops": []}

# -----------------------------------
# 7. Activity Diagram 2: AI Crop Revenue Prediction Process
# -----------------------------------
@app.get("/revenue-prediction")
def get_revenue_predictions(crop: str, temp: str):
    """
    Activity Diagram 2: AI Crop Revenue Prediction Process
    Returns revenue predictions from multiple AI models (Decision Tree, XGBoost, Random Forest)
    along with expected revenue and climate insights
    """
    if engine is None:
        return {"error": "Database connection not available", "data": []}
    
    if not crop or not temp:
        return {"error": "Both crop and temp parameters are required", "data": []}
    
    try:
        with engine.connect() as conn:
            # Map temperature category
            temp_mapping = {
                "Best": "Best",
                "Average": "Average", 
                "Worst": "Worst"
            }
            temp_category = temp_mapping.get(temp, temp)
            
            query = text("""
                SELECT 
                    s."Variety" as variety,
                    s."Crop" as crop_name,
                    s."district" as district,
                    s."Season" as season,
                    s."Soil_Type" as soil_type,
                    s."Temperature_Category" as temp_category,
                    s."Decision_Tree_Predicted_Revenue" as decision_tree_revenue,
                    s."XGBoost_Predicted_Revenue" as xgboost_revenue,
                    s."Random_Forest_Predicted_Revenue" as random_forest_revenue,
                    s."XGBoost_Tuned_Predicted_Revenue" as xgboost_tuned_revenue,
                    s."expected_revenue" as expected_revenue,
                    s."Total_Revenue_PKR" as total_revenue_pkr,
                    s."Avg_Yield_kg_per_acre" as avg_yield_kg_per_acre,
                    s."Avg_Price_per_kg" as avg_price_per_kg,
                    s."Avg_Price_PKR" as avg_price_pkr,
                    s."climate_score" as climate_score,
                    s."climate_effect_percent" as climate_effect_percent,
                    s."climate_risk_level" as climate_risk_level,
                    s."rainfall" as rainfall,
                    s."humidity" as humidity,
                    s."temperature" as temperature,
                    s."Year" as year
                FROM public.staging_crop_data s
                WHERE s."Crop" = :crop_name
                    AND s."Temperature_Category" = :temp_category
                ORDER BY s."expected_revenue" DESC
                LIMIT 50
            """)
            
            rows = conn.execute(query, {
                "crop_name": crop,
                "temp_category": temp_category
            })
            
            results = [row_to_dict(row) for row in rows]
            
            if not results:
                return {
                    "error": f"No predictions found for {crop} with temperature category {temp_category}",
                    "data": []
                }
            
            print(f"✅ Found {len(results)} revenue predictions for {crop} - {temp_category}")
            return {"data": results}
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error in /revenue-prediction endpoint: {error_msg}")
        import traceback
        return {
            "error": f"Database error: {error_msg}",
            "traceback": traceback.format_exc(),
            "data": []
        }

# -----------------------------------
# 8. Get Crop Statistics
# -----------------------------------
@app.get("/crop-statistics")
def get_crop_statistics(crop: str):
    """Get statistics for a crop across different temperature categories"""
    if engine is None:
        return {"error": "Database connection not available", "data": []}
    
    try:
        with engine.connect() as conn:
            query = text("""
                SELECT 
                    s."Temperature_Category" as temp_category,
                    COUNT(*) as record_count,
                    AVG(s."expected_revenue") as avg_expected_revenue,
                    AVG(s."Total_Revenue_PKR") as avg_total_revenue,
                    AVG(s."Avg_Yield_kg_per_acre") as avg_yield_kg_per_acre,
                    AVG(s."climate_score") as avg_climate_score
                FROM public.staging_crop_data s
                WHERE s."Crop" = :crop_name
                GROUP BY s."Temperature_Category"
                ORDER BY s."Temperature_Category"
            """)
            
            rows = conn.execute(query, {"crop_name": crop})
            results = [row_to_dict(row) for row in rows]
            
            return {"data": results}
            
    except Exception as e:
        return {"error": str(e), "data": []}

# -----------------------------------
# 9. Activity Diagram 3: Fertilizer and Pest Control Recommendations
# -----------------------------------
@app.get("/fertilizer-pest-control")
def get_fertilizer_pest_control(crop: str, temp: str):
    """
    Activity Diagram 3: Fertilizer and Pest Control Recommendations
    Returns fertilizer recommendations (N-P-K values), pesticide recommendations,
    and disease management information based on crop and temperature
    """
    if engine is None:
        return {"error": "Database connection not available", "data": []}
    
    if not crop or not temp:
        return {"error": "Both crop and temp parameters are required", "data": []}
    
    try:
        with engine.connect() as conn:
            # Map temperature category
            temp_mapping = {
                "Best": "Best",
                "Average": "Average",
                "Worst": "Worst"
            }
            temp_category = temp_mapping.get(temp, temp)
            
            query = text("""
                SELECT 
                    s."Variety" as variety,
                    s."Crop" as crop_name,
                    s."Fertilizer_Type" as fertilizer_type,
                    s."N" as nitrogen,
                    s."P" as phosphorus,
                    s."K" as potassium,
                    s."ph" as ph_level,
                    s."Recommended_Pesticide" as recommended_pesticide,
                    s."Expected_Disease" as expected_disease,
                    s."district" as district,
                    s."Season" as season,
                    s."Soil_Type" as soil_type,
                    s."Temperature_Category" as temp_category,
                    s."climate_score" as climate_score,
                    s."climate_effect_percent" as climate_effect_percent,
                    s."climate_risk_level" as climate_risk_level,
                    s."rainfall" as rainfall,
                    s."humidity" as humidity,
                    s."temperature" as temperature,
                    s."temperature_norm" as temperature_norm,
                    s."rainfall_norm" as rainfall_norm,
                    s."Year" as year
                FROM public.staging_crop_data s
                WHERE s."Crop" = :crop_name
                    AND s."Temperature_Category" = :temp_category
                ORDER BY s."climate_score" DESC, s."expected_revenue" DESC
                LIMIT 50
            """)
            
            rows = conn.execute(query, {
                "crop_name": crop,
                "temp_category": temp_category
            })
            
            results = [row_to_dict(row) for row in rows]
            
            if not results:
                return {
                    "error": f"No recommendations found for {crop} with temperature category {temp_category}",
                    "data": []
                }
            
            print(f"✅ Found {len(results)} fertilizer/pest control recommendations for {crop} - {temp_category}")
            return {"data": results}
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error in /fertilizer-pest-control endpoint: {error_msg}")
        import traceback
        return {
            "error": f"Database error: {error_msg}",
            "traceback": traceback.format_exc(),
            "data": []
        }

# -----------------------------------
# 10. Data Upload Endpoint
# -----------------------------------
@app.post("/upload-data")
async def upload_data(file: UploadFile = File(...)):
    """
    Upload CSV data to staging table
    Supports the same format as all_crops_validated.csv
    """
    if engine is None:
        raise HTTPException(status_code=500, detail="Database connection not available")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    try:
        # Read file content
        contents = await file.read()
        csv_content = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        # Get column names from CSV (skip first 'c' column)
        csv_columns = [col for col in csv_reader.fieldnames if col != 'c']
        
        # Map to staging table columns
        column_mapping = {
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
        
        staging_columns = list(column_mapping.keys())
        
        # Prepare data for insertion
        rows_inserted = 0
        errors = []
        
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                for row_num, csv_row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        # Build values list
                        values = []
                        for col in staging_columns:
                            csv_col = column_mapping[col]
                            value = csv_row.get(csv_col, None)
                            
                            # Convert empty strings to None
                            if value == '' or value is None:
                                values.append(None)
                            else:
                                # Try to convert to appropriate type
                                try:
                                    if col in ["Year", "Production_kg", "expected_revenue", "Decision_Tree_Predicted_Revenue",
                                              "Total_Revenue_PKR", "XGBoost_Tuned_Predicted_Revenue", 
                                              "XGBoost_Predicted_Revenue", "Random_Forest_Predicted_Revenue"]:
                                        values.append(int(float(value)) if value else None)
                                    elif col in ["Avg_Yield_maunds_per_acre", "Area_acres", "Max_Price_PKR", "expected_effect",
                                                "Avg_Yield_kg_per_acre", "Min_Price_PKR", "climate_impact_score",
                                                "ph", "Avg_Price_PKR", "N", "K", "revenue_norm", "climate_effect_percent",
                                                "temperature_norm", "rainfall", "humidity", "climate_score",
                                                "Production_tons_Copy", "P", "rainfall_norm"]:
                                        values.append(float(value) if value else None)
                                    else:
                                        values.append(str(value).strip() if value else None)
                                except (ValueError, TypeError):
                                    values.append(None)
                        
                        # Insert row - use parameterized query with named parameters
                        param_names = [f'param_{i}' for i in range(len(staging_columns))]
                        placeholders = ', '.join([f':{name}' for name in param_names])
                        insert_query = text(f"""
                            INSERT INTO public.staging_crop_data ({', '.join(['"' + col + '"' for col in staging_columns])})
                            VALUES ({placeholders})
                        """)
                        
                        # Create parameter dict
                        params = {name: val for name, val in zip(param_names, values)}
                        conn.execute(insert_query, params)
                        rows_inserted += 1
                        
                    except Exception as e:
                        errors.append(f"Row {row_num}: {str(e)}")
                        if len(errors) > 10:  # Limit error messages
                            break
                
                # Commit transaction
                trans.commit()
                
                # Refresh dimension and fact tables
                refresh_dw(conn)
                
                return {
                    "success": True,
                    "message": f"Successfully uploaded {rows_inserted} rows",
                    "rows_inserted": rows_inserted,
                    "errors": errors[:10] if errors else []
                }
                
            except Exception as e:
                trans.rollback()
                raise HTTPException(status_code=500, detail=f"Error inserting data: {str(e)}")
                
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}\n{traceback.format_exc()}"
        )

def refresh_dw(conn):
    """
    Refresh dimension and fact tables after staging data upload
    NOTE: This function does NOT commit/rollback - it's called within an existing transaction
    """
    try:
        # Clear existing dimension and fact tables
        conn.execute(text("TRUNCATE TABLE climatecrop.fact_crop_yield RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_crop RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_location RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_time RESTART IDENTITY CASCADE"))
        
        # Populate dimension tables
        # Use GROUP BY to ensure only one row per unique combination of join keys
        conn.execute(text("""
            INSERT INTO climatecrop.dim_crop(crop_name, variety, fertilizer_type, recommended_pesticide)
            SELECT 
                "Crop", 
                "Variety", 
                MAX("Fertilizer_Type") as fertilizer_type,
                MAX("Recommended_Pesticide") as recommended_pesticide
            FROM public.staging_crop_data
            WHERE "Crop" IS NOT NULL
            GROUP BY "Crop", "Variety"
        """))
        
        conn.execute(text("""
            INSERT INTO climatecrop.dim_location(district, soil_type)
            SELECT 
                "district", 
                "Soil_Type"
            FROM public.staging_crop_data
            WHERE "district" IS NOT NULL
            GROUP BY "district", "Soil_Type"
        """))
        
        conn.execute(text("""
            INSERT INTO climatecrop.dim_time(year, season)
            SELECT 
                "Year", 
                "Season"
            FROM public.staging_crop_data
            WHERE "Year" IS NOT NULL
            GROUP BY "Year", "Season"
        """))
        
        # Populate fact table
        conn.execute(text("""
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
                AND COALESCE(s."Season", '') = COALESCE(t.season, '')
        """))
        
        print("✅ Data warehouse refreshed successfully")
        # NOTE: Do NOT commit/rollback here - parent function handles transaction
        
    except Exception as e:
        print(f"⚠️ Warning: Could not refresh DW: {e}")
        # NOTE: Do NOT rollback here - parent function handles transaction
        raise  # Re-raise so parent can handle rollback

def load_csv_to_staging_pipeline(csv_path: str = None):
    """
    ETL Pipeline: Load CSV file into staging table and refresh data warehouse
    This function loads data from CSV file system into staging, then refreshes DWH
    """
    if engine is None:
        print("❌ Database connection not available")
        return {"success": False, "error": "Database connection not available"}
    
    # Default CSV path (relative to backend folder)
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "all_crops_validated.csv")
        csv_path = os.path.abspath(csv_path)  # Convert to absolute path
        print(f"🔍 Trying relative path: {csv_path}")
        # Try absolute path if relative doesn't work
        if not os.path.exists(csv_path):
            csv_path = r"C:\FAST_2021\ClimaCrop_dup\ClimaCrop\all_crops_validated.csv"
            print(f"🔍 Trying absolute path: {csv_path}")
    
    csv_path = os.path.abspath(csv_path)  # Ensure absolute path
    print(f"📁 Final CSV path: {csv_path}")
    print(f"📁 Path exists: {os.path.exists(csv_path)}")
    
    if not os.path.exists(csv_path):
        error_msg = f"CSV file not found at: {csv_path}"
        print(f"❌ {error_msg}")
        print(f"📂 Current working directory: {os.getcwd()}")
        print(f"📂 Script directory: {os.path.dirname(os.path.abspath(__file__))}")
        return {"success": False, "error": error_msg}
    
    try:
        print(f"🔄 Starting ETL Pipeline: Loading CSV from {csv_path}")
        print(f"📊 File size: {os.path.getsize(csv_path)} bytes")
        
        with engine.connect() as conn:
            trans = conn.begin()
            
            try:
                # Step 1: Clear staging table
                print("📋 Step 1: Clearing staging table...")
                truncate_result = conn.execute(text("TRUNCATE TABLE public.staging_crop_data"))
                print(f"✅ Truncate completed")
                
                # Step 2: Load CSV into staging
                print("📥 Step 2: Loading CSV into staging table...")
                rows_inserted = 0
                errors = []
                
                with open(csv_path, 'r', encoding='utf-8') as csv_file:
                    csv_reader = csv.DictReader(csv_file)
                    print(f"📋 CSV headers: {csv_reader.fieldnames[:5]}...")  # Show first 5 headers
                    
                    # Column mapping (same as upload endpoint)
                    column_mapping = {
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
                    
                    staging_columns = list(column_mapping.keys())
                    print(f"📋 Staging columns count: {len(staging_columns)}")
                    
                    row_num = 0
                    for csv_row in csv_reader:
                        row_num += 1
                        # Skip the 'c' column if present
                        if 'c' in csv_row:
                            del csv_row['c']
                        
                        try:
                            values = []
                            for col in staging_columns:
                                csv_col = column_mapping[col]
                                value = csv_row.get(csv_col, None)
                                
                                if value == '' or value is None:
                                    values.append(None)
                                else:
                                    try:
                                        if col in ["Year", "Production_kg", "expected_revenue", "Decision_Tree_Predicted_Revenue",
                                                  "Total_Revenue_PKR", "XGBoost_Tuned_Predicted_Revenue", 
                                                  "XGBoost_Predicted_Revenue", "Random_Forest_Predicted_Revenue"]:
                                            values.append(int(float(value)) if value else None)
                                        elif col in ["Avg_Yield_maunds_per_acre", "Area_acres", "Max_Price_PKR", "expected_effect",
                                                    "Avg_Yield_kg_per_acre", "Min_Price_PKR", "climate_impact_score",
                                                    "ph", "Avg_Price_PKR", "N", "K", "revenue_norm", "climate_effect_percent",
                                                    "temperature_norm", "rainfall", "humidity", "climate_score",
                                                    "Production_tons_Copy", "P", "rainfall_norm"]:
                                            values.append(float(value) if value else None)
                                        else:
                                            values.append(str(value).strip() if value else None)
                                    except (ValueError, TypeError) as e:
                                        values.append(None)
                            
                            # Insert row
                            param_names = [f'param_{i}' for i in range(len(staging_columns))]
                            placeholders = ', '.join([f':{name}' for name in param_names])
                            insert_query = text(f"""
                                INSERT INTO public.staging_crop_data ({', '.join(['"' + col + '"' for col in staging_columns])})
                                VALUES ({placeholders})
                            """)
                            
                            params = {name: val for name, val in zip(param_names, values)}
                            conn.execute(insert_query, params)
                            rows_inserted += 1
                            
                            # Log progress every 100 rows
                            if rows_inserted % 100 == 0:
                                print(f"  ✅ Inserted {rows_inserted} rows so far...")
                                
                        except Exception as row_error:
                            # If it's a database error, the transaction is now failed - we need to rollback
                            import psycopg2
                            if isinstance(row_error, (psycopg2.Error, psycopg2.DatabaseError)):
                                error_msg = f"Row {row_num} database error: {str(row_error)}"
                                print(f"❌ {error_msg}")
                                print(f"   Transaction will be rolled back")
                                import traceback
                                print(traceback.format_exc())
                                # Rollback immediately and re-raise to exit the loop
                                trans.rollback()
                                raise Exception(f"Database error at row {row_num}: {str(row_error)}")
                            else:
                                # Non-database error, continue
                                error_msg = f"Row {row_num} error: {str(row_error)}"
                                errors.append(error_msg)
                                print(f"⚠️ {error_msg}")
                                if len(errors) <= 5:
                                    import traceback
                                    print(traceback.format_exc())
                                if len(errors) > 10:
                                    break  # Stop after 10 errors
                
                print(f"✅ Processed {rows_inserted} rows from CSV")
                if errors:
                    print(f"⚠️ Encountered {len(errors)} errors during insertion")
                    print(f"   First few errors: {errors[:3]}")
                
                # Verify insertion (only if no database errors occurred)
                print("🔍 Verifying insertion...")
                try:
                    verify_result = conn.execute(text("SELECT COUNT(*) FROM public.staging_crop_data"))
                    actual_count = verify_result.scalar()
                    print(f"📊 Actual rows in staging table: {actual_count}")
                except Exception as verify_error:
                    # Transaction might be in failed state
                    print(f"❌ Cannot verify - transaction may be failed: {verify_error}")
                    trans.rollback()
                    return {
                        "success": False,
                        "error": f"Transaction failed during verification: {str(verify_error)}",
                        "rows_inserted": rows_inserted,
                        "errors": errors[:5] if errors else []
                    }
                
                if actual_count == 0 and rows_inserted > 0:
                    print("⚠️ WARNING: Rows were processed but staging table is empty!")
                    print("   This might indicate a transaction issue or rollback")
                    trans.rollback()
                    return {
                        "success": False,
                        "error": f"Rows processed ({rows_inserted}) but staging table is empty. Transaction rolled back.",
                        "rows_inserted": 0,
                        "errors": errors[:5]
                    }
                
                # Step 3: Refresh data warehouse
                print("🔄 Step 3: Refreshing data warehouse (dimensions + fact table)...")
                try:
                    refresh_dw(conn)
                except Exception as dw_error:
                    print(f"❌ Error refreshing data warehouse: {dw_error}")
                    trans.rollback()
                    return {
                        "success": False,
                        "error": f"Data warehouse refresh failed: {str(dw_error)}",
                        "rows_inserted": rows_inserted,
                        "actual_staging_count": actual_count,
                        "errors": errors[:5] if errors else []
                    }
                
                trans.commit()
                print("✅ Transaction committed successfully")
                
                print("✅ ETL Pipeline completed successfully!")
                return {
                    "success": True,
                    "message": f"Pipeline completed: {rows_inserted} rows loaded, DWH refreshed",
                    "rows_inserted": rows_inserted,
                    "actual_staging_count": actual_count,
                    "errors": errors[:5] if errors else []
                }
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        error_msg = f"Pipeline error: {str(e)}"
        print(f"❌ {error_msg}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": error_msg}

# -----------------------------------
# 11. Diagnostic Endpoint
# -----------------------------------
@app.get("/diagnose")
def diagnose():
    """Diagnostic endpoint to check database status"""
    if engine is None:
        return {"error": "Database connection not available"}
    
    results = {}
    
    try:
        with engine.connect() as conn:
            # Check staging table
            try:
                table_count = conn.execute(text("SELECT COUNT(*) FROM public.staging_crop_data")).scalar()
                results["staging_table"] = {
                    "exists": True,
                    "row_count": table_count
                }
            except Exception as e:
                results["staging_table"] = {"exists": False, "error": str(e)}
            
            # Check dimension tables
            for table in ["dim_crop", "dim_location", "dim_time", "fact_crop_yield"]:
                try:
                    count = conn.execute(text(f"SELECT COUNT(*) FROM climatecrop.{table}")).scalar()
                    results[table] = {"exists": True, "row_count": count}
                except Exception as e:
                    results[table] = {"exists": False, "error": str(e)}
            
            return {
                "status": "success",
                "diagnostics": results
            }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# -----------------------------------
# 12. ETL Pipeline Endpoint
# -----------------------------------
@app.post("/pipeline/load-data")
def trigger_pipeline(csv_path: Optional[str] = None):
    """
    Trigger ETL Pipeline: Load CSV from file system into staging and refresh DWH
    This endpoint runs the complete pipeline:
    1. Loads CSV file into staging_crop_data table
    2. Refreshes dimension tables (dim_crop, dim_location, dim_time)
    3. Refreshes fact table (fact_crop_yield)
    """
    result = load_csv_to_staging_pipeline(csv_path)
    if result.get("success"):
        return JSONResponse(status_code=200, content=result)
    else:
        return JSONResponse(status_code=500, content=result)

@app.get("/pipeline/status")
def pipeline_status():
    """Check pipeline status - shows current row counts in staging and DWH tables"""
    return diagnose()

@app.get("/check-staging-count")
def check_staging_count():
    """Run SELECT COUNT(*) FROM public.staging_crop_data and return the result"""
    if engine is None:
        return {"error": "Database connection not available", "count": 0}
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM public.staging_crop_data"))
            count = result.scalar()
            return {
                "success": True,
                "count": count,
                "message": f"Staging table has {count} rows"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "count": 0
        }

@app.get("/debug/csv-paths")
def debug_csv_paths():
    """Debug endpoint to check CSV file paths"""
    import os
    
    # Try different possible paths
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "all_crops_validated.csv"),
        r"C:\FAST_2021\ClimaCrop_dup\ClimaCrop\all_crops_validated.csv",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "all_crops_validated.csv")),
    ]
    
    results = {}
    for i, path in enumerate(possible_paths):
        abs_path = os.path.abspath(path)
        exists = os.path.exists(abs_path)
        results[f"path_{i+1}"] = {
            "path": abs_path,
            "exists": exists,
            "is_file": os.path.isfile(abs_path) if exists else False,
            "size_bytes": os.path.getsize(abs_path) if exists else None
        }
    
    # Check current working directory
    results["current_dir"] = os.getcwd()
    results["script_dir"] = os.path.dirname(os.path.abspath(__file__))
    
    return results

@app.get("/debug/csv-sample")
def debug_csv_sample():
    """Debug endpoint to read first few rows of CSV and show structure"""
    import os
    
    csv_path = r"C:\FAST_2021\ClimaCrop_dup\ClimaCrop\all_crops_validated.csv"
    
    if not os.path.exists(csv_path):
        return {"error": f"CSV file not found at {csv_path}"}
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            
            # Get headers
            headers = csv_reader.fieldnames
            if headers and headers[0] == 'c':
                headers = headers[1:]  # Skip 'c' column
            
            # Read first 3 rows
            sample_rows = []
            for i, row in enumerate(csv_reader):
                if i >= 3:
                    break
                # Remove 'c' column if present
                if 'c' in row:
                    del row['c']
                sample_rows.append(row)
            
            return {
                "csv_path": csv_path,
                "total_headers": len(headers) if headers else 0,
                "headers": list(headers) if headers else [],
                "sample_rows": sample_rows,
                "first_row_keys": list(sample_rows[0].keys()) if sample_rows else []
            }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.get("/debug/check-duplicates")
def debug_check_duplicates():
    """Check for duplicates in dimension tables that could cause fact table multiplication"""
    if engine is None:
        return {"error": "Database connection not available"}
    
    try:
        with engine.connect() as conn:
            results = {}
            
            # Check staging count
            staging_count = conn.execute(text("SELECT COUNT(*) FROM public.staging_crop_data")).scalar()
            results["staging_count"] = staging_count
            
            # Check dimension table counts and duplicates
            dim_crop_count = conn.execute(text("SELECT COUNT(*) FROM climatecrop.dim_crop")).scalar()
            dim_crop_distinct = conn.execute(text("""
                SELECT COUNT(DISTINCT (crop_name, COALESCE(variety, ''))) 
                FROM climatecrop.dim_crop
            """)).scalar()
            results["dim_crop"] = {
                "total_rows": dim_crop_count,
                "distinct_combinations": dim_crop_distinct,
                "has_duplicates": dim_crop_count > dim_crop_distinct
            }
            
            dim_location_count = conn.execute(text("SELECT COUNT(*) FROM climatecrop.dim_location")).scalar()
            dim_location_distinct = conn.execute(text("""
                SELECT COUNT(DISTINCT (district, COALESCE(soil_type, ''))) 
                FROM climatecrop.dim_location
            """)).scalar()
            results["dim_location"] = {
                "total_rows": dim_location_count,
                "distinct_combinations": dim_location_distinct,
                "has_duplicates": dim_location_count > dim_location_distinct
            }
            
            dim_time_count = conn.execute(text("SELECT COUNT(*) FROM climatecrop.dim_time")).scalar()
            dim_time_distinct = conn.execute(text("""
                SELECT COUNT(DISTINCT (year, COALESCE(season, ''))) 
                FROM climatecrop.dim_time
            """)).scalar()
            results["dim_time"] = {
                "total_rows": dim_time_count,
                "distinct_combinations": dim_time_distinct,
                "has_duplicates": dim_time_count > dim_time_distinct
            }
            
            # Check fact table count
            fact_count = conn.execute(text("SELECT COUNT(*) FROM climatecrop.fact_crop_yield")).scalar()
            results["fact_count"] = fact_count
            
            # Calculate expected multiplication
            if dim_crop_distinct > 0 and dim_location_distinct > 0 and dim_time_distinct > 0:
                max_possible = staging_count * dim_crop_count * dim_location_count * dim_time_count
                results["analysis"] = {
                    "staging_rows": staging_count,
                    "fact_rows": fact_count,
                    "multiplication_factor": round(fact_count / staging_count, 2) if staging_count > 0 else 0,
                    "max_possible_if_all_joins": max_possible,
                    "likely_issue": "Dimension tables have duplicates causing JOIN multiplication"
                }
            
            # Find example duplicates
            duplicate_crops = conn.execute(text("""
                SELECT crop_name, variety, COUNT(*) as count
                FROM climatecrop.dim_crop
                GROUP BY crop_name, variety
                HAVING COUNT(*) > 1
                LIMIT 5
            """)).fetchall()
            if duplicate_crops:
                results["example_duplicate_crops"] = [
                    {"crop_name": row[0], "variety": row[1], "count": row[2]} 
                    for row in duplicate_crops
                ]
            
            return results
            
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# -----------------------------------
# 13. Startup Event - Auto-load Pipeline (Optional)
# -----------------------------------
# Set AUTO_LOAD_PIPELINE=true in environment to auto-load data on startup
AUTO_LOAD_PIPELINE = os.getenv("AUTO_LOAD_PIPELINE", "false").lower() == "true"

@app.on_event("startup")
async def startup_pipeline():
    """Optionally run ETL pipeline on startup if AUTO_LOAD_PIPELINE is enabled"""
    if AUTO_LOAD_PIPELINE:
        print("🔄 AUTO_LOAD_PIPELINE enabled: Running ETL pipeline on startup...")
        try:
            result = load_csv_to_staging_pipeline()
            if result.get("success"):
                print("✅ Pipeline completed successfully on startup!")
            else:
                print(f"⚠️ Pipeline failed on startup: {result.get('error')}")
        except Exception as e:
            print(f"⚠️ Pipeline startup error: {e}")
    else:
        print("ℹ️ AUTO_LOAD_PIPELINE disabled. Use POST /pipeline/load-data to run pipeline manually.")

# -----------------------------------
# 14. Chatbot Endpoints
# -----------------------------------

# Import chatbot module (lazy import to handle initialization errors gracefully)
try:
    from chatbot import get_chatbot, initialize_chatbot, REQUEST_TIMEOUT
    chatbot_available = True
    
    # Initialize chatbot on startup
    @app.on_event("startup")
    async def startup_chatbot():
        """Initialize chatbot on application startup"""
        try:
            print("🔄 Initializing Chatbot RAG Pipeline on startup...")
            initialize_chatbot()
            print("✅ Chatbot initialized successfully!")
        except Exception as e:
            print(f"⚠️ Warning: Chatbot initialization failed: {e}")
            print("   Chatbot endpoints will not be available.")
except Exception as e:
    print(f"⚠️ Warning: Could not import chatbot module: {e}")
    chatbot_available = False

# Chatbot Pydantic models
class ChatRequest(BaseModel):
    query: str
    request_id: Optional[str] = None
    language: Optional[str] = "en"  # Language: "en" for English, "ur" for Urdu

class ChatResponse(BaseModel):
    response: str
    query: str
    request_id: str
    context_used: int
    processing_time: Optional[float] = None
    error: Optional[str] = None

@app.get("/api/chatbot/health")
def chatbot_health():
    """Check chatbot service health"""
    if not chatbot_available:
        return {
            "status": "unavailable",
            "message": "Chatbot module not available. Please check dependencies."
        }
    
    try:
        chatbot = get_chatbot()
        model_name = chatbot.model if chatbot and hasattr(chatbot, 'model') else "gemini-2.5-flash"
        return {
            "status": "healthy" if chatbot.initialized else "not_initialized",
            "initialized": chatbot.initialized if chatbot else False,
            "model": model_name,
            "vectordb_ready": chatbot.vector_store is not None if chatbot else False
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/api/chatbot/chat", response_model=ChatResponse)
async def chatbot_chat(request: ChatRequest):
    """
    Chat endpoint with RAG pipeline
    Uses Google Gemini API + VectorDB (all_crops_validated.csv) for responses
    Supports English and Urdu languages
    Includes deadlock prevention with timeout protection
    """
    if not chatbot_available:
        raise HTTPException(
            status_code=503,
            detail="Chatbot service is not available. Please check backend logs."
        )
    
    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Generate request ID if not provided
    request_id = request.request_id or str(uuid.uuid4())
    
    try:
        chatbot = get_chatbot()
        
        if not chatbot.initialized:
            raise HTTPException(
                status_code=503,
                detail="Chatbot is not initialized. Please try again in a moment."
            )
        
        # Process chat request with timeout protection
        try:
            # Get language (default to English)
            lang = request.language or "en"
            if lang not in ["en", "ur"]:
                lang = "en"  # Default to English if invalid language
            
            response_data = await chatbot.chat(request.query.strip(), request_id, language=lang)
            
            return ChatResponse(
                response=response_data["response"],
                query=response_data["query"],
                request_id=response_data["request_id"],
                context_used=response_data["context_used"],
                processing_time=response_data.get("processing_time")
            )
            
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408,
                detail=f"Request timed out after {REQUEST_TIMEOUT} seconds. Please try a simpler query."
            )
        except Exception as e:
            print(f"❌ Error in chatbot chat endpoint: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Error processing chat request: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in chatbot endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
