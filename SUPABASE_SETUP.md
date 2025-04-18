# Supabase Setup Guide for GoGreen App

This guide explains how to set up Supabase for the GoGreen application, including creating the necessary tables, storage buckets, and configuring access rules.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login.
2. Create a new project and note your project URL and anon key.
3. Add these credentials to your `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Create Required Tables

### Users Table

1. In the Supabase dashboard, go to **Table Editor**
2. Click **New Table**
3. Set the table name to `users`
4. Configure the following columns:

| Column Name | Type                     | Default Value      | Primary Key | Is Nullable | Description                 |
| ----------- | ------------------------ | ------------------ | ----------- | ----------- | --------------------------- |
| id          | uuid                     | uuid_generate_v4() | Yes         | No          | User's UUID (from Clerk ID) |
| clerk_id    | text                     | NULL               | No          | Yes         | Original Clerk user ID      |
| full_name   | text                     | NULL               | No          | Yes         | User's full name            |
| username    | text                     | NULL               | No          | Yes         | Username                    |
| profile_url | text                     | NULL               | No          | Yes         | Profile image URL           |
| green_score | integer                  | 0                  | No          | No          | User's environmental score  |
| created_at  | timestamp with time zone | now()              | No          | No          | Creation timestamp          |

5. Create the table
6. Set up Row Level Security (RLS) as needed:
   - Click on the `users` table
   - Go to "Authentication" tab
   - Enable Row Level Security
   - Click "Add Policy"
   - Create policies as needed (e.g., allow users to only update their own data)

### Route History Table

1. Go to **Table Editor** and click **New Table**
2. Set the table name to `route_history`
3. Configure the following columns:

| Column Name  | Type                     | Default Value      | Primary Key | Is Nullable | Description           |
| ------------ | ------------------------ | ------------------ | ----------- | ----------- | --------------------- |
| id           | uuid                     | uuid_generate_v4() | Yes         | No          | Route ID              |
| user_id      | uuid                     | NULL               | No          | No          | Reference to users.id |
| start_lat    | double precision         | NULL               | No          | No          | Starting latitude     |
| start_lng    | double precision         | NULL               | No          | No          | Starting longitude    |
| end_lat      | double precision         | NULL               | No          | No          | Ending latitude       |
| end_lng      | double precision         | NULL               | No          | No          | Ending longitude      |
| distance     | double precision         | NULL               | No          | No          | Route distance in km  |
| duration     | text                     | NULL               | No          | Yes         | Duration text         |
| co2_emission | double precision         | NULL               | No          | Yes         | CO2 emission in kg    |
| vehicle_type | text                     | NULL               | No          | No          | Type of vehicle used  |
| route_type   | text                     | NULL               | No          | No          | Type of route chosen  |
| green_points | integer                  | 0                  | No          | No          | Green points earned   |
| created_at   | timestamp with time zone | now()              | No          | No          | Creation timestamp    |

4. Create foreign key relationship:

   - Select the `user_id` column
   - Under "Foreign Keys", select the `users` table and `id` column
   - Set "On Delete" to "CASCADE"

5. Set up Row Level Security (RLS) as needed

## 3. Create Storage Buckets

1. In the Supabase dashboard, go to **Storage**
2. Click **Create Bucket**
3. Name the bucket `profiles`
4. Set access to **Private**
5. Create the bucket

6. Set up bucket policy:
   - Go to the "Policies" tab for the bucket
   - Create these policies:
     - Allow authenticated users to upload their profile images
     - Allow public access to view profile images
     - Only allow users to delete their own images

```sql
-- Example policy to allow users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Example policy to allow public reading of profile images
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profiles');
```

## 4. Testing Your Setup

1. Make sure your app is connected to Supabase:

   - Check that your environment variables are correctly set
   - Verify that the tables and storage buckets are accessible

2. Common issues:

   - Network connectivity problems
   - CORS configurations
   - Permissions issues with Row Level Security
   - Mobile platform specific issues

3. Use the Supabase dashboard to:
   - Monitor API requests
   - Check for errors in the logs
   - View and manage your data

## 5. Using Supabase in Development vs Production

- For development:

  - Use a dedicated development project in Supabase
  - Don't share anon keys for development projects

- For production:
  - Set up a separate production project
  - Configure more restrictive RLS policies
  - Monitor usage and set up alerts
  - Consider adding rate limiting
