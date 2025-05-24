// Import Three.js library
const THREE = window.THREE

// NPC Dictionary - Add your custom NPCs here
const npcDatabase = [
  {
    name: "Wanda",
    description:
      "A wise and powerful sorceress who has studied the arcane arts for centuries. She speaks in riddles and offers mystical guidance.",
    modelPath: "models/wanda.glb",
    startingPrompt:
      "Greetings, traveler. I sense great potential within you. The ancient magics whisper of your arrival. What knowledge do you seek from the ethereal realms?",
    personality: "mystical, wise, speaks in an archaic manner",
    attributes: ["Mystical", "Wise", "Ancient", "Powerful"]
  },
  {
    name: "Captain Rex",
    description:
      "A battle-hardened space marine with years of combat experience. Direct, tactical, and always ready for action.",
    modelPath: "models/captain_rex.glb",
    startingPrompt:
      "Soldier! Good to see you made it. We've got a situation that needs handling. What's your status and how can I assist with the mission?",
    personality: "military, direct, tactical, uses military terminology",
    attributes: ["Tactical", "Brave", "Leader", "Combat"]
  },
  {
    name: "Luna the Healer",
    description:
      "A gentle and compassionate cleric who dedicates her life to helping others. She radiates warmth and kindness.",
    modelPath: "models/luna_healer.glb",
    startingPrompt:
      "Welcome, dear friend. I can sense you carry burdens upon your heart. Please, sit and tell me what troubles you. Perhaps I can offer some comfort or guidance.",
    personality: "compassionate, gentle, caring, speaks softly",
    attributes: ["Healing", "Kind", "Gentle", "Sacred"]
  },
  {
    name: "Zyx the Inventor",
    description:
      "An eccentric genius inventor who creates impossible gadgets. Always excited about new discoveries and innovations.",
    modelPath: "models/zyx_inventor.glb",
    startingPrompt:
      "Oh! A visitor! Perfect timing! I just finished my latest contraption - a quantum flux capacitor! Well, it doesn't work yet, but that's beside the point. What brings you to my workshop?",
    personality: "eccentric, enthusiastic, scientific, uses technical jargon",
    attributes: ["Genius", "Creative", "Tech", "Eccentric"]
  },
  {
    name: "Shadow the Rogue",
    description:
      "A mysterious thief with a heart of gold. Speaks in whispers and knows all the secrets of the underworld.",
    modelPath: "models/shadow_rogue.glb",
    startingPrompt:
      "*steps out from the shadows* Well, well... what do we have here? You don't look like you're from around these parts. Looking for information, or perhaps something more... valuable?",
    personality: "mysterious, cunning, street-smart, speaks in whispers",
    attributes: ["Stealth", "Cunning", "Agile", "Shadow"]
  },
]

// Global variables
let scene, camera, renderer, controls
let currentModel
let currentNPCIndex = 0
let isLoading = false
let chatHistory = []
let loader // GLTF loader

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initThreeJS()
  initEventListeners()
  loadNPC(0)
  updateNPCCounter()
})

// Three.js initialization
function initThreeJS() {
  const canvas = document.getElementById("three-canvas")
  const container = canvas.parentElement

  // Scene setup
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x222222)

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 1, 4)

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  // Controls setup
  if (typeof THREE.OrbitControls !== "undefined") {
    controls = new THREE.OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI / 2
    controls.minDistance = 2
    controls.maxDistance = 8
  }

  // Initialize GLTF loader
  if (typeof THREE.GLTFLoader !== "undefined") {
    loader = new THREE.GLTFLoader()
    console.log("✅ GLTFLoader initialized successfully")
  } else {
    console.error("❌ GLTFLoader not available")
    updateModelStatus("GLTFLoader not available")
    loader = null
  }

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(-5, 0, -5)
  scene.add(fillLight)

  // Handle window resize
  window.addEventListener("resize", onWindowResize)

  // Start render loop
  animate()
}

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  // Update controls
  if (controls) {
    controls.update()
  }

  // Auto-rotate the model if no user interaction
  if (currentModel && (!controls || !controls.enabled)) {
    currentModel.rotation.y += 0.005
  }

  renderer.render(scene, camera)
}

// Handle window resize
function onWindowResize() {
  const canvas = document.getElementById("three-canvas")
  const container = canvas.parentElement

  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

// Update model status display
function updateModelStatus(message) {
  const statusElement = document.getElementById("model-status")
  if (statusElement) {
    statusElement.textContent = message
  }
}

// Load NPC model and data with smooth transitions
function loadNPC(index) {
  if (isLoading) return

  isLoading = true
  updateModelStatus("Loading NPC...")

  const npc = npcDatabase[index]
  currentNPCIndex = index

  // Start smooth transition
  const modelInfo = document.querySelector(".model-info")
  const canvas = document.getElementById("three-canvas")

  // Fade out current content
  modelInfo.classList.add("fade-transition")
  canvas.classList.add("fade-transition")

  setTimeout(() => {
    // Update UI with NPC info
    document.getElementById("npc-name").textContent = npc.name
    document.getElementById("npc-description").textContent = npc.description
    document.getElementById("chat-npc-name").textContent = npc.name
    document.getElementById("welcome-text").textContent = npc.startingPrompt

    // Update attributes
    const attributeElements = document.querySelectorAll('.attribute-tag')
    npc.attributes.forEach((attr, i) => {
      if (attributeElements[i]) {
        attributeElements[i].textContent = attr
      }
    })

    // Clear chat history
    clearChat()

    // Load 3D model
    loadModel(npc)

    // Fade in new content
    setTimeout(() => {
      modelInfo.classList.add("visible")
      canvas.classList.add("visible")
      isLoading = false
    }, 100)
  }, 300)
}

// Load 3D model
function loadModel(npc) {
  // Remove current model and base
  if (currentModel) {
    scene.remove(currentModel)
    currentModel = null
  }
  
  // Remove any existing base
  const existingBase = scene.getObjectByName("modelBase")
  if (existingBase) {
    scene.remove(existingBase)
  }

  if (!loader) {
    updateModelStatus("GLTFLoader not available")
    console.error("❌ GLTFLoader not available")
    return
  }

  updateModelStatus(`Loading ${npc.name}...`)
  console.log(`🔄 Attempting to load model: ${npc.modelPath}`)

  loader.load(
    npc.modelPath,
    (gltf) => {
      // Success - model loaded
      console.log(`✅ Successfully loaded model: ${npc.modelPath}`)
      updateModelStatus(`${npc.name} loaded successfully`)
      
      currentModel = gltf.scene

      // Scale and position the model appropriately
      const box = new THREE.Box3().setFromObject(currentModel)
      const size = box.getSize(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.y, size.z)
      const scale = 2 / maxSize // Scale to fit in a 2-unit space

      currentModel.scale.set(scale, scale, scale)

      // Center the model
      const center = box.getCenter(new THREE.Vector3())
      currentModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

      // Enable shadows and improve materials
      currentModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          // Improve material properties
          if (child.material) {
            child.material.needsUpdate = true
          }
        }
      })

      scene.add(currentModel)
      addModelBase()

      // Hide status after successful load
      setTimeout(() => {
        updateModelStatus("")
      }, 2000)
    },
    (progress) => {
      // Loading progress
      if (progress.total > 0) {
        const percent = (progress.loaded / progress.total) * 100
        updateModelStatus(`Loading ${npc.name}... ${percent.toFixed(0)}%`)
        console.log(`📊 Loading progress: ${percent.toFixed(1)}%`)
      }
    },
    (error) => {
      // Error loading model
      console.error(`❌ Failed to load model ${npc.modelPath}:`, error)
      updateModelStatus(`Failed to load ${npc.name} model`)
      
      // Show detailed error information
      console.log("🔍 Troubleshooting tips:")
      console.log("1. Check if the file exists at:", window.location.origin + "/" + npc.modelPath)
      console.log("2. Ensure the file is a valid GLB/GLTF format")
      console.log("3. Check browser console for CORS errors")
      console.log("4. Verify file permissions and server configuration")
    }
  )
}

// Add a base platform for the model
function addModelBase() {
  // Add a simple base
  const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16)
  const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xeceff1 })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = -1
  base.receiveShadow = true
  base.name = "modelBase" // Name it so we can remove it later
  scene.add(base)
}

// Event listeners
function initEventListeners() {
  // NPC navigation
  document.getElementById("prev-npc").addEventListener("click", () => {
    const newIndex = (currentNPCIndex - 1 + npcDatabase.length) % npcDatabase.length
    loadNPC(newIndex)
    updateNPCCounter()
  })

  document.getElementById("next-npc").addEventListener("click", () => {
    const newIndex = (currentNPCIndex + 1) % npcDatabase.length
    loadNPC(newIndex)
    updateNPCCounter()
  })

  // Chat functionality
  const chatInput = document.getElementById("chat-input")
  const sendBtn = document.getElementById("send-btn")
  const clearBtn = document.getElementById("clear-chat")

  sendBtn.addEventListener("click", sendMessage)
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  clearBtn.addEventListener("click", clearChat)
}

// Send chat message
function sendMessage() {
  const input = document.getElementById("chat-input")
  const message = input.value.trim()

  if (!message) return

  // Add user message
  addMessage(message, "user")
  input.value = ""

  // Simulate NPC response
  setTimeout(
    () => {
      const npcResponse = generateNPCResponse(message)
      addMessage(npcResponse, "npc")
    },
    1000 + Math.random() * 2000,
  )
}

// Add message to chat with improved bubble sizing
function addMessage(content, sender) {
  const chatContent = document.querySelector(".chat-content")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${sender}-message`

  const messageContent = document.createElement("div")
  messageContent.className = "message-content"
  messageContent.innerHTML = `<p>${content}</p>`

  messageDiv.appendChild(messageContent)
  chatContent.appendChild(messageDiv)

  // Scroll to bottom smoothly
  chatContent.scrollTop = chatContent.scrollHeight

  // Add to history
  chatHistory.push({ content, sender, timestamp: Date.now() })
}

// Generate NPC response (placeholder - replace with actual AI integration)
function generateNPCResponse(userMessage) {
  const npc = npcDatabase[currentNPCIndex]
  const responses = {
    0: [
      // Mage responses
      "The threads of fate weave mysteriously around your words...",
      "I sense great wisdom in your inquiry, young seeker.",
      "The ancient tomes speak of such matters in cryptic verses...",
      "Your question resonates with the cosmic energies...",
    ],
    1: [
      // Captain responses
      "Roger that! Let me analyze the situation...",
      "Solid copy. Here's my tactical assessment...",
      "Understood. Mission parameters are clear.",
      "Affirmative. That's a strategic approach...",
    ],
    2: [
      // Healer responses
      "Your words touch my heart deeply...",
      "I understand your concerns, dear friend.",
      "Let me offer you some gentle guidance...",
      "Peace be with you. Here's what I believe...",
    ],
    3: [
      // Inventor responses
      "Fascinating! That gives me an idea for a new invention!",
      "Eureka! Your question sparks my scientific curiosity!",
      "Interesting hypothesis! Let me run some calculations...",
      "Brilliant! That reminds me of my quantum experiments...",
    ],
    4: [
      // Rogue responses
      "*whispers* That's valuable information...",
      "I've heard rumors about such things in the shadows...",
      "Clever question. You're sharper than you look...",
      "*glances around* Between you and me...",
    ],
  }

  const npcResponses = responses[currentNPCIndex] || ["Interesting...", "Tell me more.", "I see..."]
  return npcResponses[Math.floor(Math.random() * npcResponses.length)]
}

// Clear chat
function clearChat() {
  const chatContent = document.querySelector(".chat-content")
  const welcomeMessage = chatContent.querySelector(".welcome-message")
  chatContent.innerHTML = ""
  chatContent.appendChild(welcomeMessage)
  chatHistory = []
}

// Update NPC counter
function updateNPCCounter() {
  document.getElementById("current-npc").textContent = currentNPCIndex + 1
  document.getElementById("total-npcs").textContent = npcDatabase.length
}

// Utility function to add more NPCs dynamically
function addNPC(npcData) {
  npcDatabase.push(npcData)
  updateNPCCounter()
}

// Export functions for potential external use
window.NPCChat = {
  addNPC,
  loadNPC,
  getCurrentNPC: () => npcDatabase[currentNPCIndex],
  getChatHistory: () => chatHistory,
}