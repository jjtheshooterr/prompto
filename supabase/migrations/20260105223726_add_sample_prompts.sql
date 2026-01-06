-- Add sample prompts for the problems
INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
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
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Concise Article Summarizer');

INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'data-extraction'),
  'public',
  'Contact Information Extractor',
  'Extract contact information from text and return it in a structured JSON format. Be precise and only extract information that is clearly present.',
  'Extract all contact information from the following text and return as JSON with fields: name, email, phone, company, address:\n\n{text}',
  'gpt-4o',
  '{"temperature": 0.1, "max_tokens": 300}',
  '{"text": "Hi, I am Sarah Johnson from TechCorp Inc. You can reach me at sarah.j@techcorp.com or call (555) 123-4567. Our office is located at 123 Innovation Drive, San Francisco, CA 94105."}',
  '{"name": "Sarah Johnson", "email": "sarah.j@techcorp.com", "phone": "(555) 123-4567", "company": "TechCorp Inc.", "address": "123 Innovation Drive, San Francisco, CA 94105"}',
  'production',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Contact Information Extractor');

INSERT INTO prompts (workspace_id, problem_id, visibility, title, system_prompt, user_prompt_template, model, params, example_input, example_output, status, created_by)
SELECT 
  (SELECT id FROM workspaces LIMIT 1),
  (SELECT id FROM problems WHERE slug = 'code-generation'),
  'public',
  'Python Function Generator',
  'Generate clean, well-documented Python functions based on natural language descriptions. Include type hints and docstrings.',
  'Create a Python function that {description}. Include type hints, a docstring, and handle edge cases:\n\nFunction description: {description}',
  'claude-3.5-sonnet',
  '{"temperature": 0.3, "max_tokens": 500}',
  '{"description": "calculates the factorial of a number"}',
  '{"code": "def factorial(n: int) -> int:\n    \"\"\"\n    Calculate the factorial of a non-negative integer.\n    \n    Args:\n        n (int): A non-negative integer\n        \n    Returns:\n        int: The factorial of n\n        \n    Raises:\n        ValueError: If n is negative\n    \"\"\"\n    if n < 0:\n        raise ValueError(\"Factorial is not defined for negative numbers\")\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)"}',
  'tested',
  (SELECT owner_id FROM workspaces LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE title = 'Python Function Generator');;
