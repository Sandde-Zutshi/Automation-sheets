# Blood Test Analysis System

A comprehensive blood test PDF analysis system that extracts lab parameters from PDF reports, tracks them over time with interactive visualizations, and builds a knowledge graph showing parameter relationships.

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js 14 API Routes (Vercel Edge Functions)
- **PDF Processing**: LangExtract Python Service + Google Gemini API
- **Database**: Vercel Postgres (with Prisma ORM)
- **Charts**: Recharts for timelines + D3.js for knowledge graph
- **Deployment**: Vercel
- **AI**: Google Gemini Pro (text) + Gemini Vision (images)
- **Microservices**: FastAPI Python service for LangExtract

## 🚀 Features

### Core Functionality
- **PDF Upload & Processing**: Upload blood test PDFs and extract parameters using AI
- **Patient Management**: Create and manage patient records
- **Parameter Extraction**: AI-powered extraction of blood test parameters with confidence scores
- **Abnormal Detection**: Automatic detection of abnormal values based on reference ranges
- **Trend Analysis**: Track parameter changes over time with interactive charts
- **Knowledge Graph**: Visualize parameter relationships and correlations using D3.js

### Advanced Features
- **Real-time Processing**: Asynchronous PDF processing with status updates
- **Relationship Analysis**: AI-powered analysis of parameter correlations
- **Interactive Visualizations**: Zoom, pan, and explore the knowledge graph
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Data Export**: Export analysis results and trends
- **Search & Filtering**: Advanced search and filtering capabilities

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.11+ (for LangExtract service)
- PostgreSQL database
- Google Gemini API key
- Vercel account (for deployment)
- Docker (for containerized deployment)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-test-analysis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/blood_test_analysis"
   GOOGLE_GEMINI_API_KEY="your_gemini_api_key_here"
   LANGEXTRACT_SERVICE_URL="http://localhost:8000"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Start LangExtract Python Service**
   ```bash
   cd python-service
   pip install -r requirements.txt
   python main.py
   ```

5. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Alternative: Docker Compose (Recommended)

For easier setup, use Docker Compose:

```bash
# Start all services
docker-compose up -d

# Initialize database
docker-compose exec nextjs-app npx prisma db push

# Access the application
# Frontend: http://localhost:3000
# LangExtract Service: http://localhost:8000
```

## 🗄️ Database Schema

The system uses the following main entities:

### Patients
- Basic patient information (name, email, date of birth, gender)
- Links to blood tests and parameters

### Blood Tests
- Test metadata (date, lab name, report number)
- Processing status (PROCESSING, COMPLETED, FAILED)
- Links to extracted parameters

### Blood Parameters
- Parameter details (name, value, unit, reference range)
- Category classification (HEMATOLOGY, BIOCHEMISTRY, etc.)
- Abnormal flag based on reference ranges

### Parameter Relationships
- Relationship types (POSITIVE_CORRELATION, NEGATIVE_CORRELATION, etc.)
- Strength scores (0.0 to 1.0)
- AI-generated descriptions

## 🔧 API Endpoints

### Patients
- `GET /api/patients` - List patients with pagination and search
- `POST /api/patients` - Create new patient
- `GET /api/patients/[id]` - Get patient details with blood tests
- `PUT /api/patients/[id]` - Update patient
- `DELETE /api/patients/[id]` - Delete patient

### Blood Tests
- `GET /api/blood-tests` - List blood tests with filters
- `POST /api/blood-tests` - Upload and process PDF
- `GET /api/blood-tests/[id]` - Get blood test details

### Parameters
- `GET /api/parameters` - List parameters with filters
- `GET /api/parameters/trends` - Get parameter trends over time

### Knowledge Graph
- `GET /api/knowledge-graph` - Generate knowledge graph data

## 📊 PDF Processing Pipeline

1. **File Upload**: User uploads PDF via drag-and-drop interface
2. **Text Extraction**: LangExtract-like functionality using Gemini Vision
3. **Parameter Parsing**: AI-powered extraction of structured data
4. **Validation**: Data validation and normalization
5. **Storage**: Parameters stored in database with relationships
6. **Analysis**: AI analysis of parameter correlations
7. **Visualization**: Interactive charts and knowledge graph

## 🎨 UI Components

### Core Components
- **UploadZone**: Drag-and-drop PDF upload with progress
- **ParameterCard**: Display individual parameters with status
- **TrendChart**: Recharts-based timeline visualization
- **KnowledgeGraph**: D3.js force-directed graph
- **PatientForm**: Patient creation and editing
- **StatusIndicator**: Processing status with animations

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable component library
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Prepared for theme switching

## 🚀 Deployment

### Vercel Deployment
1. **Connect to Vercel**
   ```bash
   vercel
   ```

2. **Set environment variables in Vercel dashboard**

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Database Setup
1. **Create Vercel Postgres database**
2. **Update DATABASE_URL in environment variables**
3. **Run migrations**
   ```bash
   npx prisma db push
   ```

## 🔒 Security Considerations

- **Input Validation**: All inputs validated with Zod schemas
- **File Upload Security**: PDF file type validation and size limits
- **API Rate Limiting**: Implement rate limiting for API endpoints
- **Environment Variables**: Sensitive data stored in environment variables
- **CORS Configuration**: Proper CORS setup for production

## 📈 Performance Optimization

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting by Next.js
- **Database Indexing**: Proper database indexes for queries
- **Caching**: Implement caching strategies for API responses
- **Lazy Loading**: Components loaded on demand

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Machine Learning**: Advanced ML models for parameter prediction
- **Mobile App**: React Native mobile application
- **Integration**: EHR system integrations
- **Advanced Analytics**: Statistical analysis and reporting
- **Multi-language Support**: Internationalization
- **Real-time Notifications**: WebSocket-based notifications
- **Advanced Security**: Two-factor authentication and audit logs 