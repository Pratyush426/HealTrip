from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.metrics.pairwise import cosine_similarity

# Use modern lifespan instead of deprecated on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield

app = FastAPI(title="HealTrip ML Backend", description="Flight recommendations and price prediction API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = BASE_DIR

# Global variables for models
models = {}
data = {}

def load_models():
    print("Loading models...")
    try:
        with open(os.path.join(MODELS_DIR, 'tfidf_vectorizer.pkl'), 'rb') as f:
            models['tfidf'] = pickle.load(f)
        
        with open(os.path.join(MODELS_DIR, 'tfidf_matrix.pkl'), 'rb') as f:
            models['tfidf_matrix'] = pickle.load(f)
            
        with open(os.path.join(MODELS_DIR, 'flight_price_model.pkl'), 'rb') as f:
            models['price_model'] = pickle.load(f)
            
        with open(os.path.join(MODELS_DIR, 'flight_cluster_model.pkl'), 'rb') as f:
            models['cluster_info'] = pickle.load(f)
            
        with open(os.path.join(MODELS_DIR, 'encoders.pkl'), 'rb') as f:
            models['encoders'] = pickle.load(f)
            
        data['flights'] = pd.read_pickle(os.path.join(MODELS_DIR, 'processed_flights.pkl'))
        
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Error loading models: {e}")
        pass

# Startup handled by lifespan above

class PricePredictionRequest(BaseModel):
    airline: str
    origin: str
    destination: str
    duration_minutes: int
    num_stops: int

@app.get("/")
def home():
    return {"message": "HealTrip ML Backend is running"}

@app.get("/flights")
def get_flights(page: int = 1, limit: int = 10):
    if 'flights' not in data:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    start = (page - 1) * limit
    end = start + limit
    
    records = data['flights'].iloc[start:end].replace({np.nan: None}).to_dict(orient='records')
    return {
        "page": page,
        "limit": limit,
        "total_count": len(data['flights']),
        "flights": records
    }

@app.get("/recommend-flights")
def recommend_flights(origin: str, destination: str, budget: float = None):
    if 'flights' not in data or 'tfidf' not in models or 'tfidf_matrix' not in models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    query_text = f"{origin} {destination}"
    query_vec = models['tfidf'].transform([query_text])
    cosine_sim = cosine_similarity(query_vec, models['tfidf_matrix']).flatten()
    
    df = data['flights'].copy()
    df['similarity'] = cosine_sim
    
    # Filter by similarity
    df = df[df['similarity'] > 0]
    
    if df.empty:
        return []
    
    # Airline price multipliers
    airline_multipliers = {
        'IndiGo': 1.0,
        'Air India': 1.2,
        'SpiceJet': 0.9,
        'Vistara': 1.3,
        'AirAsia': 0.85,
        'GoAir': 0.88
    }
    
    # Stops mapping
    stops_map = {
        'zero': 0,
        'one': 1,
        'two_or_more': 2
    }
    
    # Calculate realistic prices and standardize field names
    results = []
    for idx, row in df.head(10).iterrows():
        # Get duration - convert from hours to minutes
        duration_val = row.get('duration', row.get('Duration', row.get('duration_minutes', 2.5)))
        if pd.isna(duration_val):
            duration_val = 2.5
        # If it's in hours (< 24), convert to minutes
        if float(duration_val) < 24:
            duration = int(float(duration_val) * 60)
        else:
            duration = int(duration_val)
        
        # Get airline
        airline = row.get('airline', row.get('Airline', 'IndiGo'))
        if pd.isna(airline):
            airline = 'IndiGo'
        airline = str(airline)
            
        # Get stops - handle string values like 'zero', 'one', 'two_or_more'
        stops_val = row.get('stops', row.get('num_stops', row.get('Stops', 'zero')))
        if pd.isna(stops_val):
            stops = 0
        elif isinstance(stops_val, str):
            stops = stops_map.get(stops_val.lower(), 0)
        else:
            stops = int(stops_val)
        
        # Get origin and destination
        flight_origin = row.get('source_city', row.get('Origin', row.get('origin', origin)))
        flight_dest = row.get('destination_city', row.get('Destination', row.get('destination', destination)))
        
        # Detect international flights (longer duration or specific keywords)
        is_international = duration > 180 or any(keyword in str(flight_dest).lower() for keyword in ['dubai', 'singapore', 'bangkok', 'london', 'new york', 'tokyo', 'paris'])
        
        # Base price: ₹30/min for domestic, ₹70/min for international
        base_price_per_min = 70.0 if is_international else 30.0
        base_price = float(duration) * base_price_per_min
        
        # Apply airline multiplier
        multiplier = airline_multipliers.get(airline, 1.0)
        
        # Apply stops penalty
        stops_multiplier = 1.0 + (float(stops) * 0.25)
        
        # Calculate final price
        final_price = base_price * multiplier * stops_multiplier
        
        # Add variation based on index
        variation = 0.85 + (idx % 10) * 0.03
        final_price = final_price * variation
        
        # Create standardized result
        results.append({
            'Airline': airline,
            'Origin': str(flight_origin),
            'Destination': str(flight_dest),
            'duration_minutes': duration,
            'num_stops': stops,
            'Price': round(final_price, 2)
        })
    
    return results

@app.post("/predict-flight-price")
def predict_flight_price(request: PricePredictionRequest):
    if 'price_model' not in models or 'encoders' not in models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    encoders = models['encoders']
    
    try:
        def encode(col, val):
            le = encoders.get(col)
            if not le: raise ValueError(f"No encoder for {col}")
            if val not in le.classes_:
                raise HTTPException(status_code=400, detail=f"Unknown value '{val}' for field {col}")
            return le.transform([val])[0]

        airline_enc = encode('Airline', request.airline)
        origin_enc = encode('Origin', request.origin)
        dest_enc = encode('Destination', request.destination)
        
        features = np.array([[airline_enc, origin_enc, dest_enc, request.duration_minutes, request.num_stops]])
        predicted_price = models['price_model'].predict(features)[0]
        
        return {"predicted_price": round(predicted_price, 2)}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/route-cluster-info")
def get_route_cluster_info(flight_id: int):
    if 'flights' not in data:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    if flight_id < 0 or flight_id >= len(data['flights']):
        raise HTTPException(status_code=404, detail="Flight not found")
        
    flight = data['flights'].iloc[flight_id]
    
    return {
        "flight_id": flight_id,
        "cluster_name": flight['cluster_name'],
        "cluster_id": int(flight['cluster_label'])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
