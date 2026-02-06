// ============================================
// WEGEM LEARNING - MAIN APPLICATION
// ============================================

class WeGEMApp {
    constructor() {
        this.ai = window.deepSeekAI;
        this.state = {
            user: null,
            curriculum: null,
            currentView: 'loading',
            quizSession: null,
            symposiumSession: null,
            notes: [],
            examPapers: []
        };
        
        this.init();
    }
    
    async init() {
        // Load saved state
        this.loadState();
        
        // Check AI status
        this.checkAIStatus();
        
        // Initialize UI
        this.setupEventListeners();
        
        // Start loading sequence
        this.startLoadingSequence();
    }
    
    checkAIStatus() {
        const status = this.ai.getStatus();
        
        if (!status.hasApiKey) {
            this.showApiKeyAlert();
        } else if (!status.connected) {
            console.warn('DeepSeek not connected');
        } else {
            console.log('✅ DeepSeek AI Ready');
        }
    }
    
    showApiKeyAlert() {
        const alertBox = document.createElement('div');
        alertBox.className = 'api-key-alert';
        alertBox.innerHTML = `
            <div class="alert-content">
                <h3>🔑 DeepSeek API Key Required</h3>
                <p>To use AI features, add your free API key:</p>
                <ol>
                    <li>Visit: <a href="https://platform.deepseek.com" target="_blank">DeepSeek Platform</a></li>
                    <li>Sign up and get free API key</li>
                    <li>Edit <code>config.js</code> file</li>
                    <li>Add key: <code>apiKey: 'your-key-here'</code></li>
                </ol>
                <p><small>💰 Free for educational use!</small></p>
                <button onclick="this.parentElement.parentElement.remove()">Got It</button>
            </div>
        `;
        document.body.appendChild(alertBox);
    }
    
    // ========================
    // AI CHAT FUNCTIONS
    // ========================
    async askWeGEMAI(question) {
        // Show user message
        this.addChatMessage('user', question);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Call DeepSeek AI
            const response = await this.ai.callAI(question, {
                level: this.state.user?.level || 'Form 3',
                subject: this.detectSubject(question),
                curriculum: this.state.curriculum || '8-4-4'
            });
            
            // Remove typing indicator
            this.removeTypingIndicator();
            
            // Show AI response
            this.addChatMessage('ai', response.message);
            
            // Log to admin if enabled
            if (window.WEGEM_CONFIG.ai.syncAllActivities) {
                this.logToAdmin('ai_chat', {
                    question,
                    response: response.message,
                    student: this.state.user?.name
                });
            }
            
        } catch (error) {
            this.removeTypingIndicator();
            this.addChatMessage('error', `AI Error: ${error.message}. Check your API key.`);
        }
    }
    
    // ========================
    // QUIZ FUNCTIONS
    // ========================
    async generateAIGuiz(topic) {
        this.showLoading('Generating quiz with AI...');
        
        const quiz = await this.ai.generateQuiz(topic, 10, 'medium');
        
        // Store quiz
        this.state.quizSession = {
            id: 'quiz_' + Date.now(),
            topic: quiz.topic,
            questions: quiz.questions,
            currentQuestion: 0,
            score: 0,
            startTime: new Date().toISOString()
        };
        
        this.hideLoading();
        this.startQuiz();
        
        // Log to admin
        this.logToAdmin('quiz_generated', {
            topic: quiz.topic,
            questionCount: quiz.questions.length,
            student: this.state.user?.name
        });
    }
    
    // ========================
    // SYMPOSIUM FUNCTIONS
    // ========================
    async generateSymposium(subject) {
        this.showLoading('Creating symposium questions...');
        
        const questions = await this.ai.generateSymposiumQuestions(subject, 12);
        
        this.state.symposiumSession = {
            id: 'symp_' + Date.now(),
            subject: subject,
            questions: questions,
            group1: { name: 'Group A', score: 0 },
            group2: { name: 'Group B', score: 0 },
            currentQuestion: 0,
            timeLeft: 90
        };
        
        this.hideLoading();
        this.startSymposium();
        
        // Log to admin
        this.logToAdmin('symposium_created', {
            subject: subject,
            questionCount: questions.length
        });
    }
    
    // ========================
    // ADMIN FUNCTIONS
    // ========================
    logToAdmin(type, data) {
        const adminData = {
            type: type,
            timestamp: new Date().toISOString(),
            user: this.state.user,
            data: data,
            app: 'WEGEM Learning'
        };
        
        // In production, send to actual API
        console.log('📤 To Admin:', adminData);
        
        // Simulate email to eddie.gucci.05@gmail.com
        if (window.WEGEM_CONFIG.ai.adminEmail) {
            this.simulateEmail(adminData);
        }
    }
    
    simulateEmail(data) {
        // This would be replaced with EmailJS or backend API
        const email = {
            to: window.WEGEM_CONFIG.ai.adminEmail,
            subject: `WEGEM Learning: ${data.type}`,
            body: JSON.stringify(data, null, 2)
        };
        
        console.log('📧 Simulated Email:', email);
        
        // Store locally for review
        if (!this.state.adminLogs) this.state.adminLogs = [];
        this.state.adminLogs.push({
            ...email,
            sentAt: new Date().toISOString()
        });
        
        this.saveState();
    }
    
    // ========================
    // UI HELPER FUNCTIONS
    // ========================
    addChatMessage(sender, text) {
        const chatBox = document.getElementById('ai-chat');
        if (!chatBox) return;
        
        const message = document.createElement('div');
        message.className = `chat-message ${sender}`;
        
        const senderName = sender === 'user' ? 'You' : 'WeGEM AI';
        const icon = sender === 'user' ? '👤' : '🤖';
        
        message.innerHTML = `
            <div class="message-header">
                <span class="sender">${icon} ${senderName}</span>
                <span class="time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div class="message-content">${this.formatMessage(text)}</div>
        `;
        
        chatBox.appendChild(message);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    formatMessage(text) {
        // Convert markdown to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/# (.*?)(\n|$)/g, '<h4>$1</h4>');
    }
    
    showTypingIndicator() {
        const chatBox = document.getElementById('ai-chat');
        if (!chatBox) return;
        
        const typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.className = 'chat-message ai typing';
        typing.innerHTML = `
            <div class="message-header">
                <span class="sender">🤖 WeGEM AI</span>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        chatBox.appendChild(typing);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    removeTypingIndicator() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }
    
    detectSubject(text) {
        // Simple subject detection
        const lower = text.toLowerCase();
        if (lower.includes('math') || lower.includes('calc')) return 'Mathematics';
        if (lower.includes('bio')) return 'Biology';
        if (lower.includes('chem')) return 'Chemistry';
        if (lower.includes('phy')) return 'Physics';
        if (lower.includes('english')) return 'English';
        if (lower.includes('kiswahili')) return 'Kiswahili';
        return 'General';
    }
    
    showLoading(message = 'Loading...') {
        // Implementation for loading overlay
        console.log('⏳', message);
    }
    
    hideLoading() {
        console.log('✅ Loading complete');
    }
    
    startLoadingSequence() {
        // Your existing loading sequence
        setTimeout(() => {
            this.showRegistration();
        }, 3000);
    }
    
    showRegistration() {
        // Your registration screen logic
        console.log('Show registration');
    }
    
    startQuiz() {
        // Start quiz interface
        console.log('Starting quiz');
    }
    
    startSymposium() {
        // Start symposium interface
        console.log('Starting symposium');
    }
    
    loadState() {
        const saved = localStorage.getItem('wegem_state');
        if (saved) this.state = JSON.parse(saved);
    }
    
    saveState() {
        localStorage.setItem('wegem_state', JSON.stringify(this.state));
    }
    
    setupEventListeners() {
        // Setup all UI event listeners
        document.addEventListener('click', (e) => {
            if (e.target.id === 'send-ai-btn') {
                const input = document.getElementById('ai-input');
                if (input.value.trim()) {
                    this.askWeGEMAI(input.value);
                    input.value = '';
                }
            }
        });
        
        // Enter key for AI chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                const input = document.getElementById('ai-input');
                if (input && input.value.trim()) {
                    this.askWeGEMAI(input.value);
                    input.value = '';
                }
            }
        });
    }
}

// Start application when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.wegemApp = new WeGEMApp();
    
    // Make functions globally available
    window.askWeGEMAI = (question) => window.wegemApp.askWeGEMAI(question);
    window.generateQuiz = (topic) => window.wegemApp.generateAIGuiz(topic);
    window.startSymposium = (subject) => window.wegemApp.generateSymposium(subject);
    
    console.log('🚀 WEGEM Learning Started with DeepSeek AI');
});