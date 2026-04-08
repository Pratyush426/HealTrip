import pickle
import os
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class HospitalRanker:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = base_dir  # Artifacts are in root now
        
        # Load artifacts
        with open(os.path.join(models_dir, "disease_vectorizer.pkl"), "rb") as f:
            self.vectorizer = pickle.load(f)
            
        with open(os.path.join(models_dir, "hospital_data.pkl"), "rb") as f:
            self.df, self.tfidf_matrix = pickle.load(f)
            
    def get_top_hospitals(self, disease: str, specialty: str, top_k: int = 5, city: str = None) -> list:
        """
        Rank hospitals based on:
        - Filter by Specialty
        - Filter by City (optional)
        - 50% Rating
        - 30% Review Count
        - 20% Text Similarity (Disease vs Summary)
        """
        # 1. Filter by Specialty
        specialty_mask = self.df['Specialty'].str.lower() == specialty.lower()
        
        if city:
            # Since normalized_city is passed, we check if the df city roughly maps to the same
            city_aliases = {
                'bangalore': 'bengaluru', 'bengaluru': 'bengaluru',
                'bombay': 'mumbai', 'mumbai': 'mumbai',
                'delhi': 'new delhi', 'new delhi': 'new delhi',
                'madras': 'chennai', 'chennai': 'chennai',
                'calcutta': 'kolkata', 'kolkata': 'kolkata'
            }
            city_mask = self.df['City'].str.lower().str.strip().apply(
                lambda x: city_aliases.get(x, x) == city
            )
            specialty_mask = specialty_mask & city_mask
        
        # If no hospitals found for strict specialty, fall back to all (or deal with it differently)
        # For now, if no match, we return empty list
        if not specialty_mask.any():
            return []

        # Indices of the filtered hospitals
        candidate_indices = self.df.index[specialty_mask].tolist()
        candidate_df = self.df.loc[candidate_indices].copy()
        
        # 2. Calculate Component Scores
        
        # A. Rating Score (Normalized 0-1) - Max is 5
        # Ensure it's numeric
        ratings = candidate_df['Rating_5_Scale'].values
        rating_score = ratings / 5.0
        
        # B. Review Count Score (Normalized 0-1)
        reviews = candidate_df['Review_Count'].values
        # Avoid division by zero
        max_reviews = self.df['Review_Count'].max()  # Global max to keep scale consistent
        if max_reviews == 0: max_reviews = 1
        review_score = reviews / max_reviews
        
        # C. Text Similarity Score
        # Vectorize input disease
        disease_vec = self.vectorizer.transform([disease])
        
        # Get similarities for specific candidates only
        # We need to slice the global tfidf_matrix
        candidate_tfidf = self.tfidf_matrix[candidate_indices]
        
        # Calculate cosine similarity (returns shape [1, n_candidates])
        # Flatten to 1D array
        similarity_score = cosine_similarity(disease_vec, candidate_tfidf).flatten()
        
        # 3. Weighted Sum
        # 50% Rating + 30% Reviews + 20% Similarity
        final_scores = (0.5 * rating_score) + (0.3 * review_score) + (0.2 * similarity_score)
        
        # Add score to candidate df for sorting
        candidate_df['Final_Score'] = final_scores
        
        # 4. Sort and Return
        top_hospitals_df = candidate_df.sort_values(by='Final_Score', ascending=False).head(top_k)
        
        results = []
        for _, row in top_hospitals_df.iterrows():
            results.append({
                "name": row['Hospital_Group'], # Using Hospital_Group as Name based on CSV structure
                "rating": row['Rating_5_Scale'],
                "city": row['City'],
                "summary": row['Review_Summary'],
                "match_score": round(row['Final_Score'], 2)
            })
            
        return results
