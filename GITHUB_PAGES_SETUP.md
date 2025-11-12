# GitHub Pages Deployment Setup

## Step 1: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of these secrets:

```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyAumcd0vkm9-73yx8AGfT6SB2NgWMu_76Q

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: burako-leaderboard.firebaseapp.com

Name: VITE_FIREBASE_PROJECT_ID
Value: burako-leaderboard

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: burako-leaderboard.firebasestorage.app

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 928347273041

Name: VITE_FIREBASE_APP_ID
Value: 1:928347273041:web:31513f64e5a40b67300570
```

## Step 2: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

## Step 3: Update Vite Config

The `vite.config.ts` needs to know the base path for GitHub Pages:

```typescript
export default defineConfig({
  base: '/burako_leaderboard/', // Your repo name
  // ... rest of config
});
```

## Step 4: Deploy

Push to main branch:
```bash
git push origin main
```

The GitHub Action will:
1. Build your app with the secrets
2. Deploy to GitHub Pages
3. Available at: `https://[username].github.io/burako_leaderboard/`

## Step 5: Verify

Check the Actions tab to see the deployment progress.

---

## Security Notes

✅ **Secure**: Secrets are encrypted and only accessible during build
✅ **No exposure**: Secrets never appear in logs or code
✅ **Access control**: Only repo admins can view/edit secrets

⚠️ **Important**: The built files will contain the Firebase config (this is normal for web apps)
The Firebase Security Rules protect your data, not the config itself.

---

## Troubleshooting

**Build fails with "Missing environment variable"**
- Check all secrets are added in GitHub Settings
- Secret names must match exactly (case-sensitive)

**Page shows 404**
- Verify GitHub Pages is enabled
- Check the base path in `vite.config.ts` matches your repo name
- Wait a few minutes for deployment to complete

**Firebase errors**
- Verify Firebase credentials are correct
- Check Firebase Security Rules are deployed
- Ensure anonymous authentication is enabled in Firebase Console
