// Import Three.js library
const THREE = window.THREE;

// NPC Dictionary - Add your custom NPCs here
const npcDatabase = [
    {
        name: "Aria the Mage",
        description: "A wise and powerful sorceress who has studied the arcane arts for centuries. She speaks in riddles and offers mystical guidance.",
        modelPath: "models/aria_mage.glb",
        startingPrompt: "Greetings, traveler. I sense great potential within you. The ancient magics whisper of your arrival. What knowledge do you seek from the ethereal realms?",
        personality: "mystical, wise, speaks in an archaic manner"
    },
    {
        name: "Captain Rex",
        description: "A battle-hardened space marine with years of combat experience. Direct, tactical, and always ready for action.",
        modelPath: "models/captain_rex.glb",
        startingPrompt: "Soldier! Good to see you made it. We've got a situation that needs handling. What's your status and how can I assist with the mission?",
        personality: "military, direct, tactical, uses military terminology"
    },
    {
        name: "Luna the Healer",
        description: "A gentle and compassionate cleric who dedicates her life to helping others. She radiates warmth and kindness.",
        modelPath: "models/luna_healer.glb",
        startingPrompt: "Welcome, dear friend. I can sense you carry burdens upon your heart. Please, sit and tell me what troubles you. Perhaps I can offer some comfort or guidance.",
        personality: "compassionate, gentle, caring, speaks softly"
    },
    {
        name: "Zyx the Inventor",
        description: "An eccentric genius inventor who creates impossible gadgets. Always excited about new discoveries and innovations.",
        modelPath: "models/zyx_inventor.glb",
        startingPrompt: "Oh! A visitor! Perfect timing! I just finished my latest contraption - a quantum flux capacitor! Well, it doesn't work yet, but that's beside the point. What brings you to my workshop?",
        personality: "eccentric, enthusiastic, scientific, uses technical jargon"
    },
    {
        name: "Shadow the Rogue",
        description: "A mysterious thief with a heart of gold. Speaks in whispers and knows all the secrets of the underworld.",
        modelPath: "models/shadow_rogue.glb",
        startingPrompt: "*steps out from the shadows* Well, well... what do we have here? You don't look like you're from around these parts. Looking for information, or perhaps something more... valuable?",
        personality: "mysterious, cunning, street-smart, speaks in whispers"
    }
];

// Global variables
let scene, camera, renderer, currentModel, currentNPCIndex = 0;
let isLoading = false;
let chatHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initEventListeners();
    loadNPC(0);
    updateNPCCounter();
});

// Three.js initialization
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.5, 4);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start render loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the current model
    if (currentModel) {
        currentModel.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    const canvas = document.getElementById('three-canvas');
    const container = canvas.parentElement;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Load NPC model and data with smooth transitions
function loadNPC(index) {
    if (isLoading) return;
    
    isLoading = true;
    
    const npc = npcDatabase[index];
    currentNPCIndex = index;
    
    // Start smooth transition
    const modelHeader = document.getElementById('model-header');
    const canvas = document.getElementById('three-canvas');
    
    // Fade out current content
    modelHeader.classList.add('fade-transition');
    canvas.classList.add('fade-transition');
    
    setTimeout(() => {
        // Update UI with NPC info
        document.getElementById('npc-name').textContent = npc.name;
        document.getElementById('npc-description').textContent = npc.description;
        document.getElementById('chat-npc-name').textContent = npc.name;
        document.getElementById('welcome-text').textContent = npc.startingPrompt;
        
        // Clear chat history
        clearChat();
        
        // Load 3D model
        loadPlaceholderModel(npc);
        
        // Fade in new content
        setTimeout(() => {
            modelHeader.classList.add('visible');
            canvas.classList.add('visible');
            isLoading = false;
        }, 100);
        
    }, 300);
}

// Load placeholder model (replace this with actual GLTF loading)
function loadPlaceholderModel(npc) {
    // Remove current model
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    // Create placeholder geometry based on NPC type
    let geometry, material;
    
    switch(currentNPCIndex) {
        case 0: // Mage
            geometry = new THREE.ConeGeometry(0.5, 2, 8);
            material = new THREE.MeshLambertMaterial({ color: 0x9c27b0 });
            break;
        case 1: // Captain
            geometry = new THREE.BoxGeometry(1, 2, 0.5);
            material = new THREE.MeshLambertMaterial({ color: 0x2196f3 });
            break;
        case 2: // Healer
            geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 12);
            material = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
            break;
        case 3: // Inventor
            geometry = new THREE.OctahedronGeometry(1);
            material = new THREE.MeshLambertMaterial({ color: 0xff9800 });
            break;
        case 4: // Rogue
            geometry = new THREE.TetrahedronGeometry(1);
            material = new THREE.MeshLambertMaterial({ color: 0x424242 });
            break;
        default:
            geometry = new THREE.SphereGeometry(1, 16, 16);
            material = new THREE.MeshLambertMaterial({ color: 0x607d8b });
    }
    
    currentModel = new THREE.Mesh(geometry, material);
    currentModel.position.y = 0.5;
    currentModel.castShadow = true;
    scene.add(currentModel);
    
    // Add a simple base
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xeceff1 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.55;
    base.receiveShadow = true;
    scene.add(base);
}

// Event listeners
function initEventListeners() {
    // NPC navigation
    document.getElementById('prev-npc').addEventListener('click', () => {
        const newIndex = (currentNPCIndex - 1 + npcDatabase.length) % npcDatabase.length;
        loadNPC(newIndex);
        updateNPCCounter();
    });
    
    document.getElementById('next-npc').addEventListener('click', () => {
        const newIndex = (currentNPCIndex + 1) % npcDatabase.length;
        loadNPC(newIndex);
        updateNPCCounter();
    });
    
    // Chat functionality
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-chat');
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    clearBtn.addEventListener('click', clearChat);
}

// Send chat message
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Simulate NPC response
    setTimeout(() => {
        const npcResponse = generateNPCResponse(message);
        addMessage(npcResponse, 'npc');
    }, 1000 + Math.random() * 2000);
}

// Add message to chat with improved bubble sizing
function addMessage(content, sender) {
    const chatContent = document.querySelector('.chat-content');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${content}</p>`;
    
    messageDiv.appendChild(messageContent);
    chatContent.appendChild(messageDiv);
    
    // Scroll to bottom smoothly
    chatContent.scrollTop = chatContent.scrollHeight;
    
    // Add to history
    chatHistory.push({ content, sender, timestamp: Date.now() });
}

// Generate NPC response (placeholder - replace with actual AI integration)
function generateNPCResponse(userMessage) {
    const npc = npcDatabase[currentNPCIndex];
    const responses = {
        0: [ // Mage responses
            "The threads of fate weave mysteriously around your words...",
            "I sense great wisdom in your inquiry, young seeker.",
            "The ancient tomes speak of such matters in cryptic verses...",
            "Your question resonates with the cosmic energies..."
        ],
        1: [ // Captain responses
            "Roger that! Let me analyze the situation...",
            "Solid copy. Here's my tactical assessment...",
            "Understood. Mission parameters are clear.",
            "Affirmative. That's a strategic approach..."
        ],
        2: [ // Healer responses
            "Your words touch my heart deeply...",
            "I understand your concerns, dear friend.",
            "Let me offer you some gentle guidance...",
            "Peace be with you. Here's what I believe..."
        ],
        3: [ // Inventor responses
            "Fascinating! That gives me an idea for a new invention!",
            "Eureka! Your question sparks my scientific curiosity!",
            "Interesting hypothesis! Let me run some calculations...",
            "Brilliant! That reminds me of my quantum experiments..."
        ],
        4: [ // Rogue responses
            "*whispers* That's valuable information...",
            "I've heard rumors about such things in the shadows...",
            "Clever question. You're sharper than you look...",
            "*glances around* Between you and me..."
        ]
    };
    
    const npcResponses = responses[currentNPCIndex] || ["Interesting...", "Tell me more.", "I see..."];
    return npcResponses[Math.floor(Math.random() * npcResponses.length)];
}

// Clear chat
function clearChat() {
    const chatContent = document.querySelector('.chat-content');
    const welcomeMessage = chatContent.querySelector('.welcome-message');
    chatContent.innerHTML = '';
    chatContent.appendChild(welcomeMessage);
    chatHistory = [];
}

// Update NPC counter
function updateNPCCounter() {
    document.getElementById('current-npc').textContent = currentNPCIndex + 1;
    document.getElementById('total-npcs').textContent = npcDatabase.length;
}

// Utility function to add more NPCs dynamically
function addNPC(npcData) {
    npcDatabase.push(npcData);
    updateNPCCounter();
}

// Export functions for potential external use
window.NPCChat = {
    addNPC,
    loadNPC,
    getCurrentNPC: () => npcDatabase[currentNPCIndex],
    getChatHistory: () => chatHistory
};