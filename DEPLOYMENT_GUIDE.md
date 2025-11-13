# Azure Deployment Guide

## Architecture Overview

- **Frontend**: Azure Static Web Apps (React)
- **Backend**: Azure App Service (FastAPI)
- **Database**: Azure Database for PostgreSQL (or MySQL)

## Prerequisites

1. Azure account with active subscription
2. Azure CLI installed: `az --version`
3. Node.js and Python installed locally
4. Git repository set up

## Phase 1: Database Migration (SQLite → PostgreSQL)

### 1.1 Update Dependencies

Add to `requirements.txt`:
```
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

### 1.2 Update database.py

Replace SQLite configuration with PostgreSQL:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/dbname"  # fallback for local dev
)

# For Azure PostgreSQL, you may need to add ?sslmode=require
if "azure" in DATABASE_URL.lower():
    if "?" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### 1.3 Create .env file (DON'T commit this!)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/healthcare_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:5173,https://your-frontend.azurestaticapps.net
```

### 1.4 Update .gitignore

Add:
```
.env
.env.local
.env.production
*.db
```

## Phase 2: Backend Deployment (Azure App Service)

### 2.1 Create Azure Resources

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP="healthcare-rg"
LOCATION="westeurope"
APP_NAME="healthcare-api-yourname"  # Must be globally unique
DB_SERVER="healthcare-db-server-yourname"  # Must be globally unique
DB_NAME="healthcare_db"
DB_ADMIN="dbadmin"
DB_PASSWORD="YourSecurePassword123!"  # Change this!

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --location $LOCATION \
  --admin-user $DB_ADMIN \
  --admin-password $DB_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 14 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --database-name $DB_NAME

# Create App Service Plan
az appservice plan create \
  --name healthcare-plan \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan healthcare-plan \
  --name $APP_NAME \
  --runtime "PYTHON:3.11"
```

### 2.2 Configure App Service

```bash
# Get database connection string
DB_CONNECTION="postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_SERVER}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"

# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    DATABASE_URL="$DB_CONNECTION" \
    SECRET_KEY="your-super-secret-key-change-this" \
    ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="15" \
    REFRESH_TOKEN_EXPIRE_DAYS="30" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

### 2.3 Create startup command file

Create `startup.sh` in project root:

```bash
#!/bin/bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2.4 Configure startup command

```bash
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "startup.sh"
```

### 2.5 Deploy Backend

**Option A: Deploy from local Git**

```bash
# Configure local git deployment
az webapp deployment source config-local-git \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get deployment URL
DEPLOY_URL=$(az webapp deployment list-publishing-credentials \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query scmUri -o tsv)

# Add Azure remote and push
git remote add azure $DEPLOY_URL
git add .
git commit -m "Prepare for Azure deployment"
git push azure main
```

**Option B: Deploy from GitHub (recommended)**

```bash
# Connect to GitHub repo
az webapp deployment source config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --repo-url https://github.com/yourusername/yourrepo \
  --branch main \
  --manual-integration
```

### 2.6 Initialize Database

After deployment, run migrations:

```bash
# SSH into the app
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME

# In the SSH session:
python
>>> from database import engine
>>> import models
>>> models.Base.metadata.create_all(bind=engine)
>>> exit()
```

Or create a migration script `init_db.py`:

```python
from database import engine
import models

def init_db():
    models.Base.metadata.create_all(bind=engine)
    print("Database initialized!")

if __name__ == "__main__":
    init_db()
```

Run it once: `az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME --command "python init_db.py"`

### 2.7 Enable CORS

Update `main.py`:

```python
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then update CORS settings:

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    CORS_ORIGINS="https://your-frontend.azurestaticapps.net,http://localhost:5173"
```

## Phase 3: Frontend Deployment (Azure Static Web Apps)

### 3.1 Update Frontend API Configuration

Update `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... rest of the file
```

### 3.2 Create .env files for frontend

`frontend/.env.development`:
```
VITE_API_URL=http://localhost:8000
```

`frontend/.env.production`:
```
VITE_API_URL=https://healthcare-api-yourname.azurewebsites.net
```

### 3.3 Create Static Web App

```bash
FRONTEND_APP_NAME="healthcare-frontend"

# Create Static Web App
az staticwebapp create \
  --name $FRONTEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/yourusername/yourrepo \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --login-with-github
```

### 3.4 Configure Build Settings

Create `frontend/staticwebapp.config.json`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{css,scss,js,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "mimeTypes": {
    ".json": "application/json",
    ".js": "text/javascript"
  },
  "globalHeaders": {
    "cache-control": "no-cache"
  }
}
```

### 3.5 Add GitHub Actions Workflow

Azure will create `.github/workflows/azure-static-web-apps-<name>.yml`:

Update the build configuration:

```yaml
# ... (auto-generated content)
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: ""
          output_location: "dist"
        env:
          VITE_API_URL: https://healthcare-api-yourname.azurewebsites.net
```

### 3.6 Update Backend CORS

After getting your Static Web App URL:

```bash
FRONTEND_URL="https://your-app.azurestaticapps.net"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    CORS_ORIGINS="$FRONTEND_URL,http://localhost:5173"
```

## Phase 4: Post-Deployment

### 4.1 Create Admin User

SSH into backend and create admin:

```python
from database import SessionLocal
from models import Admin
from auth import hash_password

db = SessionLocal()
admin = Admin(
    username="admin",
    password_hash=hash_password("SecureAdminPassword123!"),
    full_name="System Administrator",
    email="admin@healthcare.com"
)
db.add(admin)
db.commit()
print("Admin created!")
```

### 4.2 Test Deployment

1. Visit frontend URL: `https://your-app.azurestaticapps.net`
2. Test API: `https://healthcare-api-yourname.azurewebsites.net/docs`
3. Test login with admin credentials
4. Test patient registration
5. Test appointment booking

### 4.3 Monitor & Logs

```bash
# View backend logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# View Static Web App
# Go to Azure Portal → Static Web Apps → Your App → Monitoring
```

## Phase 5: CI/CD (Optional)

### 5.1 GitHub Actions for Backend

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches:
      - main
    paths:
      - '**.py'
      - 'requirements.txt'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: healthcare-api-yourname
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

Get publish profile:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --xml
```

Add to GitHub Secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`.

## Cost Estimation (Azure Pricing)

- **App Service (B1)**: ~$13/month
- **PostgreSQL Flexible Server (B1ms)**: ~$12/month
- **Static Web Apps (Free tier)**: $0/month (100GB bandwidth)

**Total**: ~$25/month

## Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Use strong database password
- [ ] Enable Azure AD authentication (optional)
- [ ] Set up SSL/TLS (auto with Azure)
- [ ] Configure firewall rules for database
- [ ] Set up backup for database
- [ ] Enable Application Insights for monitoring
- [ ] Review and restrict CORS origins
- [ ] Set up Azure Key Vault for secrets (advanced)

## Troubleshooting

### Backend not starting
```bash
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME
```

### Database connection issues
- Check firewall rules allow Azure services
- Verify connection string format
- Check database credentials

### Frontend API calls failing
- Check CORS configuration
- Verify API URL in environment variables
- Check browser console for errors

## Alternative: Cheaper Option

If cost is a concern, consider:
- **Frontend**: Netlify/Vercel (Free tier)
- **Backend**: Render.com (Free tier)
- **Database**: Supabase/Railway (Free tier)

Total: $0/month (with limitations)
