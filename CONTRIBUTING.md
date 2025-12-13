# Contributing to AMSF001 Project Tracker

## Branch Workflow

We use a **Git Flow** inspired branch strategy:

```
main (production)
  └── develop (staging/integration)
        ├── feature/add-reports
        ├── feature/user-settings
        └── fix/login-bug
```

### Branch Types

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code | Production (Vercel) |
| `develop` | Integration branch for features | Staging (Preview) |
| `feature/*` | New features | Preview deployments |
| `fix/*` | Bug fixes | Preview deployments |
| `hotfix/*` | Urgent production fixes | Production (via main) |

### Workflow

1. **Start new work** - Branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. **Make changes** - Commit frequently:
   ```bash
   git add -A
   git commit -m "Description of change"
   ```

3. **Push and create PR**:
   ```bash
   git push -u origin feature/my-feature
   # Create PR on GitHub: feature/my-feature → develop
   ```

4. **After PR merged** - Update local develop:
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/my-feature  # Delete local branch
   ```

5. **Release to production** - Merge develop to main:
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

## Code Quality

### Before Committing

Run these commands to ensure code quality:

```bash
# Check for lint errors
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Pre-commit Checklist

- [ ] Code compiles: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Formatting correct: `npm run format:check`
- [ ] Tested locally: `npm run dev`

## Commit Message Convention

Use clear, descriptive commit messages:

```
type: brief description

Longer explanation if needed
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code change that neither fixes bug nor adds feature
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add expense approval workflow
fix: resolve login redirect loop
docs: update API documentation
refactor: simplify permission checking logic
```

## Running Locally

```bash
# Install dependencies (including dev deps)
npm install --include=dev

# Start development server
npm run dev

# Build for production
npm run build
```
