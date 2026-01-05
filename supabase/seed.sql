-- Insert seed problems and prompts
-- Note: This assumes you have a user account created. Replace the UUIDs with actual user IDs from your auth.users table

-- First, let's create a seed user workspace (you'll need to replace these UUIDs with real ones)
-- This is just example data structure - you'll need to run this after creating a real user

INSERT INTO problems (workspace_id, visibility, slug, title, description, tags, created_by) VALUES
-- Assuming first workspace ID from a real user
(
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'text-summarization',
  'Text Summarization',
  'Create concise summaries of long-form content while preserving key information and context.',
  ARRAY['summarization', 'content', 'nlp'],
  (SELECT owner_id FROM workspaces LIMIT 1)
),
(
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'data-extraction',
  'Structured Data Extraction',
  'Extract structured information from unstructured text, documents, or web content.',
  ARRAY['extraction', 'parsing', 'structured-data'],
  (SELECT owner_id FROM workspaces LIMIT 1)
),
(
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'text-classification',
  'Text Classification',
  'Categorize and label text content based on predefined categories or sentiment.',
  ARRAY['classification', 'sentiment', 'categorization'],
  (SELECT owner_id FROM workspaces LIMIT 1)
),
(
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'code-generation',
  'Code Generation',
  'Generate functional code snippets, functions, or complete programs from natural language descriptions.',
  ARRAY['coding', 'programming', 'generation'],
  (SELECT owner_id FROM workspaces LIMIT 1)
),
(
  (SELECT id FROM workspaces LIMIT 1),
  'public',
  'customer-support',
  'Customer Support Automation',
  'Handle customer inquiries, provide support responses, and resolve common issues.',
  ARRAY['support', 'customer-service', 'automation'],
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Insert seed prompts for each problem
-- Text Summarization prompts
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, known_failures, notes, status, created_by) VALUES
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'text-summarization'),
  'public',
  'Concise Article Summarizer',
  'You are an expert at creating concise, accurate summaries. Focus on the main points and key takeaways.',
  'Please summarize the following text in 2-3 sentences, capturing the most important information:\n\n{text}',
  'gpt-4o-mini',
  '{"temperature": 0.3, "max_tokens": 150}',
  '{"text": "Artificial intelligence has made significant strides in recent years, particularly in natural language processing and computer vision. Companies are increasingly adopting AI solutions to automate tasks, improve efficiency, and gain competitive advantages. However, concerns about job displacement, privacy, and ethical implications continue to grow as AI becomes more prevalent in society."}',
  '{"summary": "AI has advanced significantly in NLP and computer vision, with companies adopting it for automation and competitive advantage. However, growing concerns exist about job displacement, privacy, and ethical implications as AI becomes more widespread."}',
  'Struggles with very technical content or content requiring domain expertise. May miss nuanced arguments.',
  'Works well for general content, news articles, and business documents.',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
),
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'text-summarization'),
  'public',
  'Bullet Point Summarizer',
  'Create clear, structured summaries using bullet points to organize information hierarchically.',
  'Summarize the following content as bullet points, organizing information from most to least important:\n\n{text}',
  'claude-3.5-sonnet',
  '{"temperature": 0.2, "max_tokens": 200}',
  '{"text": "The quarterly earnings report shows revenue increased 15% year-over-year to $2.3 billion. Net income rose 8% to $340 million. The company expanded into three new markets and hired 200 additional employees. Customer satisfaction scores improved from 4.2 to 4.6 out of 5. However, supply chain costs increased 12% due to global shipping delays."}',
  '{"summary": "• Revenue up 15% YoY to $2.3B, net income up 8% to $340M\\n• Expanded into 3 new markets, hired 200 employees\\n• Customer satisfaction improved from 4.2 to 4.6/5\\n• Supply chain costs increased 12% due to shipping delays"}',
  'May over-structure simple content. Less effective for narrative or creative content.',
  'Excellent for business reports, research papers, and structured documents.',
  'production',
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Data Extraction prompts
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, known_failures, notes, status, created_by) VALUES
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'data-extraction'),
  'public',
  'Contact Information Extractor',
  'Extract contact information from text and return it in a structured JSON format. Be precise and only extract information that is clearly present.',
  'Extract all contact information from the following text and return as JSON with fields: name, email, phone, company, address:\n\n{text}',
  'gpt-4o',
  '{"temperature": 0.1, "max_tokens": 300}',
  '{"text": "Hi, I''m Sarah Johnson from TechCorp Inc. You can reach me at sarah.j@techcorp.com or call (555) 123-4567. Our office is located at 123 Innovation Drive, San Francisco, CA 94105."}',
  '{"name": "Sarah Johnson", "email": "sarah.j@techcorp.com", "phone": "(555) 123-4567", "company": "TechCorp Inc.", "address": "123 Innovation Drive, San Francisco, CA 94105"}',
  'May hallucinate information not present in text. Struggles with ambiguous formatting.',
  'Works best with clearly formatted contact information. Always validate extracted data.',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Text Classification prompts
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, known_failures, notes, status, created_by) VALUES
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'text-classification'),
  'public',
  'Sentiment Analyzer',
  'Analyze the sentiment of text and classify it as positive, negative, or neutral. Provide a confidence score.',
  'Analyze the sentiment of this text and respond with JSON containing "sentiment" (positive/negative/neutral) and "confidence" (0-1):\n\n{text}',
  'gpt-4o-mini',
  '{"temperature": 0.2, "max_tokens": 100}',
  '{"text": "I absolutely love this new product! The quality is amazing and customer service was incredibly helpful."}',
  '{"sentiment": "positive", "confidence": 0.95}',
  'May struggle with sarcasm or mixed sentiments. Confidence scores can be inconsistent.',
  'Reliable for straightforward sentiment analysis. Consider fine-tuning for domain-specific content.',
  'production',
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Code Generation prompts
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, known_failures, notes, status, created_by) VALUES
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'code-generation'),
  'public',
  'Python Function Generator',
  'Generate clean, well-documented Python functions based on natural language descriptions. Include type hints and docstrings.',
  'Create a Python function that {description}. Include type hints, a docstring, and handle edge cases:\n\nFunction description: {description}',
  'claude-3.5-sonnet',
  '{"temperature": 0.3, "max_tokens": 500}',
  '{"description": "calculates the factorial of a number"}',
  '{"code": "def factorial(n: int) -> int:\\n    \"\"\"\\n    Calculate the factorial of a non-negative integer.\\n    \\n    Args:\\n        n (int): A non-negative integer\\n        \\n    Returns:\\n        int: The factorial of n\\n        \\n    Raises:\\n        ValueError: If n is negative\\n    \"\"\"\\n    if n < 0:\\n        raise ValueError(\\"Factorial is not defined for negative numbers\\")\\n    if n == 0 or n == 1:\\n        return 1\\n    return n * factorial(n - 1)"}',
  'May generate overly complex solutions for simple problems. Recursive solutions might not be optimal for large inputs.',
  'Excellent for standard algorithms and data structures. Always review generated code for efficiency.',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Customer Support prompts
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, known_failures, notes, status, created_by) VALUES
(
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'customer-support'),
  'public',
  'Empathetic Support Response',
  'You are a helpful customer support representative. Respond with empathy, provide clear solutions, and maintain a professional yet friendly tone.',
  'Customer inquiry: {inquiry}\n\nProvide a helpful, empathetic response that addresses their concern and offers next steps.',
  'gpt-4o',
  '{"temperature": 0.4, "max_tokens": 300}',
  '{"inquiry": "I ordered a product 2 weeks ago and it still hasn''t arrived. The tracking shows it''s stuck in transit. I need this for a gift and I''m really frustrated."}',
  '{"response": "I completely understand your frustration, and I sincerely apologize for the delay with your order. Having a gift arrive late is especially stressful. Let me help resolve this immediately.\\n\\nI''ve checked your tracking information and can see the package has been delayed in transit. Here''s what I''ll do right now:\\n\\n1. I''m escalating this with our shipping partner to locate your package\\n2. I''ll send you a replacement via express shipping at no charge\\n3. You''ll receive tracking information within 2 hours\\n\\nThe replacement should arrive within 1-2 business days. If you''d prefer a refund instead, I can process that immediately. Would you like me to proceed with the express replacement, or would you prefer the refund option?"}',
  'May be too verbose for simple issues. Might not have access to actual account/order information.',
  'Works well for general support scenarios. Customize system prompt for specific company policies.',
  'production',
  (SELECT owner_id FROM workspaces LIMIT 1)
);

-- Initialize prompt stats for all prompts
INSERT INTO prompt_stats (prompt_id, upvotes, downvotes, score, copy_count, view_count, fork_count)
SELECT id, 0, 0, 0, 0, 0, 0 FROM prompts;