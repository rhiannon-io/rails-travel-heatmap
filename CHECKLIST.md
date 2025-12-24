# 📋 Pre-Deployment Checklist

Use this checklist before deploying to production.

## Code Preparation

- [ ] All code committed to Git
  ```bash
  git status  # Should show "nothing to commit"
  ```

- [ ] Repository pushed to GitHub
  ```bash
  git remote -v  # Verify GitHub remote
  git push origin main
  ```

- [ ] `.gitignore` includes sensitive files
  - [ ] `/storage/*.sqlite3`
  - [ ] `/config/master.key`
  - [ ] `.env`

## Database

- [ ] All migrations run successfully locally
  ```bash
  rails db:migrate:status  # Check all migrations are up
  ```

- [ ] Seed file works without errors
  ```bash
  rails db:seed  # Should complete without errors
  ```

- [ ] Production database config uses PostgreSQL
  - [ ] Check `config/database.yml` has `adapter: postgresql` for production

## Dependencies

- [ ] `Gemfile` includes `pg` gem for production
  ```ruby
  gem "pg", "~> 1.5", group: :production
  ```

- [ ] Bundle installed successfully
  ```bash
  bundle install  # Should complete without errors
  ```

## Configuration Files

- [ ] `render.yaml` exists and is configured
  - [ ] Database name matches
  - [ ] Environment variables listed

- [ ] `bin/render-build.sh` exists and is executable
  ```bash
  ls -l bin/render-build.sh  # Should show -rwxr-xr-x
  ```

- [ ] `.env.example` created (don't commit `.env`)

## Security

- [ ] `config/master.key` exists locally
  ```bash
  cat config/master.key  # Should output a long string
  ```

- [ ] `credentials.yml.enc` exists
  ```bash
  ls config/credentials.yml.enc
  ```

- [ ] No hardcoded secrets in code
  - [ ] Check for API keys
  - [ ] Check for passwords
  - [ ] Check for tokens

## Testing

- [ ] App runs locally without errors
  ```bash
  rails server  # Visit http://localhost:3000
  ```

- [ ] Can sign up a new user
  - [ ] Visit /users/sign_up
  - [ ] Create account
  - [ ] Redirects to map

- [ ] Can mark countries as visited
  - [ ] Check countries
  - [ ] Set visit counts
  - [ ] Click share button

- [ ] Can create shareable link
  - [ ] Click "Share Your Map"
  - [ ] Copy link appears
  - [ ] Link works in incognito

- [ ] Can update shared link
  - [ ] Change countries
  - [ ] Click "Update Shared Link"
  - [ ] Refresh shared link shows changes

- [ ] Can sign out and sign in
  - [ ] Sign out button works
  - [ ] Sign in page loads
  - [ ] Can sign back in

## Documentation

- [ ] README.md is updated
  - [ ] Features listed
  - [ ] Installation steps
  - [ ] Usage instructions

- [ ] DEPLOYMENT.md exists
  - [ ] Platform-specific instructions
  - [ ] Environment variables documented

## Render.com Specific

- [ ] Have Render account created
  - [ ] Visit [render.com](https://render.com)
  - [ ] Sign up/sign in

- [ ] GitHub repository connected
  - [ ] In Render dashboard
  - [ ] Authorize GitHub access

- [ ] Environment variables ready
  - [ ] `RAILS_MASTER_KEY` copied from `config/master.key`
  - [ ] `RAILS_ENV=production`
  - [ ] Optional: `APP_HOST` for custom domain

## After Deployment

- [ ] Deployment succeeded
  - [ ] Check Render logs for errors
  - [ ] Build completed successfully

- [ ] Database migrations ran
  - [ ] Check logs for "migrating"
  - [ ] No migration errors

- [ ] Can access the app
  - [ ] Visit `https://your-app.onrender.com`
  - [ ] Page loads without errors

- [ ] Sign up works in production
  - [ ] Create a test account
  - [ ] Verify email/password

- [ ] Map functionality works
  - [ ] Mark countries
  - [ ] Create shared link
  - [ ] View shared link

- [ ] Performance is acceptable
  - [ ] Page loads in reasonable time
  - [ ] Map renders correctly
  - [ ] No JavaScript errors (check browser console)

## Common Issues

### Deployment fails
- Check `RAILS_MASTER_KEY` is set correctly
- Verify `bin/render-build.sh` is executable
- Review build logs for specific error

### Database connection errors
- Ensure `DATABASE_URL` is set by Render
- Check database service is running
- Verify PostgreSQL configuration

### Assets not loading
- Confirm `RAILS_SERVE_STATIC_FILES=true`
- Check `rails assets:precompile` ran
- Look for asset errors in logs

### Authentication not working
- Verify `RAILS_MASTER_KEY` matches `config/master.key`
- Check Devise configuration
- Ensure cookies are enabled

---

**When all items are checked, you're ready to deploy! 🚀**

Deployment command for Render:
1. Go to render.com
2. New + → Blueprint
3. Connect repo
4. Set RAILS_MASTER_KEY
5. Click Apply
