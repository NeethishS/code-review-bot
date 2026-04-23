# Security Notice

## ⚠️ API Key Required

The Groq API key in `backend/.env` has been reset for security.

### To run the application:

1. Get your free Groq API key from: https://console.groq.com
2. Open `backend/.env`
3. Replace `your_groq_api_key_here` with your actual API key

### Example:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### Important:
- Never commit your actual API key to version control
- The `.env` file is already in `.gitignore`
- Rotate your key immediately if it's ever exposed
