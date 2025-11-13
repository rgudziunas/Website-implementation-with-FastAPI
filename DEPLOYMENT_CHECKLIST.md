# Pre-Deployment Checklist

## Before You Start

- [ ] Azure account created and active
- [ ] Azure CLI installed: `az --version`
- [ ] Git repository initialized and up-to-date
- [ ] All code changes committed to main branch

## Code Preparation

### Backend Changes

- [ ] Update `database.py` to support PostgreSQL (see QUICK_START.md)
- [ ] Update `main.py` to use environment variables for CORS
- [ ] Update `auth.py` to use environment variable for SECRET_KEY
- [ ] Create `.env.example` file (already done ✓)
- [ ] Add `.env` to `.gitignore` (already done ✓)
- [ ] Create `requirements.txt` with all dependencies (already done ✓)
- [ ] Create `startup.sh` for Azure (already done ✓)
- [ ] Create `init_db.py` for database initialization (already done ✓)

### Frontend Changes

- [ ] Update `frontend/src/services/api.js` to use environment variable
- [ ] Create `frontend/.env.example` (already done ✓)
- [ ] Create `frontend/.env.production` with production API URL
- [ ] Create `frontend/staticwebapp.config.json` (already done ✓)
- [ ] Test production build: `cd frontend && npm run build`

## Azure Resources Setup

### Database

- [ ] PostgreSQL server created
- [ ] Database created
- [ ] Firewall rules configured (allow Azure services)
- [ ] Connection string saved securely

### Backend App Service

- [ ] App Service Plan created (B1 tier minimum)
- [ ] Web App created with Python 3.11 runtime
- [ ] Environment variables configured:
  - [ ] DATABASE_URL
  - [ ] SECRET_KEY
  - [ ] CORS_ORIGINS
  - [ ] ALGORITHM
  - [ ] ACCESS_TOKEN_EXPIRE_MINUTES
  - [ ] REFRESH_TOKEN_EXPIRE_DAYS
- [ ] Startup command set to `startup.sh`
- [ ] Code deployed
- [ ] Application logs checked (no errors)

### Frontend Static Web App

- [ ] Static Web App created
- [ ] GitHub repository connected
- [ ] Build configuration set:
  - App location: `/frontend`
  - Output location: `dist`
- [ ] Environment variable set: `VITE_API_URL`
- [ ] Deployment successful
- [ ] Site accessible

## Database Initialization

- [ ] SSH into backend App Service
- [ ] Run `python init_db.py`
- [ ] Verify tables created successfully
- [ ] Create admin user
- [ ] Test admin login from frontend

## Testing

### Backend API

- [ ] Visit `/docs` endpoint
- [ ] Test authentication endpoints:
  - [ ] POST `/api/auth/register` (patient registration)
  - [ ] POST `/api/auth/login` (login)
  - [ ] POST `/api/auth/refresh` (token refresh)
- [ ] Test with authentication:
  - [ ] GET `/api/doctors` (public, should work)
  - [ ] GET `/api/patients` (admin only, should require auth)
  - [ ] POST `/api/appointments` (authenticated, should work for patients)

### Frontend Application

- [ ] Homepage loads correctly
- [ ] Registration works
- [ ] Login works (patient and admin)
- [ ] Patient can:
  - [ ] View doctors
  - [ ] View services
  - [ ] Book appointment
  - [ ] View their appointments
  - [ ] Update their profile
  - [ ] Edit appointment time
  - [ ] Cancel appointment
- [ ] Admin can:
  - [ ] View all patients
  - [ ] View all appointments
  - [ ] Manage doctors
  - [ ] Manage services

### Cross-Origin (CORS)

- [ ] Frontend can call backend API
- [ ] No CORS errors in browser console
- [ ] Authentication cookies/tokens work

## Security

- [ ] SECRET_KEY changed from default
- [ ] Database password is strong
- [ ] `.env` files not committed to git
- [ ] HTTPS enabled (automatic with Azure)
- [ ] Admin password changed from default
- [ ] Database firewall configured
- [ ] Application Insights enabled (optional but recommended)

## Performance

- [ ] Backend responds quickly (< 1s)
- [ ] Frontend loads quickly (< 3s)
- [ ] Images optimized
- [ ] API calls are efficient (check Network tab)

## Monitoring

- [ ] Backend logs accessible: `az webapp log tail`
- [ ] Frontend deployment logs checked
- [ ] Error tracking enabled
- [ ] Health check endpoint working: `/`

## Documentation

- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] API endpoints documented
- [ ] Admin credentials securely stored

## Post-Deployment

- [ ] Update CORS_ORIGINS with final frontend URL
- [ ] Test from different devices/browsers
- [ ] Share URLs with team/stakeholders
- [ ] Set up monitoring alerts
- [ ] Configure database backups
- [ ] Plan for CI/CD pipeline (optional)

## Rollback Plan

In case of issues:

```bash
# Restore previous deployment
az webapp deployment source sync \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# Or redeploy previous commit
git revert HEAD
git push azure main
```

## Cost Management

- [ ] Review Azure cost estimates
- [ ] Set up spending alerts
- [ ] Consider free tier alternatives if budget is tight
- [ ] Monitor usage in Azure Portal

## Estimated Timeline

- **Code preparation**: 30 minutes
- **Azure setup**: 20 minutes
- **Deployment**: 15 minutes
- **Testing**: 30 minutes
- **Total**: ~2 hours (first time)

## Common Issues & Solutions

### Backend won't start
```bash
# Check startup logs
az webapp log tail --resource-group $RESOURCE_GROUP --name $APP_NAME

# Common fixes:
# - Check DATABASE_URL format
# - Verify Python version (3.11)
# - Check startup.sh permissions
```

### Database connection fails
```bash
# Test connection
az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME
python -c "from database import engine; engine.connect()"

# Common fixes:
# - Check firewall rules
# - Verify connection string
# - Enable "Allow Azure services"
```

### Frontend can't reach backend
- Verify VITE_API_URL in .env.production
- Check CORS_ORIGINS includes frontend URL
- Check browser console for errors
- Test API directly from Postman/curl

### 502 Bad Gateway
- Backend app is not running
- Check application logs
- Verify startup command
- Check Python dependencies installed

## Support Resources

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Azure PostgreSQL Docs](https://docs.microsoft.com/azure/postgresql/)

## Emergency Contacts

- Azure Support: https://portal.azure.com → Support
- FastAPI GitHub: https://github.com/tiangolo/fastapi
- Project Repository: [Add your GitHub repo URL]
