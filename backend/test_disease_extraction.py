import requests
import os

# Create a dummy PDF file for testing if one doesn't exist
def create_dummy_pdf():
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Medical Report", ln=1, align="C")
    pdf.cell(200, 10, txt="Patient Name: John Doe", ln=1)
    pdf.cell(200, 10, txt="Diagnosis: Malaria", ln=1)
    pdf.cell(200, 10, txt="Symptoms: Fever, chills", ln=1)
    pdf.output("test_report.pdf")
    print("Created test_report.pdf")

def test_extraction():
    url = "http://localhost:8001/extract-disease"
    
    if not os.path.exists("test_report.pdf"):
        create_dummy_pdf()
        
    with open("test_report.pdf", "rb") as f:
        files = {"file": ("test_report.pdf", f, "application/pdf")}
        try:
            print(f"Sending request to {url}...")
            response = requests.post(url, files=files)
            
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print("Response JSON:", response.json())
                data = response.json()
                if "disease" in data and "confidence" in data:
                    print("✅ SUCCESS: Disease extracted successfully")
                else:
                    print("❌ FAILURE: Response format incorrect")
            else:
                print("❌ FAILURE: Request failed")
                print(response.text)
                
        except requests.exceptions.ConnectionError:
            print("❌ FAILURE: Could not connect to backend. Is it running?")

if __name__ == "__main__":
    test_extraction()
