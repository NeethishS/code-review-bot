# 🤖 Code Review Bot - Groq LLM Integration

## Overview

This project integrates **Groq's ultra-fast LLM API** (using Llama models) to provide AI-powered code analysis features.

## 🚀 Features Implemented

### AI-Powered Analysis
- ✅ **Code Smell Detection** - Identifies anti-patterns and code smells
- ✅ **Security Vulnerability Scanning** - Detects security issues (SQL injection, XSS, secrets, etc.)
- ✅ **Performance Optimization** - Suggests performance improvements
- ✅ **Code Complexity Analysis** - Calculates cyclomatic complexity and maintainability metrics
- ✅ **Duplicate Code Detection** - Finds code duplication violations
- ✅ **AI Test Generation** - Generates unit tests automatically
- ✅ **Full Code Review** - Comprehensive analysis with all checks

### Technical Features
- ✅ **Rate Limiting** - Prevents API abuse
- ✅ **Token Optimization** - Efficient prompt engineering
- ✅ **Cost Tracking** - Monitors API usage costs
- ✅ **Error Handling** - Robust error management with fallbacks
- ✅ **Health Checks** - API status monitoring

## 📁 Project Structure

```
code-review-bot/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── groqService.ts      # Groq LLM integration
│   │   │   └── codeAnalyzer.ts     # Code analysis logic
│   │   ├── routes/
│   │   │   └── aiRoutes.ts         # API endpoints
│   │   ├── utils/
│   │   │   └── promptTemplates.ts  # Optimized prompts
│   │   └── server.ts               # Express server
│   ├── .env                        # Environment variables
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── services/
│   │   └── apiService.ts           # Frontend API client
│   └── ...
└── FEATURES.md                     # Complete feature roadmap
```

## 🛠️ Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Groq API key (already configured)

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:3001`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

## 🔌 API Endpoints

### Base URL: `http://localhost:3001/api/ai`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Main analysis endpoint (specify type) |
| `/code-smell` | POST | Detect code smells |
| `/security-scan` | POST | Security vulnerability scan |
| `/performance` | POST | Performance analysis |
| `/complexity` | POST | Complexity metrics |
| `/duplicates` | POST | Duplicate code detection |
| `/generate-tests` | POST | Generate unit tests |
| `/full-review` | POST | Comprehensive code review |

### Request Format

```json
{
  "code": "function example() { ... }",
  "language": "javascript",
  "framework": "jest" // optional, for test generation
}
```

### Response Format

```json
{
  "success": true,
  "data": { /* analysis results */ },
  "tokensUsed": 1234,
  "cost": 0.00001,
  "analysisType": "code-smell"
}
```

## 🧪 Testing the API

### Using the Test Script

```bash
cd backend
node test-ai.js
```

This will test all AI endpoints with sample code.

### Using curl

```bash
curl -X POST http://localhost:3001/api/ai/code-smell \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { var x = 1; return x; }",
    "language": "javascript"
  }'
```

### Health Check

```bash
curl http://localhost:3001/health
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key | Required |
| `GROQ_MODEL` | Llama model to use | `llama-3.3-70b-versatile` |
| `GROQ_MAX_TOKENS` | Max tokens per request | `8000` |
| `GROQ_TEMPERATURE` | Model temperature | `0.1` |
| `MAX_REQUESTS_PER_MINUTE` | Rate limit | `10` |
| `PORT` | Server port | `3001` |

### Available Groq Models

- `llama-3.3-70b-versatile` (Recommended - Best quality)
- `llama-3.1-70b-versatile`
- `llama-3.1-8b-instant` (Fastest)
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

## 💡 Usage Examples

### Frontend Integration

```typescript
import apiService from './services/apiService';

// Analyze code smells
const result = await apiService.analyzeCodeSmells(code, 'javascript');

if (result.success) {
  console.log('Smells found:', result.data.smells);
  console.log('Tokens used:', result.tokensUsed);
}

// Generate tests
const tests = await apiService.generateTests(code, 'typescript', 'jest');

// Full review
const review = await apiService.fullReview(code, 'python');
```

## 🎯 Key Features

### 1. **Optimized Prompts**
- Carefully crafted prompts for each analysis type
- Structured JSON responses for easy parsing
- Token-efficient formatting

### 2. **Rate Limiting**
- Prevents API abuse
- Configurable limits per minute
- Automatic reset mechanism

### 3. **Error Handling**
- Graceful degradation
- Detailed error messages
- Retry logic for transient failures

### 4. **Cost Tracking**
- Real-time token usage monitoring
- Cost estimation per request
- Usage analytics

## 📊 Performance

- **Response Time**: ~1-3 seconds per analysis (Groq is extremely fast!)
- **Token Usage**: ~500-2000 tokens per analysis
- **Cost**: ~$0.00001-0.00005 per analysis (very cheap!)

## 🔒 Security

- API key stored in environment variables
- CORS enabled for frontend communication
- Input validation on all endpoints
- Rate limiting to prevent abuse

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify `.env` file exists with valid `GROQ_API_KEY`
- Run `npm install` in backend directory

### API returns errors
- Check Groq API key is valid
- Verify rate limits not exceeded
- Check server logs for detailed errors

### Frontend can't connect
- Ensure backend server is running
- Check CORS configuration
- Verify API_BASE_URL in apiService.ts

## 📝 Next Steps

- [ ] Add frontend UI for code analysis
- [ ] Implement caching for repeated analyses
- [ ] Add GitHub integration
- [ ] Create visualization for analysis results
- [ ] Add user authentication
- [ ] Implement database for storing results

## 🤝 Contributing

See `FEATURES.md` for the complete feature roadmap and implementation priorities.

## 📄 License

MIT

---

**Powered by Groq** 🚀 - Ultra-fast LLM inference
