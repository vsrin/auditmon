# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import uuid
import json

#Import from Megan
from pymongo import MongoClient

app = Flask(__name__)
# More permissive CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# NAICS restriction configuration - now stored in backend
RESTRICTED_NAICS_CODES = ['6531', '7371', '3579']  # Default restricted codes
NAICS_RULE_ENABLED = True  # Default rule state

# Custom JSON encoder to handle datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Set the custom JSON encoder for Flask
app.json_encoder = CustomJSONEncoder

# Generate random dates within the past year
def random_date(days_back=365):
    today = datetime.now()
    random_days = random.randint(1, days_back)
    return (today - timedelta(days=random_days)).strftime('%Y-%m-%d')

# Helper function to get nested values safely
def get_nested_value(obj, path, default=None):
    """Get a nested value from a dictionary using a dot-separated path."""
    if not obj or not path:
        return default
    
    # Handle array notation like "array[0].property"
    parts = path.replace('[', '.').replace(']', '').split('.')
    current = obj
    
    for part in parts:
        if not part:  # Skip empty parts
            continue
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return default
    
    return current if current is not None else default

# Megan Code - updated to map data properly
@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    try:
        # MongoDB connection setup
        client = MongoClient('mongodb+srv://artifi:root@artifi.2vi2m.mongodb.net/?retryWrites=true&w=majority&appName=Artifi')
        db = client['Submission_Intake']  # Replace with your database name
        submissions_collection = db['BP_service']  # Replace with your collection name
        
        # Find documents that have the 'bp_parsed_response' key
        query = {'bp_parsed_response': {'$exists': True}}
        raw_submissions = list(submissions_collection.find(query, {'_id': 0}))
        
        print(f"Found {len(raw_submissions)} submissions from MongoDB")
        
        # Map the raw submission data to the expected format
        formatted_submissions = []
        for sub in raw_submissions:
            # Convert any datetime objects to strings
            if isinstance(sub.get('created_on'), datetime):
                sub['created_on'] = sub['created_on'].isoformat()
            
            # Map each submission using the defined mapping
            formatted_sub = {
                "submissionId": sub.get("tx_id", f"SUB-{random.randint(10000, 99999)}"),
                "timestamp": sub.get("created_on", datetime.now().isoformat()),
                "status": sub.get("status", "New"),
                "broker": {
                    "name": get_nested_value(sub, 'bp_parsed_response.Common.Broker Details.broker_name.value', 'Unknown'),
                    "email": get_nested_value(sub, 'bp_parsed_response.Common.Broker Details.broker_email.value', 'Unknown')
                },
                "insured": {
                    "name": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.company_name.value', 'Unknown'),
                    "industry": {
                        "code": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.code', 'Unknown'),
                        "description": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.desc', 'Unknown')
                    },
                    "address": {
                        "street": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.address_1.value', ''),
                        "city": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.city.value', ''),
                        "state": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.state.value', ''),
                        "zip": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.postal_code.value', '')
                    },
                    "yearsInBusiness": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.years_in_business.value', ''),
                    "employeeCount": get_nested_value(sub, 'bp_parsed_response.Common.Firmographics.total_full_time_employees.value', '')
                }
            }
            formatted_submissions.append(formatted_sub)
        
        # Close the MongoDB connection
        client.close()
        
        # Log the first item for debugging (safely convert to JSON string)
        if formatted_submissions:
            try:
                sample_json = json.dumps(formatted_submissions[0], cls=CustomJSONEncoder)
                print(f"First submission (truncated): {sample_json[:500]}...")
            except Exception as e:
                print(f"Error logging first submission: {str(e)}")
        
        # Return the formatted submissions
        return jsonify(formatted_submissions)
    
    except Exception as e:
        print(f"Error in get_submissions: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint to get details for a specific submission
@app.route('/api/submissions/<submission_id>', methods=['GET'])
def get_submission_detail(submission_id):
    try:
        # MongoDB connection setup
        client = MongoClient('mongodb+srv://artifi:root@artifi.2vi2m.mongodb.net/?retryWrites=true&w=majority&appName=Artifi')
        db = client['Submission_Intake']
        submissions_collection = db['BP_service']
        
        # Try to find the submission by ID
        query = {'tx_id': submission_id, 'bp_parsed_response': {'$exists': True}}
        submission = submissions_collection.find_one(query, {'_id': 0})
        
        if not submission:
            # If not found by tx_id, try a more generic search
            query = {'bp_parsed_response': {'$exists': True}}
            all_submissions = list(submissions_collection.find(query, {'_id': 0}))
            
            # Find the submission with matching ID or return the first one
            submission = next((s for s in all_submissions if get_nested_value(s, 'tx_id') == submission_id), 
                             all_submissions[0] if all_submissions else None)
        
        client.close()
        
        if not submission:
            return jsonify({"error": f"Submission with ID {submission_id} not found"}), 404
        
        # Convert any datetime objects to strings
        if isinstance(submission.get('created_on'), datetime):
            submission['created_on'] = submission['created_on'].isoformat()
        
        # Map the submission to the expected format
        formatted_submission = {
            "submissionId": submission.get("tx_id", submission_id),
            "timestamp": submission.get("created_on", datetime.now().isoformat()),
            "status": submission.get("status", "New"),
            "broker": {
                "name": get_nested_value(submission, 'bp_parsed_response.Common.Broker Details.broker_name.value', 'Unknown'),
                "email": get_nested_value(submission, 'bp_parsed_response.Common.Broker Details.broker_email.value', 'Unknown')
            },
            "insured": {
                "name": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.company_name.value', 'Unknown'),
                "industry": {
                    "code": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.code', 'Unknown'),
                    "description": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.desc', 'Unknown')
                },
                "address": {
                    "street": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.address_1.value', ''),
                    "city": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.city.value', ''),
                    "state": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.state.value', ''),
                    "zip": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.postal_code.value', '')
                },
                "yearsInBusiness": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.years_in_business.value', ''),
                "employeeCount": get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.total_full_time_employees.value', '')
            }
        }
        
        # Add additional detail fields needed for the detail view
        coverage_lines = get_nested_value(submission, 'bp_parsed_response.Common.Limits and Coverages.normalized_coverage', [])
        if isinstance(coverage_lines, str):
            coverage_lines = [coverage_lines]
        elif not isinstance(coverage_lines, list):
            coverage_lines = []
            
        formatted_submission['coverage'] = {
            'lines': coverage_lines,
            'effectiveDate': get_nested_value(submission, 'bp_parsed_response.Common.Product Details.policy_inception_date.value', ''),
            'expirationDate': get_nested_value(submission, 'bp_parsed_response.Common.Product Details.end_date.value', '')
        }
        
        # Add empty documents and compliance checks (to be filled later)
        formatted_submission['documents'] = []
        formatted_submission['complianceChecks'] = []
        
        # Generate some mock documents for display purposes
        formatted_submission['documents'] = [
            {
                'id': f'doc-{uuid.uuid4()}',
                'name': 'Application Form',
                'type': 'Application',
                'status': 'processed',
                'size': random.randint(100000, 1000000)
            },
            {
                'id': f'doc-{uuid.uuid4()}',
                'name': 'Loss Runs',
                'type': 'Claims History',
                'status': 'pending',
                'size': random.randint(50000, 500000)
            }
        ]
        
        # Generate compliance checks
        naics_code = get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.code', '')
        
        compliance_status = 'compliant'
        if naics_code in RESTRICTED_NAICS_CODES:
            compliance_status = 'non-compliant'
        
        formatted_submission['complianceChecks'] = [
            {
                'checkId': f'check-{uuid.uuid4().hex[:8]}',
                'category': 'Risk Appetite',
                'status': compliance_status,
                'findings': (f"Industry code {naics_code} is in the restricted list." 
                            if compliance_status == 'non-compliant'
                            else "Industry is within acceptable parameters."),
                'timestamp': datetime.now().isoformat(),
                'dataPoints': {
                    'industryCode': naics_code,
                    'industryDescription': get_nested_value(submission, 'bp_parsed_response.Common.Firmographics.primary_naics_2017.0.desc', 'Unknown')
                }
            },
            {
                'checkId': f'check-{uuid.uuid4().hex[:8]}',
                'category': 'Document Completeness',
                'status': 'attention',
                'findings': "Some required documents are missing or pending review.",
                'timestamp': datetime.now().isoformat(),
                'dataPoints': {
                    'requiredDocuments': 'Application, Loss Runs, Financial Statements',
                    'providedDocuments': 'Application, Loss Runs'
                }
            }
        ]
        
        # Set the overall status based on compliance checks
        if any(check['status'] == 'non-compliant' for check in formatted_submission['complianceChecks']):
            formatted_submission['status'] = 'Non-Compliant'
        elif any(check['status'] == 'attention' for check in formatted_submission['complianceChecks']):
            formatted_submission['status'] = 'At Risk'
        else:
            formatted_submission['status'] = 'Compliant'
        
        return jsonify(formatted_submission)
    
    except Exception as e:
        print(f"Error in get_submission_detail: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add a health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "API server is running"})

# Root endpoint
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Insurance Submission API is running"})

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
    
    # Extract the industry code
    industry_code = get_nested_value(submission, 'insured.industry.code', '')
    
    # Determine compliance based on industry code
    checks = []
    overall_status = "Compliant"
    
    # Document completeness check (always included)
    checks.append({
        "checkId": str(uuid.uuid4())[:8],
        "category": "Document Completeness",
        "status": "compliant",
        "findings": "Required documents check passed.",
        "timestamp": datetime.now().isoformat(),
        "dataPoints": {}
    })
    
    # NAICS code restriction check
    if NAICS_RULE_ENABLED and industry_code in RESTRICTED_NAICS_CODES:
        checks.append({
            "checkId": str(uuid.uuid4())[:8],
            "category": "Risk Appetite", 
            "status": "non-compliant",
            "findings": f"Industry code {industry_code} is in the restricted list.",
            "timestamp": datetime.now().isoformat(),
            "dataPoints": {
                "industryCode": industry_code,
                "industryDescription": get_nested_value(submission, 'insured.industry.description', ''),
                "restrictedCodes": ", ".join(RESTRICTED_NAICS_CODES)
            }
        })
        overall_status = "Non-Compliant"
    else:
        checks.append({
            "checkId": str(uuid.uuid4())[:8],
            "category": "Risk Appetite",
            "status": "compliant",
            "findings": "Industry classification within acceptable parameters.",
            "timestamp": datetime.now().isoformat(),
            "dataPoints": {
                "industryCode": industry_code,
                "industryDescription": get_nested_value(submission, 'insured.industry.description', '')
            }
        })
    
    # Format response to match the frontend expectation
    response = {
        "submissionId": get_nested_value(submission, 'submissionId', ''),
        "timestamp": datetime.now().isoformat(),
        "checks": checks,
        "overallStatus": overall_status
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=8000, host='0.0.0.0')