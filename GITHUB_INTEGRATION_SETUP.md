# 🔧 GitHub Integration Setup Guide

This guide will help you set up GitHub OAuth and enable automatic Pull Request creation for vulnerability fixes.

## 📋 Prerequisites

- A GitHub account
- Your Vulnerability Dashboard running locally
- Admin access to create GitHub OAuth Apps

---

## 🚀 Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Navigate to: https://github.com/settings/developers
   - Click on **"OAuth Apps"** in the left sidebar
   - Click **"New OAuth App"**

2. **Fill in the Application Details**
   ```
   Application name: SecureCode Vulnerability Dashboard
   Homepage URL: http://localhost:5000
   Application description: Automated security vulnerability fixes
   Authorization callback URL: http://localhost:5000/api/auth/github/callback
   ```

3. **Register the Application**
   - Click **"Register application"**
   - You'll be redirected to your app's settings page

4. **Copy Your Credentials**
   - Copy the **Client ID**
   - Click **"Generate a new client secret"**
   - Copy the **Client Secret** (you won't be able to see it again!)

---

## 🔐 Step 2: Configure Environment Variables

1. **Open your `.env` file** in the project root
   ```bash
   cd /home/kaipulla/Music/Vulnerability_Dashboard
   nano .env
   ```

2. **Add the following lines** (replace with your actual values):
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URI=http://localhost:5000/api/auth/github/callback
   ```

3. **Save and close** the file

---

## 🎯 Step 3: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

---

## ✅ Step 4: Connect GitHub to Your Dashboard

1. **Open your dashboard** at http://localhost:5000/dashboard

2. **Click "Connect GitHub"** button (we'll add this to the UI)

3. **Authorize the app** on GitHub
   - You'll be redirected to GitHub
   - Click **"Authorize [Your App Name]"**
   - You'll be redirected back to your dashboard

4. **You're connected!** 🎉

---

## 🔨 Step 5: Use Auto-Fix Feature

### From the Vulnerability Scanner Page:

1. **Run a vulnerability scan** on a GitHub repository

2. **View the vulnerabilities** in the "Vulnerabilities" tab

3. **Click "Auto-Fix"** button on any vulnerability
   - The system will generate a fix
   - Create a new branch
   - Commit the fix
   - Create a Pull Request

4. **Review the PR** on GitHub
   - Go to your repository on GitHub
   - Check the "Pull Requests" tab
   - Review the automated fixes
   - Merge if everything looks good!

---

## 🎨 Features Included

### ✨ What the Integration Does:

- **🔍 Detects Vulnerabilities**: Scans your code for security issues
- **🛠️ Generates Fixes**: Automatically creates secure code replacements
- **🌿 Creates Branch**: Makes a new branch for the fixes
- **💾 Commits Changes**: Commits all fixes to the branch
- **🔀 Opens Pull Request**: Creates a PR with detailed information
- **📝 Detailed PR Description**: Includes all fixed vulnerabilities

### 🔧 Supported Vulnerability Types:

1. **XSS (Cross-Site Scripting)**
   - Removes `dangerouslySetInnerHTML`
   - Suggests proper escaping

2. **SQL Injection**
   - Converts to parameterized queries
   - Adds input validation

3. **Hardcoded Secrets**
   - Replaces with environment variables
   - Adds security best practices

---

## 🔒 Security Notes

### Important Security Considerations:

1. **Never commit your `.env` file** to Git
   - It's already in `.gitignore`
   - Keep your secrets safe!

2. **GitHub Token Storage**
   - Currently stored in memory (for development)
   - For production, use a secure database
   - Consider using encrypted storage

3. **OAuth Scopes**
   - The app requests `repo` scope
   - This allows creating PRs and branches
   - Users must authorize this access

4. **Review All Fixes**
   - Always review automated fixes before merging
   - Test the changes in your environment
   - Automated fixes are suggestions, not guarantees

---

## 🐛 Troubleshooting

### Issue: "GitHub not connected" error

**Solution:**
1. Check your `.env` file has the correct credentials
2. Restart your server
3. Try connecting to GitHub again

### Issue: "Failed to create Pull Request"

**Possible causes:**
1. **No write access**: Make sure you have write access to the repository
2. **Branch already exists**: The fix branch might already exist
3. **Invalid GitHub token**: Try disconnecting and reconnecting

### Issue: OAuth callback fails

**Solution:**
1. Verify your callback URL in GitHub OAuth settings
2. Make sure it matches: `http://localhost:5000/api/auth/github/callback`
3. Check server logs for detailed error messages

---

## 📚 API Endpoints

### Authentication:
- `GET /api/auth/github` - Start GitHub OAuth flow
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/github/status` - Check connection status
- `POST /api/auth/github/disconnect` - Disconnect GitHub

### Auto-Fix:
- `POST /api/github/create-fix-pr` - Create PR with fixes
- `POST /api/github/preview-fix` - Preview a fix before applying

---

## 🎓 Example Usage

### Creating a Fix PR via API:

```javascript
const response = await fetch('/api/github/create-fix-pr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your-github-username',
    repoUrl: 'https://github.com/username/repo',
    vulnerabilities: [
      {
        id: 'vuln-1',
        type: 'XSS',
        file: 'src/components/App.tsx',
        line: 42,
        codeSnippet: '<div dangerouslySetInnerHTML={{__html: userInput}} />',
        title: 'XSS Vulnerability in User Input'
      }
    ]
  })
});

const result = await response.json();
console.log(`PR created: ${result.prUrl}`);
```

---

## 🚀 Production Deployment

### For Production Use:

1. **Update OAuth App Settings**
   - Change URLs to your production domain
   - Update callback URL

2. **Secure Token Storage**
   - Use a database (PostgreSQL, MongoDB, etc.)
   - Encrypt tokens at rest
   - Use session management

3. **Add Rate Limiting**
   - Prevent abuse of GitHub API
   - Implement request throttling

4. **Add Logging & Monitoring**
   - Track PR creation success/failure
   - Monitor GitHub API usage
   - Set up alerts for errors

---

## 📞 Support

If you encounter any issues:
1. Check the server logs
2. Review GitHub OAuth app settings
3. Verify environment variables
4. Check GitHub API rate limits

---

## 🎉 You're All Set!

Your Vulnerability Dashboard now has powerful GitHub integration! Start scanning repositories and let the system automatically fix security issues for you.

**Happy Coding! 🚀**
