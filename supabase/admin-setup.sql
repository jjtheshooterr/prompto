-- Set up admin user for testing
-- Replace with your actual user email
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'  -- Replace with your email
);

-- Verify admin setup
SELECT 
  u.email,
  p.role,
  p.username
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin';