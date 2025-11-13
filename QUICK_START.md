# Quick Deployment Guide

## TL;DR - Fastest Path to Azure

### 1. Prepare Your Code (5 minutes)

```bash
# Install PostgreSQL dependencies
pip install psycopg2-binary python-dotenv

# Update requirements.txt
# (already created for you)

# Make startup script executable
chmod +x startup.sh
```

### 2. Update Database Configuration (2 minutes)

Replace content in `database.py`:

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./healthcare.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### 3. Update main.py CORS (2 minutes)

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

### 4. Update auth.py SECRET_KEY (1 minute)

```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "Rokas958")  # Fallback for dev
```

### 5. Deploy Backend to Azure (10 minutes)

```bash
# Login
az login

# Set variables (CHANGE THESE!)
RESOURCE_GROUP="healthcare-rg"
LOCATION="westeurope"
APP_NAME="healthcare-api-$(whoami)"  # Make it unique
DB_SERVER="healthcare-db-$(whoami)"
DB_PASSWORD="SecurePass123!"

# Create everything
az group create --name $RESOURCE_GROUP --location $LOCATION

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER \
  --admin-user dbadmin \
  --admin-password $DB_PASSWORD \
  --sku-name Standard_B1ms \
  --public-access 0.0.0.0

az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER \
  --database-name healthcare_db

az appservice plan create \
  --name healthcare-plan \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan healthcare-plan \
  --name $APP_NAME \
  --runtime "PYTHON:3.11"

# Configure app
DB_URL="postgresql://dbadmin:${DB_PASSWORD}@${DB_SERVER}.postgres.database.azure.com:5432/healthcare_db?sslmode=require"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    DATABASE_URL="$DB_URL" \
    SECRET_KEY="$(openssl rand -hex 32)" \
    CORS_ORIGINS="http://localhost:5173"

az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --startup-file "startup.sh"

# Deploy (from main branch)
az webapp up \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --runtime "PYTHON:3.11"
```

### 6. Initialize Database (2 minutes)

```bash
# SSH into app
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME

# Run initialization
python init_db.py
exit
```

### 7. Deploy Frontend (5 minutes)

```bash
cd frontend

# Create production env file
echo "VITE_API_URL=https://${APP_NAME}.azurewebsites.net" > .env.production

# Test build locally
npm install
npm run build

# Deploy to Azure Static Web Apps via Azure Portal:
# 1. Go to Azure Portal → Create Resource → Static Web App
# 2. Connect to your GitHub repository
# 3. Build configuration:
#    - App location: /frontend
#    - Output location: dist
# 4. Deploy!
```

### 8. Update CORS (1 minute)

After getting your Static Web App URL:

```bash
FRONTEND_URL="https://your-static-web-app.azurestaticapps.net"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    CORS_ORIGINS="$FRONTEND_URL,http://localhost:5173"
```

## Test Your Deployment

1. Backend API: `https://your-app-name.azurewebsites.net/docs`
2. Frontend: `https://your-static-web-app.azurestaticapps.net`

## Create Admin User

```bash
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME

python
>>> from database import SessionLocal
>>> from models import Admin
>>> from auth import hash_password
>>> db = SessionLocal()
>>> admin = Admin(username="admin", password_hash=hash_password("Admin123!"), full_name="Admin", email="admin@example.com")
>>> db.add(admin)
>>> db.commit()
>>> exit()
exit
```

## Estimated Costs

- **Development/Testing**: ~$25/month
- **Production (with scaling)**: ~$50-100/month

## Free Alternative (No Azure)

### Using Free Tiers:

1. **Frontend**: Vercel or Netlify (Free)
2. **Backend**: Render.com (Free tier)
3. **Database**: Supabase (Free tier - 500MB)

```bash
# For Render.com (backend)
# 1. Push code to GitHub
# 2. Go to render.com → New Web Service
# 3. Connect GitHub repo
# 4. Build Command: pip install -r requirements.txt
# 5. Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
# 6. Add environment variables

# For Vercel (frontend)
cd frontend
npm install -g vercel
vercel --prod
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME
```

### Database connection fails
```bash
# Test connection
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME
python -c "from database import engine; print(engine.connect())"
```

### Frontend can't reach backend
- Check CORS settings
- Verify VITE_API_URL in .env.production
- Check browser console for errors

## Next Steps

1. Set up custom domain
2. Configure SSL certificates (auto with Azure)
3. Set up monitoring and alerts
4. Configure database backups
5. Set up CI/CD with GitHub Actions
6. Add Application Insights for logging

For detailed instructions, see `DEPLOYMENT_GUIDE.md`
