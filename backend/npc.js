class NPC {
  constructor(id, options = {}) {
    this.id = id;
    this.memory = [];
    this.syncFromBlockchain = options.syncFromBlockchain || (async () => {});
    this.sendToBlockchain = options.sendToBlockchain || (async () => {});
  }

  remember(message) {
    this.memory.push(message);
  }

  getMemory() {
    return this.memory;
  }

  async respond(messages, llmClient) {
    // Sync from blockchain (placeholder)
    await this.syncFromBlockchain();

    // Combine messages and memory (memory as system messages)
    const context = [
      ...messages,
      ...this.memory.map(m => ({ role: 'system', content: JSON.stringify(m) })),
    ];

    // Call LLM client
    const reply = await llmClient.chatCompletion(context);

    // Remember reply locally and send to blockchain (placeholder)
    this.remember({ role: 'npc', content: reply });
    await this.sendToBlockchain(reply);

    return reply;
  }
}

module.exports = NPC;
