# app.py
from flask import Flask, jsonify
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
# More permissive CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Generate random dates within the past year
def random_date(days_back=365):
    today = datetime.now()
    random_days = random.randint(1, days_back)
    return (today - timedelta(days=random_days)).strftime('%Y-%m-%d')

# Sample data generation functions
def generate_broker():
    brokers = [
        {"company_name": "ABC Insurance Brokers", "email_address": "contact@abcbrokers.com"},
        {"company_name": "Global Risk Partners", "email_address": "info@grpartners.com"},
        {"company_name": "Shield Insurance Services", "email_address": "support@shieldinsurance.com"},
        {"company_name": "Elite Coverage Group", "email_address": "inquiries@elitecoverage.com"}
    ]
    return random.choice(brokers)

def generate_insured():
    companies = [
        {
            "legal_name": "Acme Industries LLC",
            "sic_code": "3579",
            "industry_description": "Manufacturing",
            "address": {
                "line1": "123 Factory Lane",
                "city": "Boston",
                "state": "MA",
                "postal_code": "02108"
            },
            "years_in_business": random.randint(1, 30),
            "employee_count": random.randint(10, 500)
        },
        {
            "legal_name": "TechSoft Solutions",
            "sic_code": "7371",
            "industry_description": "Technology",
            "address": {
                "line1": "456 Innovation Drive",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94103"
            },
            "years_in_business": random.randint(1, 15),
            "employee_count": random.randint(5, 200)
        },
        {
            "legal_name": "Omega Retail Group",
            "sic_code": "5311",
            "industry_description": "Retail",
            "address": {
                "line1": "789 Shopping Plaza",
                "city": "Chicago",
                "state": "IL",
                "postal_code": "60601"
            },
            "years_in_business": random.randint(1, 25),
            "employee_count": random.randint(20, 1000)
        },
        {
            "legal_name": "GreenLeaf Properties",
            "sic_code": "6531",
            "industry_description": "Real Estate",
            "address": {
                "line1": "101 Property Blvd",
                "city": "Miami",
                "state": "FL",
                "postal_code": "33101"
            },
            "years_in_business": random.randint(1, 20),
            "employee_count": random.randint(5, 100)
        }
    ]
    return random.choice(companies)

def generate_submission_data():
    created_at = random_date(30)  # Within the last month
    effective_date = (datetime.now() + timedelta(days=random.randint(30, 90))).strftime('%Y-%m-%d')
    expiration_date = (datetime.now() + timedelta(days=random.randint(395, 400))).strftime('%Y-%m-%d')
    
    coverage_lines = random.sample(
        ["General Liability", "Property", "Workers Compensation", "Professional Liability", "Cyber"], 
        k=random.randint(1, 3)
    )
    
    return {
        "id": f"SUB-{random.randint(10000, 99999)}",
        "created_at": created_at,
        "effective_date": effective_date,
        "expiration_date": expiration_date,
        "coverage_lines": coverage_lines,
        "status": random.choice(["New", "In Review", "Quoted", "Bound"])
    }

def generate_risk_data():
    risk_factors = [
        {"type": "Financial", "score": random.randint(1, 100)},
        {"type": "Operational", "score": random.randint(1, 100)},
        {"type": "Hazard", "score": random.randint(1, 100)},
        {"type": "Strategic", "score": random.randint(1, 100)}
    ]
    
    return {
        "overall_score": random.randint(1, 100),
        "factors": risk_factors,
        "notes": "Sample risk assessment notes."
    }

def generate_documents():
    doc_types = ["Application", "Loss Runs", "Statement of Values", "Financial Statement", "Risk Assessment"]
    docs = []
    
    for i in range(random.randint(2, 5)):
        doc_type = random.choice(doc_types)
        docs.append({
            "doc_id": str(uuid.uuid4())[:8],
            "name": f"{doc_type} - {datetime.now().strftime('%Y%m%d')}",
            "type": doc_type,
            "upload_date": random_date(10),
            "size_kb": random.randint(100, 5000),
            "status": random.choice(["Processed", "Pending", "Failed"])
        })
    
    return docs

def generate_compliance_checks():
    checks = [
        {
            "check_type": "Risk Appetite",
            "result": random.choice(["Pass", "Fail", "Warning"]),
            "timestamp": random_date(5),
            "details": "Industry classification review."
        },
        {
            "check_type": "Financial Stability",
            "result": random.choice(["Pass", "Fail", "Warning"]),
            "timestamp": random_date(5),
            "details": "Financial ratio analysis."
        },
        {
            "check_type": "Document Completeness",
            "result": random.choice(["Pass", "Fail", "Warning"]),
            "timestamp": random_date(5),
            "details": "Required documents check."
        }
    ]
    
    return checks

# Endpoint to get a list of submissions
@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    submissions = []
    for _ in range(10):
        submission = generate_submission_data()
        broker = generate_broker()
        insured = generate_insured()
        
        submissions.append({
            "submission": submission,
            "broker": broker,
            "insured": insured,
            "status": random.choice(["Compliant", "At Risk", "Non-Compliant"])
        })
    
    return jsonify(submissions)

# Endpoint to get details for a specific submission
@app.route('/api/submissions/<submission_id>', methods=['GET'])
def get_submission_detail(submission_id):
    # For demo purposes, we'll generate random data regardless of the ID
    submission = generate_submission_data()
    submission["id"] = submission_id  # Use the requested ID
    
    detail = {
        "submission": submission,
        "broker": generate_broker(),
        "insured": generate_insured(),
        "risk_assessment": generate_risk_data(),
        "documents": generate_documents(),
        "compliance_checks": generate_compliance_checks(),
        "status": random.choice(["Compliant", "At Risk", "Non-Compliant"])
    }
    
    return jsonify(detail)

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')