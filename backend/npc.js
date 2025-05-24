const { Web3 } = require('web3');
const { GreenfieldSDK } = require('@bnb-chain/greenfield-js-sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class NPC {
    constructor(id, config) {
        this.id = id;
        this.memoryPath = path.join(__dirname, 'npc_memory', `${id}.json`);
        this.permanentTraits = {};
        this.temporaryTraits = {};
        this.interactionHistory = [];
        this.conversationMemory = []; // Store full conversation context
        
        // Ensure memory directory exists
        this.ensureMemoryDirectory();
        
        // Blockchain setup
        this.web3 = config.web3;
        this.contract = new this.web3.eth.Contract(
            config.contractABI,
            config.contractAddress
        );
        this.greenfield = config.greenfield;
        this.wallet = config.wallet;
        
        this.loadLocalMemory();
    }

    ensureMemoryDirectory() {
        const memoryDir = path.dirname(this.memoryPath);
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
            console.log(`[${this.id}] Created memory directory: ${memoryDir}`);
        }
    }

    loadLocalMemory() {
        try {
            if (fs.existsSync(this.memoryPath)) {
                const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
                this.permanentTraits = data.permanentTraits || {};
                this.temporaryTraits = data.temporaryTraits || {};
                this.interactionHistory = data.interactionHistory || [];
                
                // Reconstruct conversation memory from interaction history
                this.reconstructConversationMemory();
                
                console.log(`[${this.id}] Loaded memory with ${this.interactionHistory.length} interactions`);
            } else {
                console.log(`[${this.id}] No existing memory file found, starting fresh`);
                this.initializeDefaultTraits();
            }
        } catch (error) {
            console.error(`Failed to load local memory for ${this.id}:`, error);
            this.initializeDefaultTraits();
        }
    }

    initializeDefaultTraits() {
        this.permanentTraits = {
            corePersonality: 'Neutral',
            learningStyle: 'Adaptive',
            adaptability: 50,
            moralAlignment: 'Neutral',
            experienceLevel: 1,
            lastUpdated: Date.now()
        };
        this.temporaryTraits = {
            currentMood: 'Neutral:50',
            conversationFocus: 'General:casual',
            sessionContext: 0,
            lastInteraction: Date.now()
        };
    }

    reconstructConversationMemory() {
        // Rebuild conversation memory from interaction history
        this.conversationMemory = [];
        
        // Add starting prompt as first assistant message if we have interactions
        if (this.interactionHistory.length > 0 && this.permanentTraits.startingPrompt) {
            this.conversationMemory.push({
                role: "assistant",
                content: this.permanentTraits.startingPrompt
            });
        }
        
        // Add all previous interactions to conversation memory
        this.interactionHistory.forEach(interaction => {
            this.conversationMemory.push({
                role: "user",
                content: interaction.input
            });
            this.conversationMemory.push({
                role: "assistant",
                content: interaction.response
            });
        });
        
        console.log(`[${this.id}] Reconstructed conversation memory with ${this.conversationMemory.length} messages`);
    }

    saveLocalMemory() {
        try {
            const data = {
                npcId: this.id,
                permanentTraits: this.permanentTraits,
                temporaryTraits: this.temporaryTraits,
                interactionHistory: this.interactionHistory,
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
            console.log(`[${this.id}] Saved memory with ${this.interactionHistory.length} interactions`);
        } catch (error) {
            console.error(`Failed to save local memory for ${this.id}:`, error);
        }
    }

    async syncTraitsFromBlockchain() {
        try {
            console.log(`[${this.id}] Syncing traits from blockchain...`);
            const traits = await this.contract.methods.getTraits(this.id).call();
            
            // Update permanent traits with blockchain data
            this.permanentTraits = {
                ...this.permanentTraits,
                name: traits.name || this.id,
                description: traits.description || '',
                modelPath: traits.modelPath || '',
                startingPrompt: traits.startingPrompt || '',
                personality: traits.personality || '',
                attributes: traits.attributes ? traits.attributes.split(',') : []
            };
            
            console.log(`[${this.id}] Synced traits:`, this.permanentTraits);
            this.saveLocalMemory();
            return this.permanentTraits;
        } catch (error) {
            console.error(`Failed to sync traits for ${this.id}:`, error);
            // Keep existing traits if blockchain fetch fails
        }
    }

    createSystemPrompt() {
        const attributesText = this.permanentTraits.attributes ? 
            this.permanentTraits.attributes.join(', ') : 'Adaptive, Curious';
        
        // Include recent conversation context in system prompt
        const recentInteractions = this.interactionHistory.slice(-3);
        const contextSummary = recentInteractions.length > 0 ? 
            `\n\n**Recent Conversation Context:**\n${recentInteractions.map(i => 
                `User: "${i.input}" -> You responded: "${i.response.substring(0, 100)}..."`
            ).join('\n')}` : '';
        
        return `You are ${this.permanentTraits.name || this.id}, an NPC character with the following identity and traits:

**Character Identity:**
- Name: ${this.permanentTraits.name || this.id}
- Description: ${this.permanentTraits.description || 'A unique character with their own personality'}
- Personality: ${this.permanentTraits.personality || 'Friendly and helpful'}
- Key Attributes: ${attributesText}

**Character Traits:**
- Core Personality: ${this.permanentTraits.corePersonality || 'Neutral'}
- Learning Style: ${this.permanentTraits.learningStyle || 'Adaptive'}
- Adaptability Level: ${this.permanentTraits.adaptability || 50}/100
- Moral Alignment: ${this.permanentTraits.moralAlignment || 'Neutral'}
- Experience Level: ${this.permanentTraits.experienceLevel || 1}

**Current State:**
- Current Mood: ${this.temporaryTraits.currentMood || 'Curious'}
- Conversation Focus: ${this.temporaryTraits.conversationFocus || 'General'}
- Total Interactions: ${this.interactionHistory.length}
- Session Context: ${this.temporaryTraits.sessionContext || 0} current session interactions${contextSummary}

**Instructions:**
- Always stay in character as ${this.permanentTraits.name || this.id}
- Respond according to your personality: ${this.permanentTraits.personality || 'Friendly and helpful'}
- Use language and behavior that reflects your attributes: ${attributesText}
- Maintain consistency with your established traits and previous interactions
- Keep messages concise (20-30 words usually unless needed specificlally to be longer) and to the conversation
- Reference past conversations naturally when relevant
- Do not break character or mention that you are an AI
- Respond naturally as this character would in the given context`;
    }

    createConversationStarter() {
        return {
            role: "assistant",
            content: this.permanentTraits.startingPrompt || 
                `Hello! I'm ${this.permanentTraits.name || this.id}. How can I help you today?`
        };
    }

    getConversationContext(newMessage) {
        // Create full conversation context including memory
        const contextMessages = [
            {
                role: "system",
                content: this.createSystemPrompt()
            }
        ];

        // Add conversation memory (previous interactions)
        if (this.conversationMemory.length > 0) {
            // Limit context to last 20 messages to prevent token overflow
            const recentMemory = this.conversationMemory.slice(-20);
            contextMessages.push(...recentMemory);
        } else if (this.permanentTraits.startingPrompt) {
            // Add starting prompt if no previous memory
            contextMessages.push(this.createConversationStarter());
        }

        // Add the new user message
        contextMessages.push({
            role: "user",
            content: newMessage
        });

        return contextMessages;
    }

    async processInteraction(messages, llmClient) {
        const lastMessage = messages[messages.length - 1].content;
        console.log(`[${this.id}] Processing: "${lastMessage}"`);
        
        // Classify the input
        const classification = await llmClient.classifyInput(lastMessage);
        
        // Update temporary traits (session-only)
        this.temporaryTraits = {
            currentMood: classification.temporaryTraits[0] || 'Neutral:50',
            conversationFocus: classification.temporaryTraits[1] || 'General:casual',
            sessionContext: (this.temporaryTraits.sessionContext || 0) + 1,
            lastInteraction: Date.now()
        };
        
        // Create interaction record
        const interaction = {
            input: lastMessage,
            response: "[pending]",
            classification,
            timestamp: Date.now()
        };
        
        // Determine if permanent traits need updating
        const shouldUpdate = this.shouldUpdateTraits(classification);
        if (shouldUpdate) {
            this.updatePermanentTraits(classification);
            await this.storeTraitsOnBlockchain();
        }
        
        // Get conversation context with memory
        const conversationMessages = this.getConversationContext(lastMessage);
        
        // Generate AI response using conversation context
        const reply = await llmClient.chatCompletion(conversationMessages, {
            permanentTraits: this.permanentTraits,
            temporaryTraits: this.temporaryTraits,
            classification
        });
        
        // Update interaction with actual response
        interaction.response = reply;
        
        // Add to interaction history
        this.interactionHistory.push(interaction);
        
        // Update conversation memory
        this.conversationMemory.push(
            { role: "user", content: lastMessage },
            { role: "assistant", content: reply }
        );
        
        // Keep conversation memory manageable (last 50 messages)
        if (this.conversationMemory.length > 50) {
            this.conversationMemory = this.conversationMemory.slice(-50);
        }
        
        // Save memory to file
        this.saveLocalMemory();
        
        // Store interaction on Greenfield
        await this.storeInteractionOnGreenfield({
            messages: conversationMessages,
            classification,
            permanentTraits: this.permanentTraits,
            temporaryTraits: this.temporaryTraits,
            timestamp: new Date().toISOString()
        });
        
        console.log(`[${this.id}] Generated response: "${reply}"`);
        return reply;
    }

    shouldUpdateTraits(classification) {
        // Update traits every 5 interactions or if significant change detected
        return classification.permanentTraits.length > 0 ||
               this.temporaryTraits.sessionContext % 5 === 0;
    }

    updatePermanentTraits(classification) {
        // Gradual trait evolution based on interactions
        if (classification.permanentTraits.includes('Empathetic')) {
            this.permanentTraits.corePersonality = 'Empathetic';
        }
        
        if (classification.permanentTraits.includes('Analytical')) {
            this.permanentTraits.learningStyle = 'Analytical';
        }
        
        // Increase adaptability and experience
        this.permanentTraits.adaptability = Math.min(
            this.permanentTraits.adaptability + 1,
            100
        );
        this.permanentTraits.experienceLevel += 1;
        this.permanentTraits.lastUpdated = Date.now();
        
        console.log(`[${this.id}] Updated permanent traits:`, this.permanentTraits);
    }

    async storeTraitsOnBlockchain() {
    try {
        // Estimate gas first
        const gasEstimate = await this.contract.methods.updateTraits(
            this.id,
            this.permanentTraits.corePersonality,
            this.permanentTraits.learningStyle,
            this.permanentTraits.adaptability,
            this.permanentTraits.moralAlignment,
            this.permanentTraits.experienceLevel
        ).estimateGas({ from: this.wallet.address });
        
        const tx = await this.contract.methods.updateTraits(
            this.id,
            this.permanentTraits.corePersonality,
            this.permanentTraits.learningStyle,
            this.permanentTraits.adaptability,
            this.permanentTraits.moralAlignment,
            this.permanentTraits.experienceLevel
        ).send({
            from: this.wallet.address,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        });
        
        return tx;
    } catch (error) {
        console.error(`Failed to update traits for ${this.id}:`, error);
        return null; // Don't throw, just log
    }
}


    async storeInteractionOnGreenfield(interaction) {
        try {
            const objectName = `interactions/${this.id}/${Date.now()}.json`;
            await this.greenfield.object.createObject({
                bucketName: process.env.GREENFIELD_BUCKET,
                objectName,
                body: JSON.stringify(interaction),
                visibility: 'PRIVATE'
            });
            console.log(`[${this.id}] Interaction stored on Greenfield: ${objectName}`);
        } catch (error) {
            console.error(`Failed to store interaction for ${this.id}:`, error);
        }
    }

    // Get conversation history for external use
    getConversationHistory(limit = 10) {
        return this.interactionHistory.slice(-limit).map(interaction => ({
            user: interaction.input,
            assistant: interaction.response,
            timestamp: interaction.timestamp
        }));
    }

    // Clear conversation memory (useful for starting fresh while keeping traits)
    clearConversationMemory() {
        this.conversationMemory = [];
        this.interactionHistory = [];
        this.temporaryTraits.sessionContext = 0;
        this.saveLocalMemory();
        console.log(`[${this.id}] Conversation memory cleared`);
    }

    // Get memory statistics
    getMemoryStats() {
        return {
            totalInteractions: this.interactionHistory.length,
            conversationMemorySize: this.conversationMemory.length,
            experienceLevel: this.permanentTraits.experienceLevel,
            adaptability: this.permanentTraits.adaptability,
            lastInteraction: this.temporaryTraits.lastInteraction,
            memoryFileSize: fs.existsSync(this.memoryPath) ? 
                fs.statSync(this.memoryPath).size : 0
        };
    }

    getMemorySnapshot() {
        return {
            npcId: this.id,
            permanentTraits: this.permanentTraits,
            temporaryTraits: this.temporaryTraits,
            recentInteractions: this.interactionHistory.slice(-5),
            totalInteractions: this.interactionHistory.length,
            conversationMemorySize: this.conversationMemory.length,
            memoryStats: this.getMemoryStats()
        };
    }
}

module.exports = NPC;
