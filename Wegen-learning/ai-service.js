// ============================================
// DEEPSEEK AI SERVICE FOR WEGEM LEARNING
// ============================================

class DeepSeekService {
    constructor() {
        this.config = window.WEGEM_CONFIG.ai;
        this.conversationHistory = [];
        this.isConnected = false;
        this.testConnection();
    }
    
    // Test connection to DeepSeek
    async testConnection() {
        if (!this.config.apiKey || this.config.apiKey === '') {
            console.warn('⚠️ DeepSeek API key not set. Using local mode.');
            this.isConnected = false;
            return;
        }
        
        try {
            const testResponse = await fetch(this.config.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: [{ role: 'system', content: 'Test connection' }],
                    max_tokens: 10
                })
            });
            
            if (testResponse.ok) {
                this.isConnected = true;
                console.log('✅ DeepSeek AI Connected Successfully');
            } else {
                this.isConnected = false;
                console.warn('⚠️ DeepSeek connection failed');
            }
        } catch (error) {
            this.isConnected = false;
            console.warn('⚠️ DeepSeek connection error:', error.message);
        }
    }
    
    // ========================
    // MAIN AI CALL FUNCTION
    // ========================
    async callAI(userMessage, options = {}) {
        const {
            messageType = 'general', // 'quiz', 'explanation', 'marking', 'question'
            subject = 'General',
            level = 'Form 3',
            curriculum = '8-4-4',
            generateQuestions = 0
        } = options;
        
        // Build context-aware prompt
        const contextPrompt = this.buildContextPrompt(userMessage, options);
        
        // Prepare messages for DeepSeek
        const messages = [
            {
                role: 'system',
                content: this.config.systemPrompt + `\n\nCurrent Student: ${level}, ${curriculum}, Subject: ${subject}`
            },
            ...this.conversationHistory.slice(-6), // Last 3 exchanges
            { role: 'user', content: contextPrompt }
        ];
        
        try {
            // Call DeepSeek API
            const response = await fetch(this.config.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: messages,
                    max_tokens: this.config.maxTokens,
                    temperature: this.config.temperature,
                    stream: false
                })
            });
            
            if (!response.ok) {
                throw new Error(`DeepSeek API Error: ${response.status}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // Update conversation history
            this.updateHistory('user', userMessage);
            this.updateHistory('assistant', aiResponse);
            
            // Format and return response
            return {
                success: true,
                message: aiResponse,
                type: messageType,
                tokensUsed: data.usage?.total_tokens || 0,
                provider: 'deepseek',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            
            // Fallback to local response
            return {
                success: false,
                message: this.getLocalResponse(userMessage, options),
                type: 'local_fallback',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // ========================
    // QUIZ GENERATION
    // ========================
    async generateQuiz(topic, count = 10, difficulty = 'medium') {
        const prompt = `Generate ${count} KCSE-style questions about "${topic}".
        
        REQUIREMENTS:
        1. Format: QUESTION | ANSWER | EXPLANATION
        2. Include ${Math.ceil(count * 0.3)} diagram-based questions
        3. Difficulty: ${difficulty}
        4. Kenyan context only
        5. Separate with "---"
        
        Example format:
        Q1: What is photosynthesis?
        A1: Process where plants make food using sunlight
        E1: Chlorophyll captures light energy
        
        ---`;
        
        const response = await this.callAI(prompt, {
            messageType: 'quiz',
            subject: this.extractSubject(topic),
            generateQuestions: count
        });
        
        // Parse quiz questions
        const questions = this.parseQuizResponse(response.message);
        
        return {
            topic: topic,
            questions: questions,
            count: questions.length,
            generatedAt: new Date().toISOString(),
            byAI: true
        };
    }
    
    // ========================
    // ANSWER MARKING
    // ========================
    async markAnswers(studentAnswers, correctAnswers, context) {
        const prompt = `MARKING SCHEME - ${context.subject} - ${context.level}
        
        STUDENT ANSWERS:
        ${JSON.stringify(studentAnswers, null, 2)}
        
        CORRECT ANSWERS:
        ${JSON.stringify(correctAnswers, null, 2)}
        
        MARKING INSTRUCTIONS:
        1. Score each answer (0-10 marks)
        2. Follow KNEC marking scheme
        3. Provide constructive feedback
        4. Calculate total and percentage
        5. Suggest improvement areas
        
        Format response as:
        TOTAL: X/100
        PERCENTAGE: Y%
        FEEDBACK: [individual feedback]
        IMPROVEMENT: [areas to improve]`;
        
        const response = await this.callAI(prompt, {
            messageType: 'marking',
            subject: context.subject,
            level: context.level
        });
        
        // Parse marking results
        return this.parseMarkingResponse(response.message);
    }
    
    // ========================
    // SYMPOSIUM QUESTIONS
    // ========================
    async generateSymposiumQuestions(subject, count = 15) {
        const prompt = `Generate ${count} competition questions for Kenyan school symposium.
        
        SUBJECT: ${subject}
        LEVEL: Secondary School
        TIME PER QUESTION: 90 seconds
        
        FORMAT for each question:
        [Q1] Question text
        [A1] Exact answer
        [T1] 90
        [D1] medium
        
        Make questions challenging but fair. Include visual/diagram questions.`;
        
        const response = await this.callAI(prompt, {
            messageType: 'symposium',
            subject: subject
        });
        
        return this.parseSymposiumQuestions(response.message, count);
    }
    
    // ========================
    // EXPLAIN TOPIC
    // ========================
    async explainTopic(topic, level = 'Form 3') {
        const prompt = `Explain "${topic}" to a Kenyan ${level} student.
        
        TEACHING APPROACH:
        1. Start with simple definition
        2. Use Kenyan real-life examples
        3. Include diagrams (describe how to draw)
        4. Common mistakes to avoid
        5. KCSE exam tips
        
        Make it engaging and practical.`;
        
        const response = await this.callAI(prompt, {
            messageType: 'explanation',
            level: level
        });
        
        return response.message;
    }
    
    // ========================
    // HELPER FUNCTIONS
    // ========================
    buildContextPrompt(userMessage, options) {
        return `[STUDENT LEVEL: ${options.level}] 
[SUBJECT: ${options.subject}]
[CURRICULUM: ${options.curriculum}]
[REQUEST TYPE: ${options.messageType}]

User asks: "${userMessage}"

Please respond as a dedicated Kenyan tutor.`;
    }
    
    updateHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Keep last 10 messages max
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }
    
    extractSubject(text) {
        const subjects = {
            'math': 'Mathematics',
            'bio': 'Biology',
            'chem': 'Chemistry',
            'phy': 'Physics',
            'eng': 'English',
            'kisw': 'Kiswahili',
            'geo': 'Geography',
            'hist': 'History',
            'cre': 'CRE',
            'business': 'Business'
        };
        
        const lowerText = text.toLowerCase();
        for (const [key, subject] of Object.entries(subjects)) {
            if (lowerText.includes(key)) return subject;
        }
        return 'General';
    }
    
    parseQuizResponse(response) {
        const questions = [];
        const blocks = response.split('---').filter(block => block.trim());
        
        blocks.forEach((block, index) => {
            const lines = block.split('\n').filter(line => line.trim());
            let question = '', answer = '', explanation = '';
            
            lines.forEach(line => {
                if (line.startsWith('Q') || line.includes('?')) {
                    question = line.replace(/^Q\d+:?\s*/, '').trim();
                } else if (line.startsWith('A')) {
                    answer = line.replace(/^A\d+:?\s*/, '').trim();
                } else if (line.startsWith('E')) {
                    explanation = line.replace(/^E\d+:?\s*/, '').trim();
                }
            });
            
            if (question) {
                questions.push({
                    id: index + 1,
                    question: question,
                    answer: answer || 'Check with teacher',
                    explanation: explanation || 'No explanation provided',
                    hasDiagram: question.toLowerCase().includes('diagram') || 
                               question.toLowerCase().includes('draw')
                });
            }
        });
        
        return questions.length > 0 ? questions : [{
            id: 1,
            question: 'What would you like to know about this topic?',
            answer: 'Ask your teacher for details',
            explanation: 'AI response parsing failed',
            hasDiagram: false
        }];
    }
    
    parseMarkingResponse(response) {
        const result = {
            totalScore: 0,
            percentage: 0,
            feedback: [],
            improvement: [],
            detailed: []
        };
        
        const lines = response.split('\n');
        lines.forEach(line => {
            if (line.includes('TOTAL:')) {
                const match = line.match(/(\d+)\/100/);
                if (match) result.totalScore = parseInt(match[1]);
            } else if (line.includes('PERCENTAGE:')) {
                const match = line.match(/(\d+)%/);
                if (match) result.percentage = parseInt(match[1]);
            } else if (line.includes('FEEDBACK:')) {
                result.feedback = line.replace('FEEDBACK:', '').trim();
            } else if (line.includes('IMPROVEMENT:')) {
                result.improvement = line.replace('IMPROVEMENT:', '').trim();
            }
        });
        
        return result;
    }
    
    parseSymposiumQuestions(response, count) {
        const questions = [];
        const regex = /\[Q(\d+)\](.*?)\[A\d+\](.*?)(?:\[T\d+\](.*?))?(?:\[D\d+\](.*?))?(?=\[Q|$)/gs;
        let match;
        
        while ((match = regex.exec(response)) !== null && questions.length < count) {
            questions.push({
                id: parseInt(match[1]),
                question: match[2].trim(),
                answer: match[3].trim(),
                timeLimit: match[4] ? parseInt(match[4]) : 90,
                difficulty: match[5] ? match[5].trim() : 'medium'
            });
        }
        
        return questions;
    }
    
    getLocalResponse(userMessage, options) {
        // Local fallback responses
        const responses = {
            quiz: `I'd generate quiz questions about "${userMessage}" for ${options.level} students.
            
            (Connect to DeepSeek AI for actual quiz generation)`,
            
            explanation: `This topic "${userMessage}" is important in Kenyan ${options.level} curriculum.
            
            (Enable DeepSeek AI for detailed explanations)`,
            
            general: `As WeGEM tutor, I understand your question about "${userMessage}".
            
            ⚠️ Please add your DeepSeek API key to enable AI features.`
        };
        
        return responses[options.messageType] || responses.general;
    }
    
    // Get API status
    getStatus() {
        return {
            connected: this.isConnected,
            provider: 'DeepSeek',
            hasApiKey: !!this.config.apiKey && this.config.apiKey !== '',
            historyLength: this.conversationHistory.length
        };
    }
}

// Create and export singleton instance
window.deepSeekAI = new DeepSeekService();