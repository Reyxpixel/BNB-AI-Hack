// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NPCTraitStorage {
    struct NPCTraits {
        string coreStatement;      // ← IMMUTABLE: Set only once at creation
        string corePersonality;
        string learningStyle;
        uint256 adaptability;
        string moralAlignment;
        uint256 experienceLevel;
        uint256 lastUpdated;
    }
    
    mapping(string => NPCTraits) public npcTraits;
    mapping(string => bool) public npcExists;
    
    event NPCCreated(string indexed npcId, string coreStatement);
    event TraitsUpdated(string indexed npcId, uint256 adaptability, uint256 timestamp);
    
    // ✅ CREATE NPC: Sets coreStatement (IMMUTABLE)
    function createNPC(
        string memory npcId,
        string memory coreStatement,  // ← Set once, never changed
        string memory corePersonality,
        string memory learningStyle,
        uint256 adaptability,
        string memory moralAlignment
    ) external {
        require(!npcExists[npcId], "NPC already exists");
        
        npcTraits[npcId] = NPCTraits(
            coreStatement,           // ← IMMUTABLE
            corePersonality,
            learningStyle,
            adaptability,
            moralAlignment,
            1,                       // experienceLevel starts at 1
            block.timestamp
        );
        
        npcExists[npcId] = true;
        emit NPCCreated(npcId, coreStatement);
    }
    
    // ✅ UPDATE TRAITS: Cannot change coreStatement
    function updateTraits(
        string memory npcId,
        string memory corePersonality,
        string memory learningStyle,
        uint256 adaptability,
        string memory moralAlignment,
        uint256 experienceLevel
    ) external {
        require(npcExists[npcId], "NPC does not exist");
        
        // ⚠️ Notice: coreStatement is NOT included - it stays immutable
        npcTraits[npcId].corePersonality = corePersonality;
        npcTraits[npcId].learningStyle = learningStyle;
        npcTraits[npcId].adaptability = adaptability;
        npcTraits[npcId].moralAlignment = moralAlignment;
        npcTraits[npcId].experienceLevel = experienceLevel;
        npcTraits[npcId].lastUpdated = block.timestamp;
        
        emit TraitsUpdated(npcId, adaptability, block.timestamp);
    }
    
    // ✅ GET TRAITS: Returns all traits including immutable coreStatement
    function getTraits(string memory npcId) external view returns (NPCTraits memory) {
        require(npcExists[npcId], "NPC does not exist");
        return npcTraits[npcId];
    }
}