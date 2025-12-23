# 🚀 Supabase Quick Start Guide

## 5-Minute Setup

### 1. Create Supabase Project (2 min)
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Name it "Respondr" and choose a password
5. Wait for project creation

### 2. Run Database Schema (1 min)
1. In Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Copy entire contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables appear under **Database** → **Tables**

### 3. Get API Credentials (1 min)
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public key**

### 4. Configure App (1 min)
1. Create `.env` in project root:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Start the app:
```bash
npm start
```

### 5. Test It! (30 sec)
1. Press `a` for Android or `i` for iOS
2. Register a new user
3. Log an activity
4. Check Supabase dashboard to see data!

---

## ✅ That's It!

Your app is now connected to Supabase!

📖 For detailed setup and troubleshooting, see:
- **SUPABASE_SETUP.md** - Complete setup guide
- **SUPABASE_INTEGRATION_SUMMARY.md** - Technical details

## 🎯 Verify Setup Works

### In App:
- [ ] Register new user
- [ ] Login with created user
- [ ] Create an activity
- [ ] View activity in Logbook

### In Supabase Dashboard:
- [ ] Check **Authentication** → **Users** (should see your user)
- [ ] Check **Table Editor** → **profiles** (should see profile)
- [ ] Check **Table Editor** → **activities** (should see activity)

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Missing environment variables" | Ensure `.env` exists and variables start with `EXPO_PUBLIC_` |
| Can't register | Check **Authentication** → **Providers** → Enable Email |
| No data showing | Check **Database** → **Policies** → Verify RLS is enabled |
| App crashes on start | Restart Expo dev server after adding `.env` |

## 📱 Production Ready Features

✅ User authentication  
✅ Activity logging  
✅ Profile management  
✅ Social features (reactions, comments)  
✅ Secure data access  
✅ Session persistence  
✅ Auto token refresh  

---

**Need help?** Check the detailed guides or Supabase logs in your dashboard!

