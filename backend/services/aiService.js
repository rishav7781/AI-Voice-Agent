const { Configuration, OpenAIApi } = require('openai');
const supabase = require('./supabaseService');

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Salon business information for the AI
const salonInfo = {
    name: "Style & Grace Salon",
    hours: "Monday-Saturday: 9am-7pm, Sunday: Closed",
    services: ["Haircut", "Coloring", "Styling", "Manicure", "Pedicure"],
    location: "123 Beauty Lane, Cityville",
    phone: "(555) 123-4567"
};

class AIService {
    constructor() {
        this.knowledgeBase = salonInfo;
    }

    async processQuery(question, customerId) {
        try {
            // First, check if we have this in our knowledge base
            const { data: existingAnswer } = await supabase
                .from('knowledge_base')
                .select('answer')
                .eq('question', question.toLowerCase())
                .single();

            if (existingAnswer) {
                return {
                    known: true,
                    answer: existingAnswer.answer
                };
            }

            // If not in knowledge base, create a help request
            const { data: helpRequest } = await supabase
                .from('help_requests')
                .insert([{
                    question: question,
                    customer_id: customerId,
                    status: 'pending'
                }])
                .select()
                .single();

            return {
                known: false,
                helpRequestId: helpRequest.id,
                message: "Let me check with my supervisor and get back to you."
            };
        } catch (error) {
            console.error('Error processing query:', error);
            throw error;
        }
    }

    async updateKnowledgeBase(question, answer) {
        try {
            const { data, error } = await supabase
                .from('knowledge_base')
                .insert([{
                    question: question.toLowerCase(),
                    answer: answer
                }]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating knowledge base:', error);
            throw error;
        }
    }
}

module.exports = new AIService();