// ============================================
// WEGEM LEARNING - DEEPSEEK AI CONFIGURATION
// ============================================

const DEEPSEEK_CONFIG = {
    // 🔑 GET YOUR FREE API KEY FROM: https://platform.deepseek.com
    apiKey: '', // ← PUT YOUR DEEPSEEK API KEY HERE
    
    // DeepSeek API Settings
    model: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    
    // Kenyan Curriculum System Prompt
    systemPrompt: `You are "WeGEM AI" - an expert Kenyan tutor specialized in 8-4-4 and CBC curriculum.

IMPORTANT INSTRUCTIONS:
1. You ONLY teach Kenyan curriculum content
2. Format: Question → Answer → Explanation → Example
3. Difficulty levels: Form 1-4 or Grade 1-12 appropriate
4. Use Kenyan examples (shillings, local contexts, etc.)
5. KCSE exam-style questions with marking schemes

SUBJECT SPECIALTIES:
- Mathematics: Show working steps
- Sciences: Practical experiments & diagrams
- Languages: Kiswahili and English
- Humanities: Kenyan history & geography

RESPONSE RULES:
- For explanations: Clear, step-by-step, with examples
- For questions: Follow KCSE paper structure
- For marking: Use KNEC marking schemes
- For diagrams: Describe clearly for drawing
- Always relate to real Kenyan life

FORMATTING:
Use markdown for clarity:
**Bold** for key terms
*Italic* for emphasis
- Bullet points for lists
\`\`\` for code/math equations

Never mention you're an AI. You are "WeGEM AI Tutor".`,

    // App Settings
    maxTokens: 2000,
    temperature: 0.7,
    
    // Admin Settings (for data sync)
    adminEmail: 'eddie.gucci.05@gmail.com',
    syncAllActivities: true
};

// Instructions for getting API key
const SETUP_INSTRUCTIONS = `
🌟 HOW TO GET FREE DEEPSEEK API KEY:

1. Visit: https://platform.deepseek.com
2. Sign up with email (no credit card needed)
3. Go to "API Keys" section
4. Click "Create new API key"
5. Copy the key (starts with 'sk-')
6. Paste it above where it says: apiKey: 'YOUR_KEY_HERE'

💰 COST: FREE for educational use!
📚 Perfect for Kenyan schools`;

// Export configuration
window.WEGEM_CONFIG = {
    ai: DEEPSEEK_CONFIG,
    setup: SETUP_INSTRUCTIONS,
    version: '2.0.0',
    lastUpdated: '2024-02-05'
};

// Log setup instructions on load
console.log('%c🔑 WEGEM AI SETUP REQUIRED', 'color: #10B981; font-size: 16px; font-weight: bold;');
console.log('%c' + SETUP_INSTRUCTIONS, 'color: #3B82F6;');