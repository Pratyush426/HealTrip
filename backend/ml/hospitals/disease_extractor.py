import re
import io
import pypdf
import os
from groq import Groq
from typing import Optional, Tuple
from disease_mapping import DISEASE_SPECIALTY_MAP

class DiseaseExtractor:
    def __init__(self):
        self.known_diseases = list(DISEASE_SPECIALTY_MAP.keys())
        api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    def extract_with_groq(self, text: str) -> dict:
        if not self.client:
            return None

        prompt = f"""
        Analyze the following medical report text and extract the diagnosed disease or medical condition.
        Return ONLY a JSON object with this format:
        {{
            "disease": "Name of the disease",
            "confidence": 0.95 (a number between 0 and 1)
        }}
        
        If no disease is clearly mentioned, return "disease": "Unknown".
        
        Text to analyze:
        {text[:4000]}
        """

        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama3-8b-8192",
                temperature=0,
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(completion.choices[0].message.content)
            return result
        except Exception as e:
            print(f"Groq Extraction Error: {e}")
            return None

    def extract_disease(self, text: str) -> dict:
        """
        Extracts disease with a confidence score.
        Returns {'disease': str, 'confidence': float}
        """
        
        # 1. Try Groq first for high accuracy
        groq_result = self.extract_with_groq(text)
        if groq_result and groq_result.get("disease") != "Unknown":
            # Formatting
            groq_result["disease"] = groq_result["disease"].title()
            return groq_result

        # Fallback to Rule-based if Groq fails or API key missing
        text_lower = text.lower()
        
        # 2. Rule-based extraction (Regex)
        patterns = [
            r"diagnosis\s*[:\-]\s*([a-z\s]+)",
            r"impression\s*[:\-]\s*([a-z\s]+)",
            r"condition\s*[:\-]\s*([a-z\s]+)",
            r"suffering from\s*([a-z\s]+)"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                extracted = match.group(1).strip().split('\n')[0]
                extracted = re.sub(r'[.,]', '', extracted).strip()
                if len(extracted) > 3:
                     return {"disease": extracted.title(), "confidence": 0.95}

        # 3. Keyword matching 
        sorted_diseases = sorted(self.known_diseases, key=len, reverse=True)
        for disease in sorted_diseases:
            if disease in text_lower:
                return {"disease": disease.title(), "confidence": 0.85}
        
        return {"disease": "Unknown", "confidence": 0.0}
