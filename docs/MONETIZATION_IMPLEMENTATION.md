# Respondr Monetization Implementation Guide

## Quick Start: Technical Implementation

This guide provides step-by-step technical instructions for implementing the monetization strategy outlined in `MONETIZATION_STRATEGY.md`.

---

## Phase 1: Subscription System Setup

### 1.1 Choose Payment Provider

**Recommended: RevenueCat** (for mobile apps)
- Handles App Store/Play Store subscriptions automatically
- Cross-platform (iOS + Android)
- Free tier: Up to $10k MRR
- Easy integration with React Native

**Alternative: Stripe**
- More control, but requires more setup
- Better for web + mobile
- More complex for App Store compliance

### 1.2 Install Dependencies

```bash
# RevenueCat
npm install react-native-purchases

# Or Stripe
npm install @stripe/stripe-react-native
```

### 1.3 Create Subscription Service

Create `src/services/subscriptionService.ts`:

```typescript
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

// Initialize RevenueCat
export const initializeRevenueCat = async (userId: string) => {
  if (Platform.OS === 'ios') {
    await Purchases.configure({ apiKey: 'your_ios_api_key' });
  } else {
    await Purchases.configure({ apiKey: 'your_android_api_key' });
  }
  
  await Purchases.logIn(userId);
};

// Get available offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
};

// Get customer info
export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  return await Purchases.getCustomerInfo();
};

// Purchase subscription
export const purchaseSubscription = async (packageIdentifier: string) => {
  const offerings = await Purchases.getOfferings();
  const packageToPurchase = offerings.current?.availablePackages.find(
    p => p.identifier === packageIdentifier
  );
  
  if (!packageToPurchase) {
    throw new Error('Package not found');
  }
  
  const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
  return customerInfo;
};

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo> => {
  return await Purchases.restorePurchases();
};

// Check subscription status
export const isPremium = (customerInfo: CustomerInfo): boolean => {
  return customerInfo.entitlements.active['premium'] !== undefined;
};

export const isPremiumPlus = (customerInfo: CustomerInfo): boolean => {
  return customerInfo.entitlements.active['premium_plus'] !== undefined;
};
```

---

## Phase 2: Usage Limits & Feature Gates

### 2.1 Create Usage Tracking Service

Create `src/services/usageService.ts`:

```typescript
import { supabase } from '../config/supabase';
import { getCustomerInfo, isPremium, isPremiumPlus } from './subscriptionService';

export interface UsageLimits {
  activitiesThisMonth: number;
  maxActivitiesPerMonth: number;
  canLogActivity: boolean; // Always true - unlimited activities
  canViewFullHistory: boolean; // Free: last 6 months, Premium: all time
  canExport: boolean;
  canViewAdvancedAnalytics: boolean;
  hasOldActivities?: boolean; // Flag for upgrade prompts
}

export const getUsageLimits = async (userId: string): Promise<UsageLimits> => {
  // Get subscription status
  const customerInfo = await getCustomerInfo();
  const premium = isPremium(customerInfo);
  const premiumPlus = isPremiumPlus(customerInfo);
  
  // Get total activity count (for engagement metrics, not limits)
  const { count: totalCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  const totalActivities = totalCount || 0;
  
  // Check if user has activities older than 6 months (free tier limitation)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { count: oldActivitiesCount } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lt('created_at', sixMonthsAgo.toISOString());
  
  const hasOldActivities = (oldActivitiesCount || 0) > 0;
  
  // All users can log unlimited activities (engagement driver)
  // Premium features are about value-add, not restrictions
  return {
    activitiesThisMonth: totalActivities, // For display purposes
    maxActivitiesPerMonth: Infinity, // Unlimited for all
    canLogActivity: true, // Always true - no limits
    canViewFullHistory: premium || premiumPlus, // Free: last 6 months only
    canExport: premium || premiumPlus,
    canViewAdvancedAnalytics: premium || premiumPlus,
    hasOldActivities, // Flag to show upgrade prompt
  };
};
```

### 2.2 Create Feature Gate Hook

Create `src/hooks/useSubscription.ts`:

```typescript
import { useEffect, useState } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { getCustomerInfo, getOfferings, initializeRevenueCat } from '../services/subscriptionService';
import { getUsageLimits, UsageLimits } from '../services/usageService';
import { useAuth } from '../providers/AuthProvider';

export function useSubscription() {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const loadSubscription = async () => {
      try {
        await initializeRevenueCat(user.id);
        const info = await getCustomerInfo();
        setCustomerInfo(info);
        
        const limits = await getUsageLimits(user.id);
        setUsageLimits(limits);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscription();
  }, [user]);
  
  const isPremium = customerInfo?.entitlements.active['premium'] !== undefined;
  const isPremiumPlus = customerInfo?.entitlements.active['premium_plus'] !== undefined;
  const isFree = !isPremium && !isPremiumPlus;
  
  return {
    customerInfo,
    usageLimits,
    loading,
    isPremium,
    isPremiumPlus,
    isFree,
    refresh: async () => {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      if (user) {
        const limits = await getUsageLimits(user.id);
        setUsageLimits(limits);
      }
    },
  };
}
```

### 2.3 Add Feature Gates to LogActivityScreen

Update `src/screens/LogActivityScreen.tsx`:

```typescript
import { useSubscription } from '../hooks/useSubscription';

export function LogActivityScreen() {
  const { usageLimits, isFree } = useSubscription();
  
  // All users can log activities - no limits!
  const handleSubmit = async () => {
    // Proceed with activity logging (always allowed)
    // ...
  };
  
  // Show engagement metrics (not limits)
  if (usageLimits) {
    return (
      <View>
        {/* Existing form */}
        {/* Show total activities as engagement metric, not limit */}
        {usageLimits.activitiesThisMonth > 0 && (
          <Text variant="caption" color="textSecondary">
            {usageLimits.activitiesThisMonth} total activities logged
          </Text>
        )}
        {/* Show upgrade prompt for value, not necessity */}
        {isFree && usageLimits.activitiesThisMonth >= 20 && (
          <Card style={{ marginTop: 16, padding: 12 }}>
            <Text variant="body" style={{ marginBottom: 8 }}>
              Unlock advanced insights and export your {usageLimits.activitiesThisMonth} activities
            </Text>
            <Button onPress={() => router.push('/upgrade')} variant="primary" size="small">
              Upgrade to Pro
            </Button>
          </Card>
        )}
      </View>
    );
  }
  
  // ...
}
```

---

## Phase 3: Premium Features Implementation

### 3.1 Export Functionality

Create `src/services/exportService.ts`:

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useActivities } from '../hooks/useActivities';

export const exportToPDF = async (activities: Activity[]) => {
  // Use a library like react-native-pdf or generate HTML and convert
  // Implementation depends on chosen PDF library
};

export const exportToCSV = async (activities: Activity[]) => {
  const headers = ['Date', 'Type', 'Duration', 'Location', 'Description'];
  const rows = activities.map(activity => [
    activity.createdAt.toISOString(),
    activity.type,
    activity.duration.toString(),
    activity.location || '',
    activity.description || '',
  ]);
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  const fileUri = FileSystem.documentDirectory + `activities_${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv);
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  }
};
```

### 3.2 Advanced Analytics

Create `src/screens/AnalyticsScreen.tsx`:

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { useActivities } from '../hooks/useActivities';

export function AnalyticsScreen() {
  const { isPremium, isPremiumPlus } = useSubscription();
  const { activities } = useActivities('mine');
  
  // Basic analytics (free)
  const totalActivities = activities.length;
  const totalHours = activities.reduce((sum, a) => sum + a.duration, 0);
  
  // Advanced analytics (premium only)
  if (!isPremium && !isPremiumPlus) {
    return (
      <View>
        <Text>Basic Stats</Text>
        <Text>Total Activities: {totalActivities}</Text>
        <Text>Total Hours: {totalHours}</Text>
        <Button onPress={() => router.push('/upgrade')}>
          Upgrade for Advanced Analytics
        </Button>
      </View>
    );
  }
  
  // Premium analytics
  const activitiesByType = groupBy(activities, 'type');
  const monthlyTrends = calculateMonthlyTrends(activities);
  // ... more advanced calculations
  
  return (
    <View>
      {/* Advanced analytics dashboard */}
    </View>
  );
}
```

---

## Phase 4: Upgrade/Pricing Screen

### 4.1 Create Upgrade Screen

Create `src/screens/UpgradeScreen.tsx`:

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { getOfferings, purchaseSubscription } from '../services/subscriptionService';

export function UpgradeScreen() {
  const { usageLimits, refresh } = useSubscription();
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadOfferings();
  }, []);
  
  const loadOfferings = async () => {
    const offerings = await getOfferings();
    setOfferings(offerings);
  };
  
  const handlePurchase = async (packageIdentifier: string) => {
    setLoading(true);
    try {
      await purchaseSubscription(packageIdentifier);
      await refresh();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase subscription');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView>
      {/* Current plan display */}
      {/* Feature comparison */}
      {/* Pricing tiers */}
      {/* Purchase buttons */}
    </ScrollView>
  );
}
```

---

## Phase 5: Database Schema Updates

### 5.1 Add Subscription Fields

Create migration `supabase/migrations/add_subscriptions.sql`:

```sql
-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'premium_plus')),
ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'expired')),
ADD COLUMN subscription_expires_at TIMESTAMPTZ,
ADD COLUMN revenue_cat_user_id TEXT,
ADD COLUMN subscription_started_at TIMESTAMPTZ;

-- Create index for subscription queries
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('fire', 'ems', 'rescue', 'civil', 'other')),
  location TEXT,
  plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'professional', 'enterprise')),
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'canceled', 'expired')),
  max_members INTEGER DEFAULT 25,
  current_members INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'leader', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create usage_tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  activities_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);
```

---

## Phase 6: Organization Features

### 6.1 Create Organization Service

Create `src/services/organizationService.ts`:

```typescript
import { supabase } from '../config/supabase';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: 'fire' | 'ems' | 'rescue' | 'civil' | 'other';
  planTier: 'starter' | 'professional' | 'enterprise';
  maxMembers: number;
  currentMembers: number;
}

export const createOrganization = async (data: {
  name: string;
  description?: string;
  type: string;
}): Promise<Organization> => {
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      description: data.description,
      type: data.type,
      plan_tier: 'starter',
      max_members: 25,
    })
    .select()
    .single();
  
  if (error) throw error;
  return org;
};

export const getOrganization = async (orgId: string): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getOrganizationMembers = async (orgId: string) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        avatar,
        email
      )
    `)
    .eq('organization_id', orgId);
  
  if (error) throw error;
  return data;
};
```

---

## Phase 7: Usage Tracking & Limits

### 7.1 Update Activity Creation

Update activity creation to track usage:

```typescript
// In activity service
export const createActivity = async (activityData: ActivityData) => {
  // No limits - all users can log unlimited activities!
  // This drives engagement and app usage
  
  // Create activity
  const { data, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update usage tracking (for analytics and upgrade prompts, not limits)
  const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  await supabase
    .from('usage_tracking')
    .upsert({
      user_id: userId,
      month: currentMonth,
      activities_count: (count || 0) + 1,
    });
  
  return data;
};
```

---

## Phase 8: White-Label Configuration

### 8.1 Extend Brand Config

Update `src/config/brand.ts` to support white-label:

```typescript
export interface WhiteLabelConfig extends BrandConfig {
  organizationId?: string;
  customDomain?: string;
  appStoreId?: string;
  playStoreId?: string;
}

// Load from database or environment
export const loadWhiteLabelConfig = async (): Promise<WhiteLabelConfig> => {
  // Check if white-label config exists in database
  // Or load from environment variables
  // Return custom config or default
};
```

---

## Testing Checklist

### Subscription Testing
- [ ] Free tier limits enforced
- [ ] Premium features unlocked after purchase
- [ ] Subscription status syncs correctly
- [ ] Restore purchases works
- [ ] Cancellation handled gracefully
- [ ] Expired subscriptions show correct UI

### Usage Tracking
- [ ] Activity tracking works (for analytics, not limits)
- [ ] Usage metrics displayed correctly
- [ ] Upgrade prompts shown at right time (value-based, not limit-based)
- [ ] History archiving works for free tier (6 months)

### Organization Features
- [ ] Organization creation works
- [ ] Member limits enforced
- [ ] Role permissions work
- [ ] Organization dashboard displays correctly

### Export Features
- [ ] CSV export works
- [ ] PDF export works (if implemented)
- [ ] Export respects privacy settings
- [ ] Export only available for premium

---

## RevenueCat Setup Guide

1. **Create RevenueCat Account**
   - Go to app.revenuecat.com
   - Create new project
   - Add iOS and Android apps

2. **Configure Products in App Stores**
   - App Store Connect: Create subscription products
   - Google Play Console: Create subscription products
   - Note the product IDs

3. **Configure in RevenueCat**
   - Add products to RevenueCat
   - Create offerings (packages)
   - Set up entitlements (premium, premium_plus)

4. **Get API Keys**
   - Copy iOS API key
   - Copy Android API key
   - Add to app config

5. **Test Purchases**
   - Use sandbox accounts
   - Test all subscription tiers
   - Test restore purchases
   - Test cancellation

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Subscription Metrics**
   - Active subscriptions
   - Conversion rate (free to paid)
   - Churn rate
   - Average revenue per user (ARPU)
   - Monthly recurring revenue (MRR)

2. **Usage Metrics**
   - Activities logged per user
   - Feature usage (which premium features are used most)
   - Upgrade trigger points (when do users upgrade?)

3. **User Behavior**
   - Time to first upgrade
   - Most common upgrade path
   - Feature adoption rates

### Implementation

Add analytics events:

```typescript
// Track subscription events
analytics.track('subscription_purchased', {
  tier: 'premium',
  price: 4.99,
  userId: user.id,
});

analytics.track('upgrade_prompt_shown', {
  trigger: 'activity_limit_reached',
  userId: user.id,
});

analytics.track('feature_used', {
  feature: 'export_csv',
  userId: user.id,
  subscription_tier: 'premium',
});
```

---

## Next Steps

1. **Set up RevenueCat account and configure products**
2. **Implement subscription service and hooks**
3. **Add usage limits to activity logging**
4. **Create upgrade screen**
5. **Implement premium features (export, analytics)**
6. **Add organization features**
7. **Set up monitoring and analytics**
8. **Test thoroughly with sandbox accounts**
9. **Launch beta with select users**
10. **Iterate based on feedback**

---

*This is a technical implementation guide. For business strategy, see `MONETIZATION_STRATEGY.md`.*

