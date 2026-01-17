from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from pydantic import BaseModel
from typing import Optional, List
import csv
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
# Get database credentials from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "clima")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123")

DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
    print("2. Database 'clima' exists")
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
            "diagnose": "/diagnose"
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
    """Refresh dimension and fact tables after staging data upload"""
    try:
        # Clear existing dimension and fact tables
        conn.execute(text("TRUNCATE TABLE climatecrop.fact_crop_yield RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_crop RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_location RESTART IDENTITY CASCADE"))
        conn.execute(text("TRUNCATE TABLE climatecrop.dim_time RESTART IDENTITY CASCADE"))
        
        # Populate dimension tables
        conn.execute(text("""
            INSERT INTO climatecrop.dim_crop(crop_name, variety, fertilizer_type, recommended_pesticide)
            SELECT DISTINCT 
                "Crop", 
                "Variety", 
                "Fertilizer_Type", 
                "Recommended_Pesticide"
            FROM public.staging_crop_data
            WHERE "Crop" IS NOT NULL
        """))
        
        conn.execute(text("""
            INSERT INTO climatecrop.dim_location(district, soil_type)
            SELECT DISTINCT 
                "district", 
                "Soil_Type"
            FROM public.staging_crop_data
            WHERE "district" IS NOT NULL
        """))
        
        conn.execute(text("""
            INSERT INTO climatecrop.dim_time(year, season)
            SELECT DISTINCT 
                "Year", 
                "Season"
            FROM public.staging_crop_data
            WHERE "Year" IS NOT NULL
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
        
        conn.commit()
        print("✅ Data warehouse refreshed successfully")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not refresh DW: {e}")
        conn.rollback()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
