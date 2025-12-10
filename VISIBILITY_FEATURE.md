# User Visibility Toggle Feature

## Overview
The "Make Me Visible" feature allows users to control their discoverability in the friend search functionality. When enabled (default), users appear in search results and can be discovered by other users. When disabled, users are completely hidden from search results.

## Database Migration Required

To enable this feature, you need to add the `is_discoverable` column to the `profiles` table in Supabase.

### Option 1: Using Supabase SQL Editor
1. Go to your Supabase project
2. Navigate to the SQL Editor
3. Run the migration SQL from `supabase_migrations/add_is_discoverable.sql`

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_discoverable boolean DEFAULT true;

UPDATE profiles
SET is_discoverable = true
WHERE is_discoverable IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_discoverable ON profiles(is_discoverable);
```

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:
```bash
supabase migration new add_is_discoverable_column
# Then copy the SQL from supabase_migrations/add_is_discoverable.sql into the new migration
supabase db push
```

## Feature Details

### Components Modified
- **Friends.tsx**: Added visibility toggle button in the search section
- **storageService.ts**: Added functions for managing visibility status

### New Functions in storageService.ts
1. `getUserVisibility()`: Retrieves current user's visibility status
2. `updateUserVisibility(isDiscoverable: boolean)`: Updates user's visibility status

### Updated Functions
1. `searchUsers(query)`: Now filters out non-discoverable users from search results

### UI Changes
- Added a toggle button in the "Discover Users" section header
- Shows "Visible" (with Eye icon) when user is discoverable
- Shows "Hidden" (with EyeOff icon) when user is not discoverable
- Button updates visibility status with loading state
- Responsive design with text hidden on mobile, icon always visible

## User Experience

### Default Behavior
- Users are **visible by default** (can be discovered in search)
- Toggle button is located in the top-right of the "Discover Users" section

### Toggling Visibility
1. Click the visibility toggle button
2. The button will show a loading spinner while updating
3. Status is immediately persisted to the database
4. The UI updates to reflect the new status

### Search Filtering
- Only discoverable users appear in search results
- Users who have disabled visibility are completely hidden
- The current user is always filtered out from search results (existing behavior)

## Security Considerations
- Visibility status is stored in the `profiles` table
- RLS policies should restrict updates to the user's own profile
- Search queries include the `is_discoverable = true` filter to prevent unauthorized queries

## Testing Checklist
- [ ] Migration runs successfully on your Supabase database
- [ ] Toggle button appears in the search section
- [ ] Clicking toggle updates the button state
- [ ] Non-discoverable users don't appear in search results
- [ ] Visibility status persists after page refresh
- [ ] Visibility toggle works correctly on both desktop and mobile
- [ ] Connected friends remain visible regardless of visibility status
