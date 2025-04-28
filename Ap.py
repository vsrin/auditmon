# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import uuid

app = Flask(__name__)
# More permissive CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# NAICS restriction configuration - now stored in backend
RESTRICTED_NAICS_CODES = ['6531', '7371', '3579']  # Default restricted codes
NAICS_RULE_ENABLED = True  # Default rule state

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
            "sic_code": "3579",  # Now using a restricted NAICS code for demo
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
            "sic_code": "7371",  # Another restricted NAICS code
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
            "sic_code": "6531",  # Another restricted NAICS code
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

def evaluate_compliance(submission):
    industry_code = submission.get("insured", {}).get("sic_code", "")
    checks = []
    overall_status = "Compliant"

    # Document completeness check
    checks.append({
        "check_type": "Document Completeness",
        "result": random.choice(["Pass", "Warning"]),
        "timestamp": datetime.now().strftime('%Y-%m-%d'),
        "details": "Required documents check."
    })
    
    # NAICS code restriction check - centralized business logic
    if NAICS_RULE_ENABLED and industry_code in RESTRICTED_NAICS_CODES:
        checks.append({
            "check_type": "Risk Appetite",
            "result": "Fail",
            "timestamp": datetime.now().strftime('%Y-%m-%d'),
            "details": f"Industry code {industry_code} is in the restricted list."
        })
        overall_status = "Non-Compliant"
    else:
        checks.append({
            "check_type": "Risk Appetite",
            "result": "Pass",
            "timestamp": datetime.now().strftime('%Y-%m-%d'),
            "details": "Industry classification within acceptable parameters."
        })
    
    # Financial check  
    financial_result = random.choice(["Pass", "Warning", "Fail"])
    checks.append({
        "check_type": "Financial Stability",
        "result": financial_result,
        "timestamp": datetime.now().strftime('%Y-%m-%d'),
        "details": "Financial ratio analysis."
    })
    
    if financial_result == "Fail" and overall_status != "Non-Compliant":
        overall_status = "Non-Compliant"
    elif financial_result == "Warning" and overall_status == "Compliant":
        overall_status = "At Risk"
        
    return {"checks": checks, "overall_status": overall_status}

# Endpoint to get a list of submissions
@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    submissions = []
    for _ in range(10):
        submission = generate_submission_data()
        broker = generate_broker()
        insured = generate_insured()
        
        # Evaluate compliance to set status
        evaluation = evaluate_compliance({"insured": insured})
        status = evaluation["overall_status"]
        
        submissions.append({
            "submission": submission,
            "broker": broker,
            "insured": insured,
            "status": status
        })
    
    return jsonify(submissions)

# Endpoint to get details for a specific submission
@app.route('/api/submissions/<submission_id>', methods=['GET'])
def get_submission_detail(submission_id):
    # For demo purposes, we'll generate random data regardless of the ID
    submission = generate_submission_data()
    submission["id"] = submission_id  # Use the requested ID
    
    broker = generate_broker()
    insured = generate_insured()
    
    # Evaluate compliance
    evaluation = evaluate_compliance({"insured": insured})
    
    detail = {
        "submission": submission,
        "broker": broker,
        "insured": insured,
        "risk_assessment": generate_risk_data(),
        "documents": generate_documents(),
        "compliance_checks": evaluation["checks"],
        "status": evaluation["overall_status"]
    }
    
    return jsonify(detail)

# NEW API: Get restricted NAICS codes
@app.route('/api/restricted-naics', methods=['GET'])
def get_restricted_naics():
    return jsonify({
        "restrictedCodes": RESTRICTED_NAICS_CODES,
        "ruleEnabled": NAICS_RULE_ENABLED
    })

# NEW API: Update restricted NAICS codes
@app.route('/api/restricted-naics', methods=['POST'])
def update_restricted_naics():
    global RESTRICTED_NAICS_CODES, NAICS_RULE_ENABLED
    
    data = request.json
    if data.get('restrictedCodes') is not None:
        RESTRICTED_NAICS_CODES = data['restrictedCodes']
    
    if data.get('ruleEnabled') is not None:
        NAICS_RULE_ENABLED = data['ruleEnabled']
    
    return jsonify({
        "success": True,
        "restrictedCodes": RESTRICTED_NAICS_CODES,
        "ruleEnabled": NAICS_RULE_ENABLED
    })

# NEW API: Evaluate compliance for a submission
@app.route('/api/evaluate-compliance', methods=['POST'])
def evaluate_submission_compliance():
    submission = request.json.get('submission', {})
    results = evaluate_compliance(submission)
    
    # Format response to match the frontend expectation
    response = {
        "submissionId": submission.get("id", ""),
        "timestamp": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
        "checks": [],
        "overallStatus": results["overall_status"]
    }
    
    # Convert the compliance checks format
    for check in results["checks"]:
        formatted_check = {
            "checkId": str(uuid.uuid4())[:8],
            "category": check["check_type"],
            "status": "compliant" if check["result"] == "Pass" else 
                      "attention" if check["result"] == "Warning" else "non-compliant",
            "findings": check["details"],
            "timestamp": check["timestamp"],
            "dataPoints": {}
        }
        
        # Add data points for NAICS check
        if check["check_type"] == "Risk Appetite":
            formatted_check["dataPoints"] = {
                "industryCode": submission.get("insured", {}).get("sic_code", ""),
                "industryDescription": submission.get("insured", {}).get("industry_description", ""),
                "restrictedCodes": ", ".join(RESTRICTED_NAICS_CODES) if check["result"] == "Fail" else ""
            }
        
        response["checks"].append(formatted_check)
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')