# Supabase Realtime Implementation Strategy

## Overview

This document outlines the strategy for implementing Supabase Realtime in the Respondr app to provide real-time updates for activities, comments, and reactions while maintaining a smooth user experience.

## Use Cases for Realtime

### 1. Activity Feed (High Priority)
**Location:** `src/screens/FeedScreen.tsx` and `src/hooks/useActivities.ts`

**Why:** Users should see new activities as they're posted without manual refresh.

**Implementation:**
- Subscribe to `INSERT` events on `activities` table
- Subscribe to `UPDATE` events for activity edits
- Filter by visibility (public/unit/private) based on user permissions

### 2. Comments (High Priority)
**Location:** Activity detail views or feed components

**Why:** Real-time comments improve engagement and collaboration.

**Implementation:**
- Subscribe to `INSERT` events on `comments` table filtered by `activity_id`
- Subscribe to `DELETE` events for comment removal
- Update comment count and list in real-time

### 3. Reactions (Medium Priority)
**Location:** Activity cards/components where reactions are shown

**Why:** Instant reaction updates improve interactivity.

**Implementation:**
- Subscribe to `INSERT`, `UPDATE`, and `DELETE` events on `reactions` table
- Filter by `activity_id` to update specific activity reactions
- Update reaction counts and user's reaction state

### 4. User Presence (Optional)
**Location:** User profiles or activity participants

**Why:** Show who's currently active in the app.

**Implementation:**
- Use Supabase Presence API
- Track user online status
- Show online indicators on profiles

### 5. Notifications (Optional)
**Location:** Notification system (if implemented)

**Why:** Real-time notifications for new comments, reactions, or mentions.

## UX Concerns

### Problem: Auto-Refresh Disruption

If a user is reading a comment or activity, and the screen automatically refreshes/updates due to Realtime, it can cause:
- User being scrolled away from what they're reading
- Content changing while they're viewing it
- Interrupted reading experience
- Layout shifts and visual disruption

## Recommended Solutions

### Strategy 1: Visual Indicators Instead of Auto-Update (Recommended)

Show a banner/button when new content arrives, but don't auto-update:

```typescript
const [hasNewContent, setHasNewContent] = useState(false);
const [newActivityCount, setNewActivityCount] = useState(0);

// Subscribe but don't auto-update
useEffect(() => {
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Just notify, don't update the list
      setHasNewContent(true);
      setNewActivityCount(prev => prev + 1);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);

// User taps "Show X new activities" button to refresh
const handleShowNewContent = () => {
  loadActivities(); // Manual refresh
  setHasNewContent(false);
  setNewActivityCount(0);
};
```

**Benefits:**
- User maintains control
- No disruption to reading experience
- Clear indication of new content

### Strategy 2: Update Only When Not Actively Viewing

Only auto-update if the user isn't scrolling or interacting:

```typescript
const [isScrolling, setIsScrolling] = useState(false);
const [isUserInteracting, setIsUserInteracting] = useState(false);

useEffect(() => {
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Only update if user is not actively scrolling/interacting
      if (!isScrolling && !isUserInteracting) {
        setActivities(prev => [payload.new, ...prev]);
      } else {
        // Queue for later
        setHasNewContent(true);
      }
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [isScrolling, isUserInteracting]);
```

**Benefits:**
- Updates happen when user is idle
- No disruption during active reading
- Falls back to notification when user is active

### Strategy 3: Preserve Scroll Position

Update content but maintain the user's scroll position:

```typescript
const scrollViewRef = useRef<ScrollView>(null);
const [scrollOffset, setScrollOffset] = useState(0);

useEffect(() => {
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Save current scroll position
      const currentOffset = scrollOffset;
      
      // Update activities
      setActivities(prev => [payload.new, ...prev]);
      
      // Restore scroll position after a brief delay
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: currentOffset,
          animated: false
        });
      }, 50);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [scrollOffset]);
```

**Benefits:**
- Content updates without losing position
- User stays where they were reading
- Smooth experience

### Strategy 4: Update Only New Items (Prepend, Don't Reorder)

Only add new items at the top, never reorder existing ones:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Only prepend if it's truly new (not already in list)
      setActivities(prev => {
        const exists = prev.some(a => a.id === payload.new.id);
        if (exists) return prev; // Don't add duplicates
        return [payload.new, ...prev]; // Prepend new item
      });
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Only update if item is already in list
      setActivities(prev => 
        prev.map(a => a.id === payload.new.id ? payload.new : a)
      );
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

**Benefits:**
- Existing items stay in place
- No reordering disruption
- New content appears at top

### Strategy 5: Pause Updates When Viewing Details

Disable Realtime when the user is viewing a specific activity:

```typescript
const [viewingActivityId, setViewingActivityId] = useState<string | null>(null);

useEffect(() => {
  // Don't subscribe if user is viewing a specific activity
  if (viewingActivityId) return;
  
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      setHasNewContent(true);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, [viewingActivityId]);
```

**Benefits:**
- No updates during focused viewing
- Better performance
- Reduced distractions

### Strategy 6: Debounced Batch Updates

Collect updates and apply them in batches:

```typescript
const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);

useEffect(() => {
  const channel = supabase
    .channel('activities')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'activities'
    }, (payload) => {
      // Queue the update
      setPendingUpdates(prev => [...prev, payload.new]);
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);

// Apply updates in batches every 5 seconds (or when user stops scrolling)
useEffect(() => {
  if (pendingUpdates.length === 0) return;
  
  const timer = setTimeout(() => {
    setActivities(prev => [...pendingUpdates, ...prev]);
    setPendingUpdates([]);
  }, 5000);
  
  return () => clearTimeout(timer);
}, [pendingUpdates]);
```

**Benefits:**
- Reduces update frequency
- Batches multiple changes
- Less visual disruption

## Recommended Implementation Approach

**Combine Strategies 1 and 4:**

1. **Show "X new activities" indicator** - User sees notification but isn't disrupted
2. **User chooses when to refresh** - Tap button to load new content
3. **When updating, only prepend new items** - No reordering of existing content
4. **Preserve scroll position** - User stays where they were
5. **Pause updates when viewing details** - No updates during focused viewing

This approach provides:
- ✅ Real-time awareness of new content
- ✅ User control over when to update
- ✅ No disruption to reading experience
- ✅ Smooth, predictable updates

## Implementation Checklist

- [ ] Create `src/hooks/useRealtime.ts` for centralized Realtime subscriptions
- [ ] Update `src/hooks/useActivities.ts` with Realtime subscriptions
- [ ] Create `src/hooks/useActivityRealtime.ts` for activity-specific subscriptions
- [ ] Add visual indicator component for new content
- [ ] Implement scroll position preservation
- [ ] Add pause logic when viewing activity details
- [ ] Test RLS policies ensure proper filtering
- [ ] Handle connection state (online/offline)
- [ ] Add cleanup for subscriptions on unmount
- [ ] Test with multiple users simultaneously

## Security Considerations

1. **RLS Policies:** Ensure Realtime respects Row Level Security policies
2. **Visibility Filtering:** Only subscribe to activities user can see (public/unit/private)
3. **User Authentication:** Verify user is authenticated before subscribing
4. **Channel Naming:** Use secure, predictable channel names
5. **Data Validation:** Validate all incoming Realtime data

## Performance Considerations

1. **Channel Cleanup:** Always remove channels on component unmount
2. **Selective Subscriptions:** Only subscribe to what's needed
3. **Debouncing:** Batch updates to reduce re-renders
4. **Memory Management:** Clean up old data and subscriptions
5. **Connection Management:** Handle reconnection logic

## Next Steps

1. Review and approve this strategy
2. Implement base Realtime hook (`useRealtime.ts`)
3. Add Realtime to activity feed with visual indicators
4. Test with multiple users
5. Iterate based on user feedback

