/*
  # Add missing RLS policies for user profiles

  1. Security Updates
    - Add INSERT policy for user_profiles table to allow users to create their own profile during signup
    - Add UPDATE policy for user_profiles table to allow users to update their own profile
    - Ensure users can only insert/update records where the ID matches their auth.uid()

  2. Changes
    - CREATE POLICY for INSERT operations on user_profiles
    - CREATE POLICY for UPDATE operations on user_profiles (if not exists)
    - These policies ensure users can only manage their own profile data
*/

-- Add INSERT policy to allow users to create their own profile during signup
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure UPDATE policy exists (may already exist based on schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;