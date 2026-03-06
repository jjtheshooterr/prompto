/**
 * Seed 50 surgical SaaS AI problems for validation sprint
 * 
 * CRITICAL: Each problem must pass this test:
 * "If a SaaS founder reads it, do they think: 'I literally dealt with this last week'?"
 * 
 * Specificity = credibility
 */

interface SeedProblem {
  title: string
  description: string
  industry: string
  tags: string[]
  example_prompts: {
    title: string
    user_prompt_template: string
    system_prompt?: string
    notes?: string
  }[]
}

// ============================================================================
// FINANCIAL DATA PROCESSING (10 problems)
// ============================================================================

const financialProblems: SeedProblem[] = [
  {
    title: "Prevent hallucinated financial totals when summarizing Stripe exports",
    description: "When generating monthly revenue summaries from Stripe CSV exports, the AI often invents totals that don't match the actual data. Need a prompt that forces exact arithmetic verification and flags any discrepancies before presenting the summary.",
    industry: "Financial",
    tags: ["stripe", "revenue", "accuracy", "hallucination-prevention"],
    example_prompts: [
      {
        title: "Verified Stripe Summary with Arithmetic Check",
        user_prompt_template: "Summarize this Stripe export CSV. Before presenting totals, verify: (1) Sum all 'amount' values manually, (2) Compare to any totals you calculated, (3) If mismatch, flag ERROR and show both numbers.\n\nCSV data:\n{csv_content}",
        notes: "Forces the model to show its work and catch hallucinated totals"
      }
    ]
  },
  {
    title: "Categorize expenses with correct IRS tax codes for quarterly filing",
    description: "Need to auto-categorize business expenses from bank statements into IRS Schedule C categories (advertising, office supplies, travel, etc.) with the correct line numbers. Generic 'expense categorization' isn't enough - need the actual tax form line references.",
    industry: "Financial",
    tags: ["tax", "irs", "expense-categorization", "schedule-c"],
    example_prompts: [
      {
        title: "IRS Schedule C Expense Categorizer",
        user_prompt_template: "Categorize these expenses into IRS Schedule C categories with line numbers:\n\n{expense_list}\n\nFor each expense, provide:\n- Category name\n- Schedule C line number\n- Confidence level (high/medium/low)\n- Flag any that need manual review",
        notes: "Specific to US tax forms, not generic categories"
      }
    ]
  },

  {
    title: "Detect anomalous refund patterns that indicate fraud or abuse",
    description: "When refund rates spike for specific products or customer segments, need to identify the pattern before it becomes a chargeback problem. Looking for prompts that can spot 'refund within 24 hours of purchase' or 'same customer, different cards' patterns.",
    industry: "Financial",
    tags: ["fraud-detection", "refunds", "chargebacks", "pattern-recognition"],
    example_prompts: [
      {
        title: "Refund Pattern Anomaly Detector",
        user_prompt_template: "Analyze these refund records for abuse patterns:\n\n{refund_data}\n\nFlag:\n- Refunds within 24h of purchase\n- Same email/IP with multiple cards\n- Refund rate >30% for any product\n- Geographic clustering of refunds\n\nFor each pattern, provide severity (low/medium/high) and recommended action.",
        notes: "Focuses on actionable fraud indicators, not generic anomaly detection"
      }
    ]
  },

  {
    title: "Generate cash flow forecasts that account for SaaS-specific payment timing",
    description: "SaaS cash flow is weird: annual plans paid upfront, monthly MRR, failed payments, dunning delays. Need forecasts that understand 'customer paid annually in January, so no revenue in Feb-Dec' vs 'monthly customer churned, so revenue stops immediately'.",
    industry: "Financial",
    tags: ["cash-flow", "forecasting", "saas-metrics", "mrr"],
    example_prompts: [
      {
        title: "SaaS Cash Flow Forecaster",
        user_prompt_template: "Generate 90-day cash flow forecast from this subscription data:\n\n{subscription_data}\n\nAccount for:\n- Annual plans (revenue already collected)\n- Monthly MRR (recurring)\n- Failed payment retry schedule (Stripe default: 4 attempts over 3 weeks)\n- Churn rate: {churn_rate}%\n\nShow: expected cash in, expected churn loss, net cash position by week.",
        notes: "SaaS-specific payment timing, not generic forecasting"
      }
    ]
  },

  {
    title: "Extract structured invoice data from PDF invoices with inconsistent formats",
    description: "Vendors send invoices in wildly different PDF formats. Need to extract: invoice number, date, total, line items, tax - even when the PDF is a scanned image or has weird layouts. Generic OCR isn't enough; need structured extraction.",
    industry: "Financial",
    tags: ["invoice-processing", "ocr", "data-extraction", "pdf"],
    example_prompts: [
      {
        title: "Multi-Format Invoice Extractor",
        user_prompt_template: "Extract structured data from this invoice (text or image):\n\n{invoice_content}\n\nRequired fields:\n- Invoice number\n- Invoice date\n- Vendor name\n- Total amount\n- Tax amount\n- Line items (description, quantity, unit price, total)\n\nIf any required field is missing or unclear, flag it for manual review. Return as JSON.",
        notes: "Handles both text and image PDFs, returns structured data"
      }
    ]
  },

  {
    title: "Reconcile Stripe payouts with bank deposits when timing doesn't match",
    description: "Stripe payouts take 2-7 days to hit the bank, and the amounts don't always match due to fees, refunds, or disputes. Need to match 'Stripe says $5,432 on Monday' with 'Bank shows $5,380 on Wednesday' and explain the difference.",
    industry: "Financial",
    tags: ["reconciliation", "stripe", "banking", "accounting"],
    example_prompts: [
      {
        title: "Stripe-to-Bank Reconciliation Matcher",
        user_prompt_template: "Match these Stripe payouts with bank deposits:\n\nStripe payouts:\n{stripe_payouts}\n\nBank deposits:\n{bank_deposits}\n\nFor each match:\n- Show Stripe payout date and amount\n- Show bank deposit date and amount\n- Explain any difference (fees, refunds, disputes)\n- Flag unmatched items\n\nAccount for 2-7 day delay between payout and deposit.",
        notes: "Handles timing delays and fee discrepancies"
      }
    ]
  },

  {
    title: "Calculate SaaS revenue recognition for annual plans under ASC 606",
    description: "Customer pays $12,000 upfront for annual plan. Can't recognize it all in month 1 - need to spread it over 12 months per ASC 606. Need prompts that handle: partial months, mid-month starts, upgrades, downgrades, and refunds.",
    industry: "Financial",
    tags: ["revenue-recognition", "asc-606", "saas-accounting", "gaap"],
    example_prompts: [
      {
        title: "ASC 606 Revenue Recognition Calculator",
        user_prompt_template: "Calculate monthly revenue recognition for these annual subscriptions:\n\n{subscription_data}\n\nRules:\n- Spread revenue evenly over contract term\n- Handle partial months (prorate by days)\n- Account for upgrades (recognize difference immediately)\n- Account for refunds (reverse unearned revenue)\n\nProvide monthly revenue schedule and journal entries.",
        notes: "ASC 606 compliant, handles edge cases"
      }
    ]
  },

  {
    title: "Flag high-risk transactions before they become chargebacks",
    description: "Certain patterns predict chargebacks: first-time customer + high-value purchase + VPN + disposable email. Need to score transactions in real-time and flag the risky ones before fulfillment.",
    industry: "Financial",
    tags: ["fraud-prevention", "chargebacks", "risk-scoring", "payment-processing"],
    example_prompts: [
      {
        title: "Chargeback Risk Scorer",
        user_prompt_template: "Score this transaction for chargeback risk:\n\n{transaction_data}\n\nRisk factors:\n- First-time customer (+2 points)\n- Purchase >$500 (+3 points)\n- VPN/proxy detected (+2 points)\n- Disposable email (+2 points)\n- Shipping != billing address (+1 point)\n- High-risk country (+2 points)\n\nTotal score:\n- 0-3: Low risk (approve)\n- 4-6: Medium risk (manual review)\n- 7+: High risk (decline)\n\nProvide score, risk level, and recommendation.",
        notes: "Actionable risk scoring with clear thresholds"
      }
    ]
  },

  {
    title: "Identify tax-deductible expenses from mixed personal/business transactions",
    description: "Indie founders use personal cards for business expenses. Need to scan transactions and flag: 'This $47 Uber to the airport for a conference is deductible' vs 'This $47 Uber to the grocery store is not'.",
    industry: "Financial",
    tags: ["tax-deductions", "expense-tracking", "business-expenses", "irs"],
    example_prompts: [
      {
        title: "Business Expense Deduction Identifier",
        user_prompt_template: "Review these transactions and identify tax-deductible business expenses:\n\n{transaction_list}\n\nFor each transaction, determine:\n- Is it business-related? (yes/no/maybe)\n- If yes, what category? (travel, meals, office, etc.)\n- Deduction percentage (100% or 50% for meals)\n- Confidence level\n\nFlag 'maybe' items for manual review.",
        notes: "Handles mixed personal/business transactions"
      }
    ]
  },

  {
    title: "Calculate lifetime value (LTV) that accounts for actual churn patterns",
    description: "Generic LTV formulas assume constant churn. Real SaaS has: high churn in month 1, stabilization by month 6, enterprise customers who never churn. Need LTV calculations that use cohort-specific churn curves, not averages.",
    industry: "Financial",
    tags: ["ltv", "churn", "saas-metrics", "cohort-analysis"],
    example_prompts: [
      {
        title: "Cohort-Based LTV Calculator",
        user_prompt_template: "Calculate LTV using these cohort churn rates:\n\n{cohort_data}\n\nDon't use average churn. Use actual retention curves:\n- Month 1: {month1_retention}%\n- Month 3: {month3_retention}%\n- Month 6: {month6_retention}%\n- Month 12+: {month12_retention}%\n\nProvide:\n- LTV by cohort\n- Weighted average LTV\n- Confidence interval\n\nShow your work.",
        notes: "Uses real churn curves, not simplified averages"
      }
    ]
  }
]

// ============================================================================
// SUPPORT TICKET ANALYSIS (10 problems)
// ============================================================================

const supportProblems: SeedProblem[] = [
  {
    title: "Classify support tickets by churn risk, not just sentiment",
    description: "Sentiment analysis says 'negative', but that's not enough. Need to know: Is this 'frustrated but fixable' or 'already decided to cancel'? Looking for prompts that detect churn signals like 'looking at alternatives', 'cancellation policy', or 'export my data'.",
    industry: "Support",
    tags: ["churn-prediction", "ticket-classification", "customer-success", "retention"],
    example_prompts: [
      {
        title: "Churn Risk Ticket Classifier",
        user_prompt_template: "Classify this support ticket by churn risk:\n\n{ticket_content}\n\nChurn signals:\n- HIGH: mentions competitors, cancellation, refund, 'export data'\n- MEDIUM: repeated issues, escalation language, 'disappointed'\n- LOW: feature requests, how-to questions, minor bugs\n\nProvide:\n- Risk level (high/medium/low)\n- Specific signals detected\n- Recommended response urgency\n- Suggested owner (support vs customer success)",
        notes: "Focuses on churn risk, not generic sentiment"
      }
    ]
  },

  {
    title: "Detect SLA breach risk before the deadline hits",
    description: "SLA says 'respond within 4 hours'. It's been 3 hours and the ticket is still unassigned. Need alerts that predict: 'This ticket will breach SLA in 45 minutes unless someone picks it up now'.",
    industry: "Support",
    tags: ["sla-management", "breach-prevention", "ticket-routing", "alerting"],
    example_prompts: [
      {
        title: "SLA Breach Predictor",
        user_prompt_template: "Analyze these open tickets for SLA breach risk:\n\n{ticket_data}\n\nSLA rules:\n- Priority 1: respond within 1 hour\n- Priority 2: respond within 4 hours\n- Priority 3: respond within 24 hours\n\nFor each ticket:\n- Time since creation\n- Time until SLA breach\n- Current status (assigned/unassigned)\n- Breach risk (critical <30min, warning <1hr, ok)\n\nSort by urgency. Flag critical tickets.",
        notes: "Proactive breach prevention, not reactive reporting"
      }
    ]
  },

  {
    title: "Generate context-aware auto-responses that don't sound robotic",
    description: "Customer asks: 'Why was I charged twice?' Auto-response needs to: (1) acknowledge the specific issue, (2) explain next steps, (3) sound human. Generic 'We received your ticket' responses make things worse.",
    industry: "Support",
    tags: ["auto-response", "ticket-automation", "customer-communication", "personalization"],
    example_prompts: [
      {
        title: "Context-Aware Auto-Response Generator",
        user_prompt_template: "Generate a human-sounding auto-response for this ticket:\n\n{ticket_content}\n\nRequirements:\n- Acknowledge the specific issue (don't be generic)\n- Explain what happens next\n- Set realistic expectations\n- Sound empathetic, not robotic\n- Keep it under 100 words\n\nAvoid: 'We received your ticket', 'Your ticket number is', 'We value your feedback'",
        notes: "Context-specific, human-sounding, avoids clichés"
      }
    ]
  },

  {
    title: "Extract actionable bug reports from rambling customer messages",
    description: "Customer writes 3 paragraphs about their frustration. Buried in there: 'When I click Export on the Reports page, nothing happens'. Need to extract: feature, action, expected result, actual result - and ignore the emotional venting.",
    industry: "Support",
    tags: ["bug-extraction", "ticket-parsing", "issue-tracking", "structured-data"],
    example_prompts: [
      {
        title: "Bug Report Extractor",
        user_prompt_template: "Extract structured bug report from this customer message:\n\n{customer_message}\n\nExtract:\n- Feature/page affected\n- Action taken\n- Expected result\n- Actual result\n- Browser/device (if mentioned)\n- Steps to reproduce\n\nIgnore emotional language. Focus on technical details. If info is missing, flag it.",
        notes: "Extracts signal from noise, creates structured bug reports"
      }
    ]
  },

  {
    title: "Route tickets to the right team based on technical complexity",
    description: "Tier 1 support can handle password resets. Tier 2 handles API errors. Engineering handles database corruption. Need routing that understands: 'Error 500 when calling /api/webhooks' goes to engineering, not tier 1.",
    industry: "Support",
    tags: ["ticket-routing", "triage", "team-assignment", "complexity-detection"],
    example_prompts: [
      {
        title: "Technical Complexity Router",
        user_prompt_template: "Route this ticket to the appropriate team:\n\n{ticket_content}\n\nTeams:\n- Tier 1: password resets, billing questions, how-to questions\n- Tier 2: API errors, integration issues, data export problems\n- Engineering: database errors, performance issues, security concerns\n- Sales: upgrade requests, enterprise inquiries\n\nProvide:\n- Recommended team\n- Complexity level (simple/moderate/complex)\n- Reasoning\n- Urgency (low/medium/high)",
        notes: "Routes by technical complexity, not just keywords"
      }
    ]
  },

  {
    title: "Identify feature requests that multiple customers are asking for",
    description: "5 customers this week mentioned 'bulk export'. 3 mentioned 'dark mode'. Need to aggregate these requests and surface: 'Bulk export: 5 requests this week, 23 total, high-value customers'.",
    industry: "Support",
    tags: ["feature-requests", "product-feedback", "aggregation", "prioritization"],
    example_prompts: [
      {
        title: "Feature Request Aggregator",
        user_prompt_template: "Analyze these support tickets for feature requests:\n\n{ticket_batch}\n\nFor each unique feature request:\n- Feature name (normalized)\n- Number of requests\n- Customer segments (free/paid/enterprise)\n- Urgency indicators\n- Related tickets\n\nRank by: (number of requests) × (customer value) × (urgency)\n\nHighlight requests from high-value customers.",
        notes: "Aggregates and prioritizes feature requests"
      }
    ]
  },

  {
    title: "Generate knowledge base articles from resolved ticket threads",
    description: "Support agent solved a tricky issue over 8 messages. Now turn that thread into a KB article: clear problem statement, step-by-step solution, no back-and-forth confusion.",
    industry: "Support",
    tags: ["knowledge-base", "documentation", "ticket-resolution", "self-service"],
    example_prompts: [
      {
        title: "Ticket-to-KB Article Converter",
        user_prompt_template: "Convert this resolved ticket thread into a knowledge base article:\n\n{ticket_thread}\n\nArticle structure:\n- Title (clear, searchable)\n- Problem description\n- Solution (step-by-step)\n- Prerequisites (if any)\n- Related articles\n\nRemove:\n- Back-and-forth confusion\n- Agent names\n- Emotional language\n- Irrelevant details\n\nKeep it under 300 words.",
        notes: "Distills ticket threads into clean KB articles"
      }
    ]
  },

  {
    title: "Detect when customers are asking the same question repeatedly",
    description: "Customer asked about API rate limits 3 times in 2 weeks. Either they didn't understand the answer, or the docs are unclear. Need to flag: 'This customer keeps asking about X - escalate or improve docs'.",
    industry: "Support",
    tags: ["repeat-questions", "customer-success", "documentation-gaps", "escalation"],
    example_prompts: [
      {
        title: "Repeat Question Detector",
        user_prompt_template: "Analyze this customer's ticket history for repeat questions:\n\n{ticket_history}\n\nDetect:\n- Same question asked multiple times\n- Similar issues with different wording\n- Unresolved confusion\n\nFor each repeat pattern:\n- Topic\n- Number of times asked\n- Time span\n- Whether previous answers resolved it\n- Recommended action (escalate, improve docs, schedule call)",
        notes: "Identifies repeat questions and suggests fixes"
      }
    ]
  },

  {
    title: "Summarize long ticket threads for handoffs between support agents",
    description: "Ticket has 15 messages over 3 days. New agent needs to get up to speed in 30 seconds. Need summary: 'Customer can't export reports. Tried X, Y, Z. Still broken. Waiting on engineering to check database'.",
    industry: "Support",
    tags: ["ticket-summary", "handoff", "agent-productivity", "context"],
    example_prompts: [
      {
        title: "Ticket Thread Summarizer",
        user_prompt_template: "Summarize this ticket thread for agent handoff:\n\n{ticket_thread}\n\nProvide:\n- Core issue (1 sentence)\n- What's been tried\n- Current status\n- Next steps\n- Blockers (if any)\n\nKeep it under 100 words. Focus on what the new agent needs to know right now.",
        notes: "Concise handoff summaries for agent productivity"
      }
    ]
  },

  {
    title: "Flag tickets where the customer is about to escalate publicly",
    description: "Customer says 'If this isn't fixed by tomorrow, I'm posting on Twitter'. That's a red flag. Need to detect escalation threats and route to senior support immediately.",
    industry: "Support",
    tags: ["escalation-detection", "crisis-management", "social-media", "reputation"],
    example_prompts: [
      {
        title: "Public Escalation Threat Detector",
        user_prompt_template: "Analyze this ticket for public escalation risk:\n\n{ticket_content}\n\nEscalation signals:\n- Mentions Twitter, Reddit, review sites\n- Threatens public complaint\n- Mentions competitors\n- Uses ultimatum language ('if not fixed by...')\n- High frustration + large audience\n\nProvide:\n- Escalation risk (low/medium/high/critical)\n- Specific threats detected\n- Recommended response time\n- Suggested owner (senior support/customer success/executive)",
        notes: "Detects public escalation threats before they happen"
      }
    ]
  }
]

// ============================================================================
// API & INTEGRATION PROBLEMS (10 problems)
// ============================================================================

const apiProblems: SeedProblem[] = [
  {
    title: "Generate idempotent database migrations that won't break on retry",
    description: "Migration fails halfway through. Need to re-run it without creating duplicate columns or breaking existing data. Need prompts that generate: 'IF NOT EXISTS' checks, rollback logic, and safe retry patterns.",
    industry: "API/Dev",
    tags: ["database-migrations", "idempotency", "sql", "devops"],
    example_prompts: [
      {
        title: "Idempotent Migration Generator",
        user_prompt_template: "Generate an idempotent database migration for:\n\n{migration_description}\n\nRequirements:\n- Use IF NOT EXISTS for new tables/columns\n- Check for existing data before transformations\n- Include rollback logic\n- Handle partial completion\n- Add verification queries\n\nDatabase: {database_type}\n\nProvide: up migration, down migration, verification steps.",
        notes: "Safe migrations that can be retried without breaking"
      }
    ]
  },

  {
    title: "Validate webhook payloads before processing to prevent bad data",
    description: "Stripe sends a webhook. Before processing, need to verify: signature is valid, required fields exist, amounts are reasonable, timestamp is recent. One bad webhook can corrupt your database.",
    industry: "API/Dev",
    tags: ["webhooks", "validation", "data-integrity", "security"],
    example_prompts: [
      {
        title: "Webhook Payload Validator",
        user_prompt_template: "Generate validation logic for this webhook:\n\n{webhook_schema}\n\nValidate:\n- Signature (HMAC SHA256)\n- Required fields present\n- Field types correct\n- Amounts within reasonable range\n- Timestamp within last 5 minutes\n- Idempotency (not already processed)\n\nProvide:\n- Validation function\n- Error messages for each failure case\n- Logging recommendations",
        notes: "Comprehensive webhook validation before processing"
      }
    ]
  },

  {
    title: "Generate SQL queries from natural language that won't cause N+1 problems",
    description: "User asks: 'Show me all customers and their orders'. Naive query causes N+1. Need prompts that generate: proper JOINs, eager loading, and explain the performance implications.",
    industry: "API/Dev",
    tags: ["sql-generation", "query-optimization", "n+1-prevention", "performance"],
    example_prompts: [
      {
        title: "Performance-Aware SQL Generator",
        user_prompt_template: "Generate SQL for: {natural_language_query}\n\nDatabase schema:\n{schema}\n\nRequirements:\n- Use JOINs, not subqueries in loops\n- Avoid N+1 queries\n- Use indexes where available\n- Limit results if unbounded\n- Explain performance implications\n\nProvide:\n- Optimized SQL query\n- Expected query plan\n- Performance notes\n- Index recommendations",
        notes: "Generates performant SQL, not just correct SQL"
      }
    ]
  },

  {
    title: "Detect API rate limit patterns before hitting the limit",
    description: "Stripe allows 100 requests/second. You're at 87/second and climbing. Need to predict: 'At current rate, you'll hit the limit in 3 minutes' and throttle proactively.",
    industry: "API/Dev",
    tags: ["rate-limiting", "api-management", "throttling", "monitoring"],
    example_prompts: [
      {
        title: "Rate Limit Predictor",
        user_prompt_template: "Analyze API usage and predict rate limit breach:\n\nCurrent usage:\n{usage_data}\n\nRate limits:\n{rate_limits}\n\nProvide:\n- Current usage rate\n- Trend (increasing/stable/decreasing)\n- Time until limit breach (if trending up)\n- Recommended throttling strategy\n- Which endpoints to throttle first",
        notes: "Proactive rate limit management, not reactive errors"
      }
    ]
  },

  {
    title: "Generate API error messages that developers can actually debug",
    description: "Generic 'Invalid request' doesn't help. Need: 'Field \"email\" is required but missing' or 'Amount must be positive integer, got -500'. Error messages should tell developers exactly what to fix.",
    industry: "API/Dev",
    tags: ["error-messages", "api-design", "developer-experience", "debugging"],
    example_prompts: [
      {
        title: "Actionable API Error Generator",
        user_prompt_template: "Generate a helpful error message for this API failure:\n\n{error_context}\n\nInclude:\n- What went wrong (specific field/value)\n- Why it's wrong (validation rule)\n- How to fix it (example of correct format)\n- Error code (for programmatic handling)\n- Link to docs (if applicable)\n\nBad: 'Invalid request'\nGood: 'Field \"amount\" must be positive integer in cents, got \"-500\". Example: 1000 for $10.00'",
        notes: "Developer-friendly error messages with actionable fixes"
      }
    ]
  },

  {
    title: "Convert Postman collections to integration tests automatically",
    description: "You have 50 API requests in Postman. Need to turn them into automated tests with assertions: 'POST /users should return 201', 'GET /users/:id should include email field', etc.",
    industry: "API/Dev",
    tags: ["api-testing", "postman", "test-automation", "integration-tests"],
    example_prompts: [
      {
        title: "Postman-to-Test Converter",
        user_prompt_template: "Convert this Postman collection to integration tests:\n\n{postman_collection}\n\nFor each request, generate:\n- Test name\n- Setup (auth, headers)\n- Request\n- Assertions (status code, response schema, specific fields)\n- Cleanup (if needed)\n\nTest framework: {framework}\n\nInclude: happy path, error cases, edge cases.",
        notes: "Converts Postman collections to runnable tests"
      }
    ]
  },

  {
    title: "Generate OpenAPI specs from existing API code automatically",
    description: "You built an API without docs. Now you need OpenAPI/Swagger specs. Need to scan the code and generate: endpoints, parameters, request/response schemas, auth requirements.",
    industry: "API/Dev",
    tags: ["openapi", "api-documentation", "swagger", "code-analysis"],
    example_prompts: [
      {
        title: "Code-to-OpenAPI Generator",
        user_prompt_template: "Generate OpenAPI 3.0 spec from this API code:\n\n{api_code}\n\nExtract:\n- Endpoints (path, method)\n- Parameters (path, query, body)\n- Request schemas\n- Response schemas (success + errors)\n- Auth requirements\n- Descriptions (from comments)\n\nProvide complete OpenAPI YAML.",
        notes: "Generates OpenAPI specs from existing code"
      }
    ]
  },

  {
    title: "Detect breaking changes in API responses before deploying",
    description: "You changed the API response structure. Will it break existing clients? Need to compare old vs new response schemas and flag: 'Removed field \"user.email\" - BREAKING CHANGE'.",
    industry: "API/Dev",
    tags: ["api-versioning", "breaking-changes", "backwards-compatibility", "deployment"],
    example_prompts: [
      {
        title: "API Breaking Change Detector",
        user_prompt_template: "Compare these API response schemas for breaking changes:\n\nOld schema:\n{old_schema}\n\nNew schema:\n{new_schema}\n\nBreaking changes:\n- Removed fields\n- Changed field types\n- Changed field names\n- Removed endpoints\n- Changed required fields\n\nNon-breaking changes:\n- Added optional fields\n- Added endpoints\n\nProvide:\n- List of breaking changes\n- List of non-breaking changes\n- Recommended version bump (major/minor/patch)",
        notes: "Detects breaking changes before deployment"
      }
    ]
  },

  {
    title: "Generate retry logic with exponential backoff for flaky APIs",
    description: "Third-party API fails randomly. Need retry logic: 1st retry after 1s, 2nd after 2s, 3rd after 4s, then give up. Include: max retries, timeout, which errors to retry, which to fail immediately.",
    industry: "API/Dev",
    tags: ["retry-logic", "exponential-backoff", "error-handling", "resilience"],
    example_prompts: [
      {
        title: "Exponential Backoff Retry Generator",
        user_prompt_template: "Generate retry logic for this API call:\n\n{api_call_code}\n\nRetry strategy:\n- Max retries: {max_retries}\n- Initial delay: {initial_delay}ms\n- Backoff multiplier: {multiplier}x\n- Max delay: {max_delay}ms\n- Timeout per attempt: {timeout}ms\n\nRetry on: 5xx errors, network errors, timeouts\nDon't retry on: 4xx errors (except 429), auth errors\n\nProvide: retry wrapper function with logging.",
        notes: "Production-ready retry logic with exponential backoff"
      }
    ]
  },

  {
    title: "Parse and validate complex JSON schemas with helpful error messages",
    description: "API expects nested JSON with 20 fields. User sends invalid data. Need validation that says: 'Field \"items[2].price\" must be number, got string \"free\"' - not just 'Invalid JSON'.",
    industry: "API/Dev",
    tags: ["json-validation", "schema-validation", "error-messages", "data-validation"],
    example_prompts: [
      {
        title: "JSON Schema Validator with Path-Specific Errors",
        user_prompt_template: "Generate validation logic for this JSON schema:\n\n{json_schema}\n\nRequirements:\n- Validate all fields\n- Provide path-specific errors (e.g., \"items[2].price\")\n- Include expected vs actual values\n- Suggest fixes\n- Handle nested objects and arrays\n\nProvide:\n- Validation function\n- Error message format\n- Example error output",
        notes: "Detailed validation errors with JSON paths"
      }
    ]
  }
]

// ============================================================================
// CONTENT OPERATIONS (10 problems)
// ============================================================================

const contentProblems: SeedProblem[] = [
  {
    title: "Generate SEO meta descriptions that include target keywords naturally",
    description: "Need meta descriptions for SaaS landing pages that: (1) include target keyword, (2) stay under 160 chars, (3) don't sound keyword-stuffed, (4) include a call-to-action. Generic descriptions don't rank.",
    industry: "Content",
    tags: ["seo", "meta-descriptions", "landing-pages", "keywords"],
    example_prompts: [
      {
        title: "SEO Meta Description Generator",
        user_prompt_template: "Generate SEO meta description for this landing page:\n\nPage content:\n{page_content}\n\nTarget keyword: {keyword}\n\nRequirements:\n- Include target keyword naturally\n- 150-160 characters\n- Include call-to-action\n- Don't keyword-stuff\n- Match search intent\n\nProvide 3 variations.",
        notes: "SEO-optimized meta descriptions with natural keyword usage"
      }
    ]
  },

  {
    title: "Rewrite technical error messages for end users without losing accuracy",
    description: "Error: 'PostgreSQL connection pool exhausted'. User sees: 'Our database is temporarily busy. Try again in 30 seconds.' Need to translate technical errors into user-friendly language without lying.",
    industry: "Content",
    tags: ["error-messages", "user-experience", "technical-writing", "plain-language"],
    example_prompts: [
      {
        title: "User-Friendly Error Translator",
        user_prompt_template: "Translate this technical error for end users:\n\nTechnical error:\n{technical_error}\n\nRequirements:\n- Plain language (no jargon)\n- Explain what happened\n- Explain what to do next\n- Set realistic expectations\n- Don't lie or oversimplify\n\nBad: 'Something went wrong'\nGood: 'Our servers are handling more requests than usual. Try again in 30 seconds.'",
        notes: "Translates technical errors to user-friendly language"
      }
    ]
  },

  {
    title: "Generate changelog entries from Git commits that users actually care about",
    description: "Git commits: 'fix typo', 'refactor utils', 'update deps'. Users don't care. Need changelog: 'Fixed: Export button now works in Safari', 'Improved: Reports load 2x faster'. Focus on user impact, not code changes.",
    industry: "Content",
    tags: ["changelog", "release-notes", "git-commits", "user-communication"],
    example_prompts: [
      {
        title: "User-Focused Changelog Generator",
        user_prompt_template: "Generate changelog from these Git commits:\n\n{git_commits}\n\nRules:\n- Focus on user impact, not code changes\n- Group by: New, Improved, Fixed\n- Skip: refactors, dependency updates, internal changes\n- Use plain language\n- Be specific (which feature, which browser)\n\nBad: 'Updated authentication logic'\nGood: 'Fixed: Login now works with password managers'",
        notes: "User-focused changelogs, not developer-focused"
      }
    ]
  },

  {
    title: "Adapt blog posts for Twitter threads without losing the key points",
    description: "You wrote a 1,500-word blog post. Need to turn it into a 10-tweet thread that: (1) hooks in tweet 1, (2) covers key points, (3) ends with CTA, (4) doesn't feel like a summary.",
    industry: "Content",
    tags: ["twitter", "social-media", "content-repurposing", "thread-writing"],
    example_prompts: [
      {
        title: "Blog-to-Twitter Thread Converter",
        user_prompt_template: "Convert this blog post to a Twitter thread:\n\n{blog_post}\n\nThread structure:\n- Tweet 1: Hook (surprising stat, bold claim, or question)\n- Tweets 2-9: Key points (one per tweet, with examples)\n- Tweet 10: CTA (link to full post)\n\nRequirements:\n- Each tweet <280 chars\n- Don't just summarize - make it engaging\n- Use line breaks for readability\n- Include 1-2 emojis max",
        notes: "Engaging Twitter threads, not boring summaries"
      }
    ]
  },

  {
    title: "Generate product descriptions that highlight benefits, not features",
    description: "Feature: 'Real-time sync'. Benefit: 'Your team always sees the latest data, no refresh needed'. Need prompts that convert feature lists into benefit-driven copy that answers: 'So what?'",
    industry: "Content",
    tags: ["product-descriptions", "copywriting", "benefits", "marketing"],
    example_prompts: [
      {
        title: "Feature-to-Benefit Converter",
        user_prompt_template: "Convert these product features to benefit-driven copy:\n\n{feature_list}\n\nFor each feature:\n- State the feature\n- Explain the benefit (answer 'So what?')\n- Include a concrete example\n- Keep it under 50 words\n\nBad: 'Real-time sync'\nGood: 'Real-time sync means your team always sees the latest data. No more \"Did you get my update?\" messages.'",
        notes: "Benefit-driven product descriptions"
      }
    ]
  },

  {
    title: "Write refund emails that prevent chargeback escalation",
    description: "Customer requests refund. If you just say 'Refund processed', they might still file a chargeback. Need emails that: (1) confirm refund, (2) explain timeline, (3) ask them NOT to file chargeback, (4) stay friendly.",
    industry: "Content",
    tags: ["refunds", "customer-communication", "chargeback-prevention", "email"],
    example_prompts: [
      {
        title: "Chargeback-Prevention Refund Email",
        user_prompt_template: "Write a refund confirmation email:\n\nRefund details:\n{refund_details}\n\nRequirements:\n- Confirm refund processed\n- Explain timeline (5-10 business days)\n- Politely ask them NOT to file chargeback\n- Offer to help with any other issues\n- Stay friendly and professional\n\nTone: apologetic but not desperate",
        notes: "Refund emails that prevent chargebacks"
      }
    ]
  },

  {
    title: "Generate help article titles that match how users actually search",
    description: "You write: 'Configuring OAuth 2.0 Authentication'. Users search: 'How do I connect my Google account'. Need titles that match user language, not technical jargon.",
    industry: "Content",
    tags: ["help-articles", "documentation", "search-optimization", "user-language"],
    example_prompts: [
      {
        title: "User-Language Help Title Generator",
        user_prompt_template: "Generate help article titles for this topic:\n\n{article_topic}\n\nProvide:\n- Technical title (for internal use)\n- User-friendly title (how users search)\n- Alternative phrasings (3-5 variations)\n\nBad: 'Configuring OAuth 2.0 Authentication'\nGood: 'How do I connect my Google account?'\n\nFocus on: how users ask questions, not how engineers describe features.",
        notes: "Help titles that match user search language"
      }
    ]
  },

  {
    title: "Summarize privacy policies into plain-language bullet points",
    description: "Privacy policy is 5,000 words of legal text. Users need: 'We collect your email and usage data. We don't sell it. We use it to improve the product.' 5 bullets max.",
    industry: "Content",
    tags: ["privacy-policy", "legal", "plain-language", "compliance"],
    example_prompts: [
      {
        title: "Privacy Policy Summarizer",
        user_prompt_template: "Summarize this privacy policy in plain language:\n\n{privacy_policy}\n\nProvide:\n- What data we collect\n- Why we collect it\n- Who we share it with (if anyone)\n- How users can delete it\n- How we protect it\n\nRequirements:\n- 5 bullets max\n- Plain language (no legal jargon)\n- Accurate (don't misrepresent)\n- Under 100 words total",
        notes: "Plain-language privacy summaries"
      }
    ]
  },

  {
    title: "Generate onboarding email sequences that reduce time-to-value",
    description: "User signs up. Day 1: welcome + quick win. Day 3: key feature. Day 7: advanced tip. Need sequences that get users to 'aha moment' fast, not generic 'Here's what we do' emails.",
    industry: "Content",
    tags: ["onboarding", "email-sequences", "user-activation", "time-to-value"],
    example_prompts: [
      {
        title: "Onboarding Email Sequence Generator",
        user_prompt_template: "Generate onboarding email sequence for:\n\nProduct: {product_description}\nAha moment: {aha_moment}\n\nSequence:\n- Day 1: Welcome + quick win (get them to aha moment)\n- Day 3: Key feature (most valuable feature)\n- Day 7: Advanced tip (power user feature)\n\nFor each email:\n- Subject line\n- Body (under 150 words)\n- Single clear CTA\n- Focus on value, not features",
        notes: "Value-focused onboarding sequences"
      }
    ]
  },

  {
    title: "Rewrite technical documentation for non-technical users",
    description: "Docs say: 'Configure the webhook endpoint to receive POST requests with HMAC-SHA256 signatures'. User needs: 'Copy this URL into your Stripe dashboard under Webhooks'.",
    industry: "Content",
    tags: ["documentation", "technical-writing", "plain-language", "user-guides"],
    example_prompts: [
      {
        title: "Non-Technical Documentation Rewriter",
        user_prompt_template: "Rewrite this technical documentation for non-technical users:\n\n{technical_docs}\n\nRequirements:\n- Plain language (no jargon)\n- Step-by-step instructions\n- Screenshots/examples where helpful\n- Explain WHY, not just HOW\n- Anticipate common mistakes\n\nBad: 'Configure the webhook endpoint'\nGood: 'Copy this URL and paste it into your Stripe dashboard under Settings > Webhooks'",
        notes: "Non-technical documentation for end users"
      }
    ]
  }
]

// ============================================================================
// DEVELOPMENT WORKFLOWS (10 problems)
// ============================================================================

const devProblems: SeedProblem[] = [
  {
    title: "Generate PR descriptions from Git diffs that reviewers can actually understand",
    description: "Git diff shows 500 lines changed. Reviewer needs: 'What changed?', 'Why?', 'What to test?'. Need prompts that analyze diffs and generate: summary, motivation, testing steps, breaking changes.",
    industry: "Development",
    tags: ["pull-requests", "code-review", "git", "documentation"],
    example_prompts: [
      {
        title: "Git Diff to PR Description",
        user_prompt_template: "Generate PR description from this Git diff:\n\n{git_diff}\n\nInclude:\n- Summary (what changed, in plain English)\n- Motivation (why this change)\n- Testing steps (how to verify)\n- Breaking changes (if any)\n- Related issues/tickets\n\nFocus on: what reviewers need to know, not line-by-line changes.",
        notes: "Reviewer-friendly PR descriptions from diffs"
      }
    ]
  },

  {
    title: "Generate test cases from bug reports automatically",
    description: "Bug report: 'Export fails when date range spans multiple years'. Need test cases: (1) single year, (2) span 2 years, (3) span 3+ years, (4) leap year boundary, (5) timezone edge cases.",
    industry: "Development",
    tags: ["test-generation", "bug-reports", "qa", "edge-cases"],
    example_prompts: [
      {
        title: "Bug Report to Test Cases",
        user_prompt_template: "Generate test cases from this bug report:\n\n{bug_report}\n\nProvide:\n- Happy path test (should work)\n- Exact bug scenario (should fail before fix)\n- Edge cases (3-5 variations)\n- Boundary conditions\n- Test data examples\n\nFor each test:\n- Test name\n- Setup\n- Action\n- Expected result\n- Actual result (before fix)",
        notes: "Comprehensive test cases from bug reports"
      }
    ]
  },

  {
    title: "Write commit messages that explain WHY, not just WHAT",
    description: "Bad commit: 'Update user model'. Good commit: 'Add email verification to user model to prevent fake signups'. Need prompts that generate commits explaining the motivation, not just the change.",
    industry: "Development",
    tags: ["git-commits", "documentation", "code-history", "best-practices"],
    example_prompts: [
      {
        title: "Meaningful Commit Message Generator",
        user_prompt_template: "Generate commit message for these changes:\n\n{git_diff}\n\nFormat:\n- First line: What changed (50 chars max)\n- Blank line\n- Body: Why this change (motivation, context)\n- Related issues/tickets\n\nBad: 'Update user model'\nGood: 'Add email verification to user model\n\nPrevents fake signups by requiring email confirmation before account activation. Addresses issue #123.'",
        notes: "Commit messages that explain WHY"
      }
    ]
  },

  {
    title: "Generate database migration rollback plans before deploying",
    description: "You're adding a column. Migration fails in production. Need rollback plan: (1) what to run, (2) what data to backup first, (3) what to verify after. Don't figure this out during an outage.",
    industry: "Development",
    tags: ["database-migrations", "rollback", "disaster-recovery", "devops"],
    example_prompts: [
      {
        title: "Migration Rollback Plan Generator",
        user_prompt_template: "Generate rollback plan for this migration:\n\n{migration_code}\n\nProvide:\n- Pre-rollback backup steps\n- Rollback SQL\n- Data verification queries\n- Potential issues during rollback\n- Estimated downtime\n- Communication plan (what to tell users)\n\nAssume: migration failed halfway through.",
        notes: "Rollback plans before deploying migrations"
      }
    ]
  },

  {
    title: "Detect code smells in PRs before they become technical debt",
    description: "PR adds 300-line function, hardcodes API keys, uses nested loops. Need automated review that flags: 'Function too long', 'Hardcoded secret', 'O(n²) complexity'. Catch issues before merge.",
    industry: "Development",
    tags: ["code-review", "code-quality", "technical-debt", "static-analysis"],
    example_prompts: [
      {
        title: "Code Smell Detector",
        user_prompt_template: "Review this code for code smells:\n\n{code}\n\nFlag:\n- Functions >50 lines\n- Hardcoded secrets/credentials\n- Nested loops (O(n²) or worse)\n- Missing error handling\n- Magic numbers\n- Duplicate code\n\nFor each issue:\n- Location (file, line)\n- Severity (critical/warning/info)\n- Explanation\n- Suggested fix",
        notes: "Automated code smell detection"
      }
    ]
  },

  {
    title: "Generate API endpoint names that follow REST conventions",
    description: "You want to add 'get user's active subscriptions'. Need endpoint name that follows REST: GET /users/:id/subscriptions?status=active. Not: GET /getUserActiveSubscriptions.",
    industry: "Development",
    tags: ["api-design", "rest", "naming-conventions", "best-practices"],
    example_prompts: [
      {
        title: "REST Endpoint Name Generator",
        user_prompt_template: "Generate REST endpoint for this action:\n\n{action_description}\n\nProvide:\n- HTTP method (GET/POST/PUT/PATCH/DELETE)\n- Endpoint path (follow REST conventions)\n- Query parameters (if needed)\n- Request body schema (if needed)\n- Response schema\n\nBad: GET /getUserActiveSubscriptions\nGood: GET /users/:id/subscriptions?status=active",
        notes: "REST-compliant endpoint naming"
      }
    ]
  },

  {
    title: "Convert bug reproduction steps into automated regression tests",
    description: "Bug report: '1. Login as admin, 2. Go to Reports, 3. Click Export, 4. Error appears'. Need to turn this into an automated test that prevents regression.",
    industry: "Development",
    tags: ["regression-tests", "test-automation", "bug-prevention", "qa"],
    example_prompts: [
      {
        title: "Bug Steps to Regression Test",
        user_prompt_template: "Convert these bug reproduction steps into an automated test:\n\n{reproduction_steps}\n\nTest framework: {framework}\n\nProvide:\n- Test name\n- Setup (authentication, data)\n- Steps (as test code)\n- Assertions (what should NOT happen)\n- Cleanup\n\nTest should fail before bug fix, pass after.",
        notes: "Automated regression tests from bug reports"
      }
    ]
  },

  {
    title: "Generate deployment checklists for risky changes",
    description: "You're changing the payment flow. Need checklist: (1) backup database, (2) test in staging, (3) enable feature flag, (4) monitor error rates, (5) rollback plan ready. Don't wing it.",
    industry: "Development",
    tags: ["deployment", "checklists", "risk-management", "devops"],
    example_prompts: [
      {
        title: "Deployment Checklist Generator",
        user_prompt_template: "Generate deployment checklist for this change:\n\n{change_description}\n\nInclude:\n- Pre-deployment (backups, staging tests)\n- Deployment steps (order matters)\n- Post-deployment verification\n- Monitoring (what to watch)\n- Rollback triggers (when to abort)\n- Communication plan\n\nRisk level: {risk_level}",
        notes: "Risk-appropriate deployment checklists"
      }
    ]
  },

  {
    title: "Explain complex code logic in plain English for documentation",
    description: "You wrote a gnarly algorithm. Need to document it: 'This function finds the shortest path by... First it... Then it... Finally it...'. Plain English, not code comments.",
    industry: "Development",
    tags: ["documentation", "code-explanation", "technical-writing", "knowledge-transfer"],
    example_prompts: [
      {
        title: "Code Logic Explainer",
        user_prompt_template: "Explain this code in plain English:\n\n{code}\n\nProvide:\n- High-level summary (what it does)\n- Step-by-step explanation\n- Why it works this way (not obvious alternatives)\n- Edge cases handled\n- Performance characteristics\n\nAudience: developer who hasn't seen this code before.",
        notes: "Plain English code explanations"
      }
    ]
  },

  {
    title: "Generate security review questions for PRs touching auth or payments",
    description: "PR modifies authentication logic. Need security checklist: 'Does this prevent brute force?', 'Are passwords hashed?', 'Is rate limiting applied?'. Don't assume security is handled.",
    industry: "Development",
    tags: ["security", "code-review", "authentication", "payments"],
    example_prompts: [
      {
        title: "Security Review Question Generator",
        user_prompt_template: "Generate security review questions for this PR:\n\n{pr_diff}\n\nArea: {area} (auth/payments/data-access/api)\n\nQuestions should cover:\n- Input validation\n- Authentication/authorization\n- Data encryption\n- Rate limiting\n- SQL injection prevention\n- XSS prevention\n- CSRF protection\n\nFor each question:\n- Question\n- Why it matters\n- What to look for in the code",
        notes: "Security-focused PR review questions"
      }
    ]
  }
]

// ============================================================================
// EXPORT ALL PROBLEMS
// ============================================================================

export const allValidationProblems: SeedProblem[] = [
  ...financialProblems,
  ...supportProblems,
  ...apiProblems,
  ...contentProblems,
  ...devProblems
]

// Verify we have exactly 50 problems
if (allValidationProblems.length !== 50) {
  throw new Error(`Expected 50 problems, got ${allValidationProblems.length}`)
}

console.log(`✅ Generated ${allValidationProblems.length} surgical SaaS AI problems`)
console.log(`\nBreakdown:`)
console.log(`- Financial: ${financialProblems.length}`)
console.log(`- Support: ${supportProblems.length}`)
console.log(`- API: ${apiProblems.length}`)
console.log(`- Content: ${contentProblems.length}`)
console.log(`- Development: ${devProblems.length}`)
