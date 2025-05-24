require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const NPC = require('./npc');
const llmClient = require('./llmClient');

const app = express();
app.use(bodyParser.json());

const npcInstances = {};

// POST /chat - NPC conversation
app.post('/chat', async (req, res) => {
  const { npcId, messages } = req.body;
  if (!npcId || !messages) return res.status(400).json({ error: 'Missing npcId or messages' });

  if (!npcInstances[npcId]) {
    npcInstances[npcId] = new NPC(npcId);
  } 

  try {
    const reply = await npcInstances[npcId].respond(messages, llmClient);
    res.json({ reply });
  } catch (err) {
    console.error('Error in /chat:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// POST /storeMemory - Store memory for NPC
app.post('/storeMemory', (req, res) => {
  const { npcId, memory } = req.body;
  if (!npcId || !memory) return res.status(400).json({ error: 'Missing npcId or memory' });

  if (!npcInstances[npcId]) {
    npcInstances[npcId] = new NPC(npcId);
  }

  npcInstances[npcId].remember(memory);
  res.json({ message: 'Memory stored' });
});

// GET /fetchMemory - Fetch NPC memory
app.get('/fetchMemory', (req, res) => {
  const npcId = req.query.npcId;
  if (!npcId) return res.status(400).json({ error: 'Missing npcId' });

  if (!npcInstances[npcId]) return res.status(404).json({ error: 'NPC not found' });

  const memory = npcInstances[npcId].getMemory();
  res.json({ memory });
});

// POST /logHash - Log interaction hash for NPC
app.post('/logHash', (req, res) => {
  const { npcId, interactionHash } = req.body;
  if (!npcId || !interactionHash) return res.status(400).json({ error: 'Missing npcId or interactionHash' });

  console.log(`Hash logged for NPC ${npcId}:`, interactionHash);
  res.json({ message: 'Hash logged' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
