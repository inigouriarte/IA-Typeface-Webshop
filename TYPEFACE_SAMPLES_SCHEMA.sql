-- SQL Schema for typeface_samples table in Supabase
-- Run this in your Supabase SQL Editor to create the table

-- Create the typeface_samples table
CREATE TABLE IF NOT EXISTS typeface_samples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_name TEXT NOT NULL UNIQUE,
    sample_texts TEXT NOT NULL, -- Stores JSON array as text (or use JSONB if preferred)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on family_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_typeface_samples_family_name ON typeface_samples(family_name);

-- Optional: If you want to use JSONB instead of TEXT for sample_texts (better for querying)
-- Uncomment the following and comment out the TEXT version above:
/*
CREATE TABLE IF NOT EXISTS typeface_samples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_name TEXT NOT NULL UNIQUE,
    sample_texts JSONB NOT NULL, -- JSONB allows for better querying of nested data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typeface_samples_family_name ON typeface_samples(family_name);
CREATE INDEX IF NOT EXISTS idx_typeface_samples_sample_texts ON typeface_samples USING GIN(sample_texts);
*/

-- Enable Row Level Security (RLS) if needed
ALTER TABLE typeface_samples ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access" ON typeface_samples
    FOR SELECT
    USING (true);

-- Create a policy to allow authenticated users to insert/update (adjust as needed)
-- Note: For this to work, you'll need to use a service role key or set up proper authentication
-- For now, you may want to disable RLS or create appropriate policies based on your needs

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_typeface_samples_updated_at
    BEFORE UPDATE ON typeface_samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

