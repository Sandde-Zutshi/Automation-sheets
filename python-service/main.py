import os
import base64
import json
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import langextract as lx
from dotenv import load_dotenv

load_dotenv()

# Initialize Google Gemini AI
genai.configure(api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))

app = FastAPI(title="Blood Test Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractionRequest(BaseModel):
    pdf_base64: str
    patient_info: Optional[dict] = None

class BloodParameter(BaseModel):
    name: str
    value: float
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    category: str
    confidence: float
    is_abnormal: bool

class ExtractionResult(BaseModel):
    patient_info: dict
    test_info: dict
    parameters: List[BloodParameter]
    confidence: float

# Define LangExtract extraction task for blood test parameters
def create_blood_test_extraction_task():
    """Create LangExtract extraction task for blood test parameters"""
    
    prompt = """
    Extract blood test parameters from the provided medical report.
    
    For each parameter, extract:
    1. Parameter name (e.g., "Hemoglobin", "Glucose", "Cholesterol")
    2. Numerical value
    3. Unit of measurement (e.g., "g/dL", "mg/dL", "mmol/L")
    4. Reference range (e.g., "12.0-15.5", "< 100")
    5. Category (HEMATOLOGY, BIOCHEMISTRY, LIPID_PROFILE, THYROID_FUNCTION, LIVER_FUNCTION, KIDNEY_FUNCTION, DIABETES, CARDIOVASCULAR, INFLAMMATION, OTHER)
    
    Also extract patient information:
    - Patient name
    - Date of birth
    - Gender
    
    And test information:
    - Test date
    - Lab name
    - Report number
    
    Use exact text from the document. Do not infer or add information not present in the text.
    """
    
    # Example for LangExtract
    examples = [
        lx.data.ExampleData(
            text="Patient: John Doe, DOB: 01/15/1980, Gender: Male\nTest Date: 2024-01-15\nLab: LabCorp\nReport #: BT-2024-001\n\nHemoglobin: 14.2 g/dL (Reference: 12.0-15.5)\nGlucose: 95 mg/dL (Reference: 70-100)\nCholesterol: 180 mg/dL (Reference: < 200)",
            extractions=[
                lx.data.Extraction(
                    extraction_class="patient_name",
                    extraction_text="John Doe",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="date_of_birth",
                    extraction_text="01/15/1980",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="gender",
                    extraction_text="Male",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="test_date",
                    extraction_text="2024-01-15",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="lab_name",
                    extraction_text="LabCorp",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="report_number",
                    extraction_text="BT-2024-001",
                    attributes={}
                ),
                lx.data.Extraction(
                    extraction_class="parameter",
                    extraction_text="Hemoglobin: 14.2 g/dL (Reference: 12.0-15.5)",
                    attributes={
                        "name": "Hemoglobin",
                        "value": 14.2,
                        "unit": "g/dL",
                        "reference_range": "12.0-15.5",
                        "category": "HEMATOLOGY"
                    }
                ),
                lx.data.Extraction(
                    extraction_class="parameter",
                    extraction_text="Glucose: 95 mg/dL (Reference: 70-100)",
                    attributes={
                        "name": "Glucose",
                        "value": 95,
                        "unit": "mg/dL",
                        "reference_range": "70-100",
                        "category": "DIABETES"
                    }
                ),
                lx.data.Extraction(
                    extraction_class="parameter",
                    extraction_text="Cholesterol: 180 mg/dL (Reference: < 200)",
                    attributes={
                        "name": "Cholesterol",
                        "value": 180,
                        "unit": "mg/dL",
                        "reference_range": "< 200",
                        "category": "LIPID_PROFILE"
                    }
                )
            ]
        )
    ]
    
    return prompt, examples

def is_value_abnormal(value: float, reference_range: str) -> bool:
    """Check if a value is abnormal based on reference range"""
    if not reference_range:
        return False
    
    reference_range = reference_range.strip()
    
    if '-' in reference_range:
        try:
            min_val, max_val = map(float, reference_range.split('-'))
            return value < min_val or value > max_val
        except:
            return False
    
    if reference_range.startswith('<'):
        try:
            max_val = float(reference_range[1:])
            return value >= max_val
        except:
            return False
    
    if reference_range.startswith('>'):
        try:
            min_val = float(reference_range[1:])
            return value <= min_val
        except:
            return False
    
    return False

@app.post("/extract-blood-test", response_model=ExtractionResult)
async def extract_blood_test(request: ExtractionRequest):
    """Extract blood test parameters using LangExtract"""
    
    try:
        # Decode base64 PDF
        pdf_data = base64.b64decode(request.pdf_base64)
        
        # Create LangExtract extraction task
        prompt, examples = create_blood_test_extraction_task()
        
        # Run LangExtract extraction
        result = lx.extract(
            text_or_documents=pdf_data,
            prompt_description=prompt,
            examples=examples,
            model_id="gemini-2.5-flash",  # Using Gemini as recommended
        )
        
        # Process extractions
        patient_info = {}
        test_info = {}
        parameters = []
        
        for extraction in result.extractions:
            if extraction.extraction_class == "patient_name":
                patient_info["name"] = extraction.extraction_text
            elif extraction.extraction_class == "date_of_birth":
                patient_info["dateOfBirth"] = extraction.extraction_text
            elif extraction.extraction_class == "gender":
                patient_info["gender"] = extraction.extraction_text
            elif extraction.extraction_class == "test_date":
                test_info["testDate"] = extraction.extraction_text
            elif extraction.extraction_class == "lab_name":
                test_info["labName"] = extraction.extraction_text
            elif extraction.extraction_class == "report_number":
                test_info["reportNumber"] = extraction.extraction_text
            elif extraction.extraction_class == "parameter":
                attrs = extraction.attributes
                if attrs and "name" in attrs and "value" in attrs:
                    param = BloodParameter(
                        name=attrs.get("name", ""),
                        value=float(attrs.get("value", 0)),
                        unit=attrs.get("unit"),
                        reference_range=attrs.get("reference_range"),
                        category=attrs.get("category", "OTHER"),
                        confidence=0.8,  # Default confidence
                        is_abnormal=is_value_abnormal(
                            float(attrs.get("value", 0)), 
                            attrs.get("reference_range", "")
                        )
                    )
                    parameters.append(param)
        
        return ExtractionResult(
            patient_info=patient_info,
            test_info=test_info,
            parameters=parameters,
            confidence=0.8
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload PDF file and return base64 encoded data"""
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        content = await file.read()
        base64_data = base64.b64encode(content).decode('utf-8')
        
        return {"base64_data": base64_data, "filename": file.filename}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "blood-test-extraction"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 