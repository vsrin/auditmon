# Insurance Submission Monitoring Dashboard: Functional Overview

## Application Purpose

The Insurance Submission Monitoring Dashboard is a comprehensive web application designed for insurance companies to monitor, track, and evaluate insurance submissions for compliance and risk assessment. It provides a central interface for underwriters and compliance officers to review incoming insurance applications, assess their compliance with regulatory requirements, and make informed decisions.

## Core Features

### 1. Dashboard & Analytics
- Main dashboard displays key metrics (total submissions, compliance status)
- Real-time status indicators for submissions (Compliant, At Risk, Non-Compliant)
- Audit alerts highlighting submissions requiring attention
- Quick access to recent submissions

### 2. Submission Management
- List view of all insurance submissions with sorting and filtering
- Detailed view of individual submissions with company information
- Compliance status tracking and visualization
- Document management and verification

### 3. Compliance Monitoring
- Automated compliance checks against predefined rules
- Risk appetite validation (checking against prohibited industry codes)
- Document completeness verification
- Compliance status reports and trends

### 4. Configuration & Settings
- Toggle between Demo mode (synthetic data) and Live mode (API data)
- API endpoint configuration for connecting to external data sources
- Field mapping configuration to align API data with frontend model
- Rule engine configuration for compliance checks

### 5. Debugging Tools
- API Debug utility for troubleshooting API integration
- Raw vs. transformed data comparison
- Data mapping testing and validation

## Technical Architecture

### Frontend (React/TypeScript)
- **UI Components**: Material-UI based components for dashboard, lists, and details
- **State Management**: Redux for global state management (submissions, configuration)
- **API Service**: Handles communication with backend API
- **Data Transformation**: Mapping between API data and frontend data model
- **Mock Data**: Synthetic data generation for demo mode

### Backend (Python/Flask)
- **REST API**: Endpoints for retrieving submission data
- **MongoDB Integration**: Connection to MongoDB for real data
- **Data Transformation**: Simplifies complex nested MongoDB data
- **Compliance Rules**: Evaluates submissions against business rules

### Data Flow
1. Source data comes from MongoDB in a complex nested structure
2. Flask API extracts and transforms into a simplified format
3. React frontend retrieves data via API Service
4. Configuration utility maps API fields to frontend model
5. UI components display the transformed data

## Key Components

### Dashboard Module
- **Dashboard.tsx**: Main dashboard component with metrics and recent submissions
- **AuditAlerts.tsx**: Displays compliance issues requiring attention

### Submissions Module
- **SubmissionList.tsx**: Displays filterable, sortable list of submissions
- **SubmissionDetail.tsx**: Shows comprehensive details for a single submission

### Configuration Module
- **ConfigurationUtility.tsx**: Interface for mapping API fields
- **Settings.tsx**: Application configuration settings

### API & Services
- **apiService.ts**: Handles API communication with support for demo/live modes
- **mockData.ts**: Generates synthetic data for demo mode
- **ruleService.ts**: Evaluates submissions against compliance rules

## Operating Modes

### Demo Mode
- Uses synthetic data generated in mockData.ts
- Provides consistent demo experience with pre-defined metrics
- Useful for demonstrations and testing

### Live Mode
- Connects to external API (Flask server)
- Retrieves real data from MongoDB database
- Transforms complex nested data into usable format

## Deployment
- Built as a static React application
- Configured for Netlify deployment
- Requires connection to running Flask API server for live data

## Integration Points
- MongoDB database containing submission data
- Flask API server (ap.py) for data retrieval and transformation
- Potential for additional external services for extended functionality


## System Architecture

Based on the architecture diagram and documentation provided, the system consists of three main layers:

Data Sources Layer:

MongoDB database storing the original submission data
External APIs for additional data
Data is stored in a complex nested structure

Backend Layer (Flask API Server):

Built with Python/Flask (ap.py)
Handles data transformation from complex nested MongoDB structures
Provides API endpoints:

/api/submissions
/api/submissions/
/api/health

## Performs functions like:

get_nested_value()
map_submission_response()
DateTime to ISO String Conversion

## Frontend Layer (React Application):

Built with React/TypeScript
Uses Material-UI components
Has several key modules:

## API Service (communicates with backend)
Configuration Utility (maps API fields)
UI Components (Dashboard, SubmissionList, etc.)
Mock Data service (for demo mode)
Rule service (for compliance evaluation)


This comprehensive application provides insurance professionals with powerful tools to monitor compliance, assess risks, and make informed decisions on insurance submissions, with flexibility to work in both demonstration and production environments.

see architecure.png


## Rule Management Architecture
System has two separate rule management approaches:

Built-in Dashboard Rules: Basic rules implemented directly in the audit dashboard project
External Rule Engine Service: A separate service with more advanced rule capabilities

Dashboard-side Rule Components
From your dashboard project, you have several rule-related files:

ruleService.ts: Provides basic rule evaluation logic directly in the dashboard:

Contains hardcoded rules for document completeness, risk appetite, etc.
Has methods to evaluate submissions against these built-in rules


ruleEngineProvider.ts: A bridge/adapter between your dashboard and the external rule engine:

Can operate in both local and remote modes
Makes API calls to the external rule engine when in remote mode
Falls back to local evaluation when needed
Maintains some state like restricted NAICS codes


RuleEngineDemo.tsx: A UI component for demonstrating rule configuration:

Allows adding/removing restricted industry codes
Shows which submissions are affected by rule changes
Toggles rule activation

ruleEngineInterface.ts: Defines the interfaces for rules and evaluation results:

Provides a common contract for both local and remote implementations


localRuleEngine.ts: Implements rule evaluation logic directly in the dashboard:

Uses the same interfaces as the remote engine
Provides rule CRUD operations and evaluation


remoteRuleEngine.ts: A client for communicating with the external rule engine:

Makes API calls to the separate rule engine service
Translates between your dashboard's data model and the API



External Rule Engine Service
The separate project (rule-engine-service) you've attached includes:

rule.ts: Defines data models for rules, conditions, actions
ruleEngine.ts: Core evaluation logic
fileStorage.ts: Rule persistence in JSON files
conditionEvaluator.ts: Evaluates rule conditions against submission data
server.ts: Express app with API endpoints
routes/: API routes for rule management and evaluation

How They Work Together
The relationship between these components works like this:

Your dashboard uses ruleEngineProvider.ts as the primary interface for rule operations
The provider decides whether to:

Use the local rule engine (directly in the dashboard)
Call the remote rule engine (separate service)


When in remote mode:

The provider uses remoteRuleEngine.ts to make API calls
These calls go to the endpoints in the separate rule-engine-service
The rule engine evaluates submissions using its own implementation


When in local/demo mode:

The provider uses localRuleEngine.ts or falls back to ruleService.ts
Evaluation happens entirely within the dashboard application


The UI (RuleEngineDemo.tsx) allows configuration of certain aspects like:

Managing restricted NAICS codes
Toggling rule activation
Showing the impact of rules on submissions



Integration with API Service
Your apiService.ts doesn't directly handle rule evaluation. Instead:

It fetches submission data from your backend or uses mock data in demo mode
It transforms complex nested data into your frontend data model
The rule engine (local or remote) then evaluates this transformed data


@⁨Raghu Kancharakuntla⁩ @⁨Mallu Monet⁩ for Jim demo, here is what I am doing to make the pitch. The Audit compliance dashboard tied to ClearNow360 follows this talk track:

The Problem: Show how traditional systems separate compliance from underwriting, leading to wasted effort on non-compliant submissions that are caught too late
The Solution: Demonstrate how your system flags compliance issues in real-time:

Show a submission coming in with an industry in a prohibited class
Watch as it's immediately flagged as non-compliant
See the specific rule that was triggered and why

Value:
Reduction in time spent on submissions that would ultimately be declined
Improved consistency in underwriting decisions
Better visibility into compliance status across the portfolio
Audit-readiness at all times, not just during audit season

So to do this, I am designing the experience like this:

1. Lifecycle-Based Compliance Framework
When users enter the audit compliance section of the dashboard, they'll immediately see that the interface is organized around the insurance lifecycle stages, focusing specifically on:

Stage 1: Submission and Risk Assessment
Stage 2: Risk Engineering and Technical Assessment

This organization immediately signals to Jim that the system understands the insurance workflow and integrates compliance directly into the process.

2. Audit Question-Driven Interface
Within each stage, users see a series of specific audit questions that underwriters must answer:
For Stage 1:
"Were submissions, applications and supplemental apps received?"
"Does risk selection reflect product line / portfolio management strategy and underwriting appetite?"
"Was industry and occupational classification adequately assessed?"
"Has the Insured's financial strength been analyzed?"
"Was an up-to-date loss history received and adequately analyzed?"

For Stage 2:
"Were Risk Engineering reviews ordered & received in a timely manner per guidelines?"
"Has natural CAT exposure been underwritten per line of business guidelines?"

Each audit question shows the current compliance status across the portfolio, with metrics like percentage of submissions in compliance, at risk, or non-compliant.

3. Rule Review and Management
Under each audit question, users can see the specific rules currently enforcing that compliance requirement. For example:

For "Does risk selection reflect underwriting appetite?" they might see rules checking NAICS codes against prohibited lists, validating excluded perils, etc.
For "Has the Insured's financial strength been analyzed?" they'd see rules verifying financial ratio calculations, D&B rating checks, etc.

Users can toggle rules on/off with a simple switch to see how that impacts compliance across the portfolio in real-time.
4. Rule Configuration Experience
When creating or editing a rule, users experience:

Category Selection: Choose which audit question this rule supports
Field Selection: Select from insurance-specific fields like:

Industry Code (SIC/NAICS)
Financial Ratings
Loss Ratio calculations
Document completeness metrics
Risk engineering review status


Condition Builder: Set thresholds or criteria using insurance terminology

"Industry code not in prohibited list"
"Financial strength rating above B+"
"Loss ratio below 60%"


Action Configuration: Define what happens when the rule is triggered

Flag as "At Risk" or "Non-Compliant"
Add specific findings text that explains the issue
Set severity level


Plain English Preview: See a natural language description of what the rule does

"If the submission's industry code appears in the prohibited industry list, mark the submission as Non-Compliant with the message: 'Industry falls outside acceptable risk appetite'"


5. Real-Time Impact Analysis
The most powerful feature investors will see is the real-time impact analysis:

Before Saving: Users see how many current submissions would be affected by the rule change
Portfolio Impact: Visual breakdown showing how many submissions would move between compliance statuses
Specific Examples: A sample of affected submissions that would change status
Risk Profile Shift: How the overall risk profile of the portfolio would change

This allows underwriters and compliance officers to make informed decisions about rule changes and understand their implications before implementing them.

6. Integration with Submission Dashboard
From the main submission dashboard, users see compliance status indicators for each submission:

Green checkmarks for compliant submissions
Yellow warnings for "at risk" submissions
Red flags for non-compliant submissions

Clicking these indicators takes users directly to the specific compliance checks that were performed, showing which rules passed and which failed.