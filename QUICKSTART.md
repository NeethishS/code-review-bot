# Quick Start Guide - Groq LLM Integration

## 🚀 Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Groq LLM Service initialized with model: llama-3.3-70b-versatile
🚀 Code Review Bot API Server
📡 Server running on http://localhost:3001
⚡ Powered by Groq (llama-3.3-70b-versatile)
```

### 2. Start the Frontend (New Terminal)

```bash
# From project root
npm run dev
```

### 3. Access the AI Demo

1. Open browser to `http://localhost:5173` (or the port shown)
2. Click the **🤖 AI Demo** menu item in the sidebar
3. Paste code into the textarea
4. Select language and analysis type
5. Click **Analyze Code**

---

## 📋 Available Analysis Types

| Type | Description | Use Case |
|------|-------------|----------|
| **🔍 Code Smells** | Detects anti-patterns | Find long methods, dead code, magic numbers |
| **🔒 Security Scan** | Finds vulnerabilities | SQL injection, XSS, hardcoded secrets |
| **⚡ Performance** | Optimization suggestions | Algorithm efficiency, memory leaks |
| **📊 Complexity** | Calculates metrics | Cyclomatic complexity, maintainability |
| **🔄 Duplicates** | Finds repeated code | DRY violations, refactoring opportunities |
| **🧪 Generate Tests** | Creates unit tests | Automated test generation |
| **📋 Full Review** | Comprehensive analysis | All checks combined |

---

## 🧪 Quick Test

### Sample Code to Test:
```javascript
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total = total + items[i].price * items[i].quantity;
    }
    return total;
}
```

### Expected Results:
- **Code Smells**: May suggest using `reduce()` instead of loop
- **Performance**: Might recommend array methods
- **Complexity**: Low complexity score
- **Test Generation**: Will generate Jest tests

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Install dependencies
cd backend
npm install
```

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check browser console for CORS errors
- Verify `apiService.ts` has correct URL

### API returns errors
- Check Groq API key in `backend/.env`
- Verify rate limits not exceeded (10/min)
- Check backend terminal for error logs

---

## 📊 What to Expect

- **Response Time**: 1-3 seconds
- **Token Usage**: 500-2000 tokens per analysis
- **Cost**: ~$0.00001-0.00005 per request
- **Accuracy**: High (powered by Llama 3.3 70B)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/src/services/groqService.ts` | Groq API integration |
| `backend/src/services/codeAnalyzer.ts` | Analysis logic |
| `backend/src/routes/aiRoutes.ts` | API endpoints |
| `src/services/apiService.ts` | Frontend API client |
| `src/pages/AIDemo.tsx` | Demo UI |

---

## 🎯 Next Steps

1. **Test all analysis types** with different code samples
2. **Try different languages** (Python, TypeScript, Java, etc.)
3. **Check token usage** to monitor costs
4. **Explore the API** using the test script or curl

---

## 💡 Tips

- Start with small code snippets for faster responses
- Use **Full Review** for comprehensive analysis
- Check the **Results** section for token/cost metrics
- Try the **Generate Tests** feature for automated testing

---

**Need Help?** Check [README.md](file:///c:/Code%20Agent/code-review-bot/README.md) for detailed documentation!
