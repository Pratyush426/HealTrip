from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

from disease_extractor import DiseaseExtractor
from disease_mapping import map_disease_to_specialty
from hospital_ranker import HospitalRanker
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="Medical Disease Extraction & Hospital Ranking")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
extractor = DiseaseExtractor()
ranker = HospitalRanker()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "hospitals",
        "has_data": hasattr(ranker, 'df') and ranker.df is not None,
        "data_rows": len(ranker.df) if hasattr(ranker, 'df') and ranker.df is not None else 0
    }

class HospitalResponse(BaseModel):
    name: str
    rating: float
    city: str
    summary: str
    match_score: float

class FullPredictionResponse(BaseModel):
    disease: str
    specialty: str
    top_hospitals: List[HospitalResponse]

@app.post("/extract-disease")
async def extract_disease_endpoint(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    if not text and not file:
        raise HTTPException(status_code=400, detail="Either text or file must be provided")
    
    extracted_text = ""
    if file:
        content = await file.read()
        if file.content_type == "application/pdf":
            extracted_text = extractor.extract_text_from_pdf(content)
        else:
            # Fallback for plain text files
            extracted_text = content.decode("utf-8")
    else:
        extracted_text = text
        
    result = extractor.extract_disease(extracted_text)
    # Add specialty info to response for completeness
    specialty = map_disease_to_specialty(result["disease"])
    result["specialty"] = specialty
    
    return result

@app.get("/top-hospitals", response_model=List[HospitalResponse])
def get_top_hospitals_endpoint(disease: str):
    specialty = map_disease_to_specialty(disease)
    top_hospitals = ranker.get_top_hospitals(disease, specialty)
    return top_hospitals

@app.post("/predict-all", response_model=FullPredictionResponse)
async def predict_all_endpoint(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    # 1. Extract
    if not text and not file:
        raise HTTPException(status_code=400, detail="Either text or file must be provided")
    
    extracted_text = ""
    if file:
        content = await file.read()
        if file.content_type == "application/pdf":
            extracted_text = extractor.extract_text_from_pdf(content)
        else:
            extracted_text = content.decode("utf-8")
    else:
        extracted_text = text
        
    extraction_result = extractor.extract_disease(extracted_text)
    disease = extraction_result["disease"]
    
    # 2. Map
    specialty = map_disease_to_specialty(disease)
    
    # 3. Rank
    hospitals = ranker.get_top_hospitals(disease, specialty)
    
    return {
        "disease": disease,
        "specialty": specialty,
        "top_hospitals": hospitals
    }

@app.get("/hospitals-by-city", response_model=List[HospitalResponse])
def get_hospitals_by_city(
    city: str = Query(..., description="City name"),
    disease: Optional[str] = Query(None, description="Optional disease for curation")
):
    """Get all hospitals in a specific city, optionally curated by disease"""
    try:
        # City name variations mapping
        city_aliases = {
            'bangalore': 'bengaluru',
            'bengaluru': 'bengaluru',
            'bombay': 'mumbai',
            'mumbai': 'mumbai',
            'delhi': 'new delhi',
            'new delhi': 'new delhi',
            'madras': 'chennai',
            'chennai': 'chennai',
            'calcutta': 'kolkata',
            'kolkata': 'kolkata'
        }
        
        # Normalize city name
        city_lower = city.lower().strip()
        normalized_city = city_aliases.get(city_lower, city_lower)
        
        # If disease is provided, use the ML ranker for curation
        if disease:
            specialty = map_disease_to_specialty(disease)
            return ranker.get_top_hospitals(disease, specialty, top_k=20, city=normalized_city)
            
        # Check if ranker has data
        if not hasattr(ranker, 'df') or ranker.df is None:
            return []
        
        # Filter hospitals by normalized city name normally
        city_mask = ranker.df['City'].str.lower().str.strip().apply(
            lambda x: city_aliases.get(x, x) == normalized_city
        )
        city_hospitals = ranker.df[city_mask].copy()
        
        if city_hospitals.empty:
            # Return empty if no match
            return []
        
        # Sort by rating
        city_hospitals = city_hospitals.sort_values('Rating_5_Scale', ascending=False)
        
        # Build results
        results = []
        for _, row in city_hospitals.head(20).iterrows():
            # Safely get hospital name (try different possible column names)
            name = row.get('Hospital_Group', row.get('Hospital_Name', row.get('Name', 'Unknown Hospital')))
            
            results.append({
                "name": str(name),
                "rating": float(row['Rating_5_Scale']),
                "city": str(row['City']),
                "summary": str(row.get('Review_Summary', '')),
                "match_score": float(row['Rating_5_Scale']) / 5.0
            })
        
        return results
        
    except Exception as e:
        print(f"ERROR in hospitals-by-city: {e}")
        import traceback
        traceback.print_exc()
        # Return empty on error
        return []

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
