# User Visibility Feature - Deployment Guide

## Quick Start

### Step 1: Database Migration (Required)

Before deploying the code, you must add the `is_discoverable` column to your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** → **New Query**
3. Paste the following SQL:

```sql
-- Add is_discoverable column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_discoverable boolean DEFAULT true;

-- Set all existing users to discoverable
UPDATE profiles
SET is_discoverable = true
WHERE is_discoverable IS NULL;

-- Create index for faster search queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_discoverable 
ON profiles(is_discoverable);
```

4. Click **Run**
5. Verify success (you should see "Query executed successfully")

**Option B: Using Supabase CLI**
```bash
# Navigate to project directory
cd c:\Users\SAKETH\Downloads\workfiles\neurotrack-ai

# Run migration
supabase db push

# Or manually:
# 1. Copy SQL from supabase_migrations/add_is_discoverable.sql
# 2. Paste into Supabase Dashboard SQL Editor
# 3. Execute
```

### Step 2: Verify Database Changes

Run this query to confirm the column was created:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_discoverable';

-- Check a sample profile
SELECT id, is_discoverable FROM profiles LIMIT 1;
```

Expected output:
- Column: `is_discoverable`
- Type: `boolean`
- Default: `true`

### Step 3: Deploy Code

Build and deploy your application with the latest code changes:

```bash
# Build the application
cd c:\Users\SAKETH\Downloads\workfiles\neurotrack-ai
npm run build

# The build output is in the 'dist' folder
# Deploy the 'dist' folder to your hosting (Vercel, etc.)
```

### Step 4: Test the Feature

1. **Log in** to your application
2. **Navigate** to the Friends page
3. **Look for** the toggle button in the "Discover Users" section (top-right)
4. **Verify states**:
   - ✅ Button shows "Visible" with Eye icon initially
   - ✅ Button changes to "Hidden" with EyeOff icon when clicked
   - ✅ Loading spinner appears briefly during toggle
5. **Test search** from another account:
   - Your account should NOT appear in search after hiding
   - Your account should appear in search after showing

## Detailed Testing Guide

### Test Case 1: Default Visibility
**Expected**: All users are visible by default

1. Create a new test account
2. The toggle should show "Visible" (green button with Eye icon)
3. Search for this account from another user
4. The account should appear in search results

**Pass/Fail**: ___________

### Test Case 2: Toggle Visibility OFF
**Expected**: Hidden users don't appear in search

1. Log in with test account
2. Click the visibility toggle
3. Button should show "Hidden" (gray button with EyeOff icon)
4. Search for this account from another user
5. The account should NOT appear in search results

**Pass/Fail**: ___________

### Test Case 3: Toggle Visibility ON
**Expected**: Hidden users become visible again

1. Log in with test account (currently hidden)
2. Click the visibility toggle
3. Button should show "Visible" (green button with Eye icon)
4. Search for this account from another user
5. The account should appear in search results again

**Pass/Fail**: ___________

### Test Case 4: Persistence
**Expected**: Visibility status persists after page reload

1. Log in with test account
2. Toggle visibility to OFF
3. Refresh the page (Ctrl+R or Cmd+R)
4. The toggle should still show "Hidden"
5. This confirms it was saved to the database

**Pass/Fail**: ___________

### Test Case 5: Responsive Design
**Expected**: Toggle button works on all screen sizes

1. **Desktop**: Button shows "Visible" or "Hidden" text
2. **Tablet** (resize window): Text may be hidden, icon visible
3. **Mobile** (use DevTools): Icon visible, text hidden
4. Button is clickable at all sizes

**Pass/Fail**: ___________

### Test Case 6: Friends List Not Affected
**Expected**: Friends remain visible regardless of discoverability

1. Create test accounts A and B
2. Connect accounts A and B as friends
3. Account B toggles visibility to OFF
4. Account A should still see B in their "Your Friends" list
5. Account B should still see A in their "Your Friends" list

**Pass/Fail**: ___________

## Troubleshooting

### Problem: Column doesn't exist error
**Solution**: 
1. Verify the migration SQL was executed successfully
2. Check that you're querying the correct database/schema
3. Re-run the migration SQL

### Problem: Toggle button not appearing
**Solution**:
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console (F12) for JavaScript errors
4. Verify the build was successful: `npm run build`

### Problem: Toggle doesn't update visibility
**Solution**:
1. Check browser console (F12) for error messages
2. Verify database permissions (RLS policies)
3. Ensure `is_discoverable` column exists in database
4. Check network tab to see if API call is being made

### Problem: Search still shows hidden users
**Solution**:
1. Verify the `searchUsers()` function includes the `.eq('is_discoverable', true)` filter
2. Clear browser cache and hard refresh
3. Verify the code deployment completed successfully
4. Check that `is_discoverable` column value is correctly set in database

## RLS Policy Requirements

If you have Row Level Security (RLS) enabled, ensure these policies exist:

```sql
-- Allow users to read their own visibility status
CREATE POLICY "Users can read their own profile visibility"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own visibility status
CREATE POLICY "Users can update their own visibility status"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## Performance Considerations

1. **Index**: The migration creates an index on `is_discoverable` for faster search queries
2. **Search Performance**: Search queries now have two filters (discoverability + name/email)
3. **Scalability**: Even with large user bases, the index ensures quick lookups

## Monitoring

After deployment, monitor:
1. **Error Logs**: Check for any errors in user visibility operations
2. **Search Performance**: Monitor that search queries don't slow down
3. **User Adoption**: Track how many users toggle their visibility status

## Rollback Instructions

If you need to rollback this feature:

1. **Code Rollback**: 
   - Deploy previous version of the application
   - The toggle button will disappear from the UI

2. **Database Rollback** (optional - keeps data):
   ```sql
   -- Keep the column (users might already be using the feature)
   -- No action needed
   ```

3. **Database Rollback** (complete - removes feature):
   ```sql
   ALTER TABLE profiles
   DROP COLUMN IF EXISTS is_discoverable;
   ```

## Support

For issues or questions:
1. Check the browser console (F12) for error messages
2. Review the `USER_VISIBILITY_FEATURE.md` documentation
3. Check the GitHub issues or project documentation
4. Contact support with:
   - Browser console errors
   - Steps to reproduce
   - Browser/OS information
   - Screenshots of the issue

## Checklist for Go-Live

- [ ] Database migration executed successfully
- [ ] `is_discoverable` column exists and is accessible
- [ ] Code deployed to production
- [ ] Toggle button appears on Friends page
- [ ] Toggle button functionality tested
- [ ] Search filtering tested (hidden users don't appear)
- [ ] Persistence tested (state saved after reload)
- [ ] Mobile responsiveness verified
- [ ] Friends list still shows all connected friends
- [ ] No errors in production monitoring/logs
- [ ] Users notified about the new feature (optional)

## Success Criteria

Feature is considered successfully deployed when:
✅ Toggle button appears in the Friends UI  
✅ Clicking toggle updates the button state  
✅ Visibility status persists after page reload  
✅ Hidden users don't appear in search  
✅ Connected friends remain visible  
✅ No errors in browser console  
✅ Feature works on desktop and mobile  
