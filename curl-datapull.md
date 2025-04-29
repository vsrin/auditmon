curl -X GET "http://localhost:8000/api/submissions?limit=50" -H "Content-Type: application/json" | jq '.[0:50] | map({
  submissionId: .tx_id,
  insured: {
    name: .bp_parsed_response.Common.Firmographics.company_name.value,
    industry: {
      code: .bp_parsed_response.Common.Firmographics.primary_sic[0].code,
      description: .bp_parsed_response.Common.Firmographics.primary_sic[0].desc
    },
    address: {
      street: .bp_parsed_response.Common.Firmographics.address_1.value,
      city: .bp_parsed_response.Common.Firmographics.city.value,
      state: .bp_parsed_response.Common.Firmographics.state.value,
      zip: .bp_parsed_response.Common.Firmographics.postal_code.value
    },
    yearsInBusiness: "",
    employeeCount: .bp_parsed_response.Common.Firmographics.total_full_time_employees.value
  },
  broker: {
    name: .bp_parsed_response.Common."Broker Details".broker_name.value,
    email: .bp_parsed_response.Common."Broker Details".broker_email.value
  },
  timestamp: .created_on,
  status: ""
})' | jq . > filtered_submissions.json