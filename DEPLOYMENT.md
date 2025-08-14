# Blood Test Analysis System - Deployment Guide

This guide covers deployment of the complete blood test analysis system with LangExtract integration.

## 🏗️ Architecture Overview

The system consists of:
- **Next.js Frontend/Backend** (Node.js)
- **Python LangExtract Service** (FastAPI)
- **PostgreSQL Database**
- **Google Gemini AI Integration**

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Development)

1. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd blood-test-analysis
   ```

2. **Create Environment File:**
   ```bash
   cp .env.example .env
   ```

3. **Configure Environment Variables:**
   ```env
   DATABASE_URL="postgresql://postgres:password@postgres:5432/blood_test_analysis"
   GOOGLE_GEMINI_API_KEY="your_gemini_api_key_here"
   DB_USER=postgres
   DB_PASSWORD=password
   ```

4. **Start Services:**
   ```bash
   docker-compose up -d
   ```

5. **Initialize Database:**
   ```bash
   docker-compose exec nextjs-app npx prisma db push
   ```

6. **Access Application:**
   - Frontend: http://localhost:3000
   - LangExtract Service: http://localhost:8000
   - Database: localhost:5432

### Option 2: Vercel Deployment (Production)

#### Prerequisites
- Vercel account
- Google Gemini API key
- Vercel Postgres database

#### Steps

1. **Deploy Python LangExtract Service:**
   
   **Option A: Deploy to Railway/Render:**
   ```bash
   cd python-service
   # Deploy to Railway or Render
   # Set environment variables:
   # GOOGLE_GEMINI_API_KEY=your_key
   ```

   **Option B: Deploy to Google Cloud Run:**
   ```bash
   cd python-service
   gcloud builds submit --tag gcr.io/PROJECT_ID/langextract-service
   gcloud run deploy langextract-service \
     --image gcr.io/PROJECT_ID/langextract-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Deploy Next.js Application to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Configure Environment Variables in Vercel:**
   ```
   DATABASE_URL=postgresql://...
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   LANGEXTRACT_SERVICE_URL=https://your-langextract-service.railway.app
   ```

4. **Set up Vercel Postgres:**
   - Go to Vercel Dashboard
   - Create new Postgres database
   - Copy connection string to DATABASE_URL

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Option 3: Kubernetes Deployment

1. **Create Kubernetes Manifests:**
   ```yaml
   # k8s/namespace.yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: blood-test-analysis
   ```

2. **Deploy Services:**
   ```bash
   kubectl apply -f k8s/
   ```

## 🔧 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# AI Services
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"

# Service URLs
LANGEXTRACT_SERVICE_URL="http://localhost:8000"  # or production URL

# Next.js
NEXTAUTH_SECRET="your_secret_key"
NEXTAUTH_URL="http://localhost:3000"  # or production URL
```

### Optional Variables
```env
# Database (for local development)
DB_USER=postgres
DB_PASSWORD=password

# Application
NODE_ENV=production
PORT=3000
```

## 📊 Health Checks

### LangExtract Service
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "blood-test-extraction"}
```

### Next.js Application
```bash
curl http://localhost:3000/api/health
# Expected: {"status": "healthy"}
```

## 🔍 Monitoring and Logs

### Docker Compose Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f langextract-service
docker-compose logs -f nextjs-app
```

### Kubernetes Logs
```bash
kubectl logs -f deployment/langextract-service -n blood-test-analysis
kubectl logs -f deployment/nextjs-app -n blood-test-analysis
```

## 🚨 Troubleshooting

### Common Issues

1. **LangExtract Service Not Responding:**
   ```bash
   # Check if service is running
   docker-compose ps
   
   # Check logs
   docker-compose logs langextract-service
   
   # Restart service
   docker-compose restart langextract-service
   ```

2. **Database Connection Issues:**
   ```bash
   # Check database status
   docker-compose exec postgres psql -U postgres -d blood_test_analysis
   
   # Run migrations
   docker-compose exec nextjs-app npx prisma db push
   ```

3. **PDF Processing Failures:**
   - Check Google Gemini API key
   - Verify LangExtract service URL
   - Check file size limits

### Performance Optimization

1. **Increase LangExtract Service Resources:**
   ```yaml
   # docker-compose.yml
   langextract-service:
     deploy:
       resources:
         limits:
           memory: 2G
           cpus: '1.0'
   ```

2. **Database Optimization:**
   ```sql
   -- Add indexes for better performance
   CREATE INDEX idx_blood_parameters_patient_id ON blood_parameters(patient_id);
   CREATE INDEX idx_blood_parameters_category ON blood_parameters(category);
   CREATE INDEX idx_blood_tests_test_date ON blood_tests(test_date);
   ```

## 🔒 Security Considerations

1. **Environment Variables:**
   - Never commit API keys to version control
   - Use Vercel's environment variable management
   - Rotate keys regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure CORS properly
   - Implement rate limiting

3. **Data Protection:**
   - Encrypt sensitive data
   - Implement proper access controls
   - Regular security audits

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
langextract-service:
  deploy:
    replicas: 3
```

### Load Balancing
```yaml
# nginx.conf
upstream langextract {
    server langextract-service-1:8000;
    server langextract-service-2:8000;
    server langextract-service-3:8000;
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test services individually
4. Check network connectivity
5. Review security configurations 