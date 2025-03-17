# Security Guidelines

## Before Making the Repository Public

Follow these steps to ensure the repository is secure for public sharing:

1. **Environment Variables**
   - Ensure no real credentials are committed to the repository
   - Use only the `.env.example` file in the repository with placeholder values
   - Keep all actual `.env` files local and never commit them
   - Verify `.env`, `.env.local`, `.env.development`, and `.env.production` are in `.gitignore`

2. **API Keys and Secrets**
   - Make sure all the following are secured and not in the codebase:
     - GitHub tokens
     - Database credentials
     - Supabase keys
     - Cloudflare R2 credentials
     - OAuth client IDs and secrets

3. **Sensitive Data**
   - Remove any user data, test data with real information, or data export files
   - Check JSON files for any sensitive information
   - Scan the repository for any hardcoded credentials in the code

4. **Before Going Public Checklist**
   - Rotate all your API keys, tokens, and credentials
   - Update production environments with new credentials
   - Consider running a security scan on the codebase
   - Remove large data files that aren't necessary for the public repository

5. **After Going Public**
   - Set up proper branch protection rules
   - Consider enabling Dependabot alerts for security vulnerabilities
   - Establish a security policy and responsible disclosure process
   - Monitor for any sensitive information in issues or pull requests

## Reporting Security Issues

If you discover a security vulnerability, please send an email to [your-email@example.com]. Please do not create public GitHub issues for security vulnerabilities.

We appreciate your help in keeping the project secure! 