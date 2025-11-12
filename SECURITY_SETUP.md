# 🔒 Security Setup Guide

## Critical: Deploy Firebase Security Rules

Your database is currently **UNPROTECTED**. Follow these steps immediately:

### Step 1: Deploy Firestore Rules

#### Option A: Using Firebase Console (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `burako-leaderboard`
3. Click **Firestore Database** in left menu
4. Click **Rules** tab at the top
5. Copy the contents of `firestore.rules` file
6. Paste into the editor
7. Click **Publish**

#### Option B: Using Firebase CLI
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 2: Verify Rules Are Active

1. Go to Firebase Console → Firestore Database → Rules
2. You should see rules starting with `rules_version = '2';`
3. Check the "Published" timestamp is recent

### Step 3: Test Security

Try accessing your app:
- ✅ Should work: Viewing groups, players, games (when signed in)
- ❌ Should fail: Direct database access without authentication

---

## What These Rules Do

### ✅ Protection Enabled
- **Authentication Required**: All operations require sign-in
- **Input Validation**: Names, timestamps validated
- **Data Integrity**: Can't modify IDs or creation dates
- **Audit Trail Protection**: Games can only add to audit trail, not remove
- **Legacy Collections Locked**: Old structure is read-only

### 🔒 Security Features
- **Field Validation**: Checks data types and sizes
- **Structure Validation**: Ensures required fields exist
- **Update Restrictions**: Prevents tampering with critical fields
- **Default Deny**: Anything not explicitly allowed is blocked

---

## Current Security Status

### ✅ Fixed
- [x] Firebase Security Rules created
- [x] Authentication required for all operations
- [x] Input validation on all writes
- [x] Audit trail protection

### ⚠️ Still Needs Fixing
- [ ] Remove hardcoded credentials from git history
- [ ] Add input sanitization in UI
- [ ] Implement rate limiting
- [ ] Add proper user authentication (beyond anonymous)
- [ ] Encrypt sensitive localStorage data

---

## Next Steps

After deploying these rules:

1. **Test thoroughly** - Make sure app still works
2. **Monitor Firebase Console** - Check for denied requests
3. **Remove git history** - Clean up exposed credentials
4. **Implement remaining fixes** - See main security analysis

---

## Emergency: If Something Breaks

If the app stops working after deploying rules:

1. Check browser console for "permission-denied" errors
2. Verify user is signed in (check `auth.currentUser`)
3. Temporarily revert rules in Firebase Console
4. Contact developer for help

---

## Questions?

- Firebase Rules Documentation: https://firebase.google.com/docs/firestore/security/get-started
- Security Best Practices: https://firebase.google.com/docs/firestore/security/rules-conditions
