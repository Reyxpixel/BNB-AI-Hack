require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const { Client } = require('@bnb-chain/greenfield-js-sdk');
const NPC = require('./npc');
const llmClient = require('./llmclient');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Blockchain Setup - FIXED
const web3 = new Web3(process.env.BSC_RPC_URL);

// Wallet Configuration (moved up before greenfieldAccount)
const wallet = web3.eth.accounts.privateKeyToAccount(process.env.BSC_WALLET_PRIVATE_KEY);
web3.eth.accounts.wallet.add(wallet);

// Fixed Greenfield SDK initialization
const client = Client.create('https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org', '5600');

// Create account from private key using Web3 (since Account might not be available)
const greenfieldAccount = {
    address: wallet.address,
    privateKey: process.env.BSC_WALLET_PRIVATE_KEY
};

// BSC Contract setup with enhanced error handling
const contractABI = require('./abis/NPCTraitsABI.json');
const contractAddress = process.env.BSC_CONTRACT_ADDRESS;
const npcContract = new web3.eth.Contract(contractABI, contractAddress);

// Create directories if they don't exist
if (!fs.existsSync(path.join(__dirname, 'npc_memory'))) {
    fs.mkdirSync(path.join(__dirname, 'npc_memory'));
}

// Enhanced contract validation function
async function validateContract() {
    try {
        console.log('Validating contract at:', contractAddress);
        
        // Check if contract exists by getting code
        const code = await web3.eth.getCode(contractAddress);
        
        console.log('✅ Contract exists at address');
        return true;
    } catch (error) {
        return false;
    }
}

// Test contract method specifically for NPC traits
async function testContractMethod(npcId) {
    try {
        console.log(`Testing contract method for NPC: ${npcId}`);
        
        // Try to call the method that's likely causing issues
        // Adjust method name based on your actual ABI
        const result = await npcContract.methods.getNPCTraits(npcId).call();
        console.log('✅ Contract method test successful:', result);
        return result;
    } catch (error) {
        console.error('❌ Contract method test failed:', error.message);
        
        // Try alternative method names that might exist
        const alternativeMethods = ['getTraits', 'traits', 'getNPC', 'npcs'];
        
        for (const method of alternativeMethods) {
            try {
                if (npcContract.methods[method]) {
                    console.log(`Trying alternative method: ${method}`);
                    const result = await npcContract.methods[method](npcId).call();
                    console.log(`✅ Alternative method ${method} successful:`, result);
                    return result;
                }
            } catch (altError) {
                console.log(`Alternative method ${method} also failed:`, altError.message);
            }
        }
        
        throw error;
    }
}

// Verify Greenfield bucket access
async function verifyGreenfieldAccess() {
    try {
        console.log('Verifying Greenfield bucket access...');
        console.log('Account address:', greenfieldAccount.address);
        console.log('Bucket name:', process.env.GREENFIELD_BUCKET);
        
        // Just verify we can access the bucket
        const bucketInfo = await client.bucket.headBucket(process.env.GREENFIELD_BUCKET);
        console.log('✅ Bucket access verified successfully');
        return true;
    } catch (error) {
        console.error('❌ Bucket access verification failed:', error.message);
        return false;
    }
}

// Verify access on startup
Promise.all([
    verifyGreenfieldAccess(),
    validateContract()
]).then(([greenfieldOk, contractOk]) => {
    console.log('Startup validation results:');
    console.log('- Greenfield:', greenfieldOk ? '✅' : '❌');
}).catch(console.error);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'NPChain Backend API is running',
        endpoints: [
            'POST /chat',
            'GET /traits/:npcId',
            'POST /storeMemory',
            'GET /fetchMemory/:npcId',
            'GET /test-greenfield',
            'GET /test-contract/:npcId'
        ]
    });
});

// Enhanced /chat endpoint with better error handling
app.post('/chat', async (req, res) => {
    try {
        const { npcId, messages } = req.body;
        
        if (!npcId || !messages) {
            return res.status(400).json({ error: 'Missing npcId or messages' });
        }

        console.log(`[${npcId}] Starting chat interaction`);

        // Create NPC with proper client configuration
        const npcConfig = {
            web3,
            greenfieldClient: client, // Make sure to pass the client correctly
            contractABI,
            contractAddress,
            npcContract, // Pass the contract instance directly
            wallet,
            greenfieldAccount,
            bucketName: process.env.GREENFIELD_BUCKET
        };

        const npc = new NPC(npcId, npcConfig);

        // Try to sync traits with enhanced error handling
        try {
            await npc.syncTraitsFromBlockchain();
            console.log(`[${npcId}] ✅ Traits synced successfully`);
        } catch (syncError) {
            console.warn(`[${npcId}] ⚠️ Failed to sync traits, continuing with defaults:`, syncError.message);
            // Continue without traits - the NPC can still function
        }

        // Process the interaction
        const reply = await npc.processInteraction(messages, llmClient);
        
        console.log(`[${npcId}] ✅ Chat interaction completed`);
        res.json({ reply });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Chat processing failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// New endpoint to test contract methods specifically
app.get('/test-contract/:npcId', async (req, res) => {
    try {
        const { npcId } = req.params;
        
        console.log(`Testing contract for NPC: ${npcId}`);
        
        // Test the contract method
        const result = await testContractMethod(npcId);
        
        res.json({
            success: true,
            npcId,
            result,
            message: 'Contract method test successful'
        });
        
    } catch (error) {
        console.error('Contract test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            npcId: req.params.npcId,
            details: {
                contractAddress,
                availableMethods: Object.keys(npcContract.methods || {}),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
});

// Enhanced traits endpoint
app.get('/traits/:npcId', async (req, res) => {
    try {
        const { npcId } = req.params;
        
        console.log(`Fetching traits for NPC: ${npcId}`);
        
        const result = await testContractMethod(npcId);
        
        res.json({
            success: true,
            npcId,
            traits: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Traits fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            npcId: req.params.npcId
        });
    }
});

// FIXED: Store memory endpoint with proper object creation
app.post('/storeMemory', async (req, res) => {
    try {
        const { npcId, memory } = req.body;
        
        if (!npcId || !memory) {
            return res.status(400).json({ error: 'Missing npcId or memory' });
        }

        const objectName = `memory/${npcId}/${Date.now()}.json`;
        const objectData = JSON.stringify({
            npcId,
            memory,
            timestamp: new Date().toISOString()
        });

        console.log('Storing object:', objectName);
        console.log('Data size:', Buffer.byteLength(objectData));

        // Step 1: Create object on Greenfield
        const createObjectTx = await client.object.createObject(
            {
                creator: greenfieldAccount.address,
                bucketName: process.env.GREENFIELD_BUCKET,
                objectName: objectName,
                payloadSize: Buffer.byteLength(objectData),
                visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
                contentType: 'application/json',
                redundancyType: 'REDUNDANCY_EC_TYPE',
                expectChecksums: [],
            }
        );

        // Simulate the transaction
        const simulateInfo = await createObjectTx.simulate({
            denom: 'BNB',
        });

        // Broadcast the transaction
        const createRes = await createObjectTx.broadcast({
            denom: 'BNB',
            gasLimit: Number(simulateInfo.gasLimit),
            gasPrice: simulateInfo.gasPrice || '5000000000',
            payer: greenfieldAccount.address,
            granter: '',
        });

        if (createRes.code !== 0) {
            throw new Error(`Object creation failed: ${createRes.rawLog}`);
        }

        console.log('Object created successfully:', createRes.transactionHash);

        // Step 2: Upload the actual data
        const uploadRes = await client.object.uploadObject(
            {
                bucketName: process.env.GREENFIELD_BUCKET,
                objectName: objectName,
                body: Buffer.from(objectData),
                txnHash: createRes.transactionHash,
            }
        );

        console.log('Upload response:', uploadRes);

        // Step 3: Store hash on BSC
        const memoryHash = crypto.createHash('sha256')
            .update(objectData)
            .digest('hex');

        try {
            const bscTx = await npcContract.methods
                .storeMemoryHash(npcId, memoryHash)
                .send({
                    from: wallet.address,
                    gas: 3000000
                });

            res.json({
                message: 'Memory stored successfully',
                greenfieldTx: createRes.transactionHash,
                bscTx: bscTx.transactionHash,
                objectName,
                hash: memoryHash,
                uploadStatus: uploadRes.status || 'completed'
            });
        } catch (bscError) {
            console.warn('BSC storage failed, but Greenfield succeeded:', bscError.message);
            res.json({
                message: 'Memory stored on Greenfield (BSC failed)',
                greenfieldTx: createRes.transactionHash,
                bscError: bscError.message,
                objectName,
                hash: memoryHash,
                uploadStatus: uploadRes.status || 'completed'
            });
        }

    } catch (error) {
        console.error('Memory storage error:', error);
        res.status(500).json({
            error: 'Memory storage failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// FIXED: Fetch memory endpoint
app.get('/fetchMemory/:npcId', async (req, res) => {
    try {
        const { npcId } = req.params;
        
        console.log('Fetching memory for NPC:', npcId);

        // List objects for this NPC
        const listObjectsRes = await client.object.listObjects({
            bucketName: process.env.GREENFIELD_BUCKET,
            prefix: `memory/${npcId}/`,
            delimiter: '',
            maxKeys: 1000,
        });

        console.log('List objects response:', listObjectsRes);

        if (!listObjectsRes.objects || listObjectsRes.objects.length === 0) {
            return res.status(404).json({ 
                error: 'No memories found for NPC',
                npcId: npcId,
                searchPrefix: `memory/${npcId}/`
            });
        }

        // Get the latest memory file (sort by name which includes timestamp)
        const sortedObjects = listObjectsRes.objects.sort((a, b) => 
            b.objectName.localeCompare(a.objectName)
        );
        const latestObject = sortedObjects[0];

        console.log('Fetching object:', latestObject.objectName);

        // Download the object
        const objectData = await client.object.downloadFile({
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName: latestObject.objectName,
        });

        // Parse the JSON data
        const memoryData = JSON.parse(objectData.toString());

        res.json({
            success: true,
            memory: memoryData,
            metadata: {
                objectName: latestObject.objectName,
                size: latestObject.objectSize,
                timestamp: memoryData.timestamp,
                totalMemories: listObjectsRes.objects.length
            }
        });

    } catch (error) {
        console.error('Memory fetch error:', error);
        res.status(500).json({
            error: 'Memory retrieval failed',
            details: error.message,
            npcId: req.params.npcId,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// FIXED: Greenfield test endpoint
app.get('/test-greenfield', async (req, res) => {
    try {
        console.log('Testing Greenfield connection...');
        
        const testObject = {
            test: 'data',
            timestamp: Date.now(),
            message: 'Hello from NPChain!'
        };

        const objectName = `test_${Date.now()}.json`;
        const objectData = JSON.stringify(testObject);

        // Step 1: Create the object
        const createObjectTx = await client.object.createObject({
            creator: greenfieldAccount.address,
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName: objectName,
            payloadSize: Buffer.byteLength(objectData),
            visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
            contentType: 'application/json',
            redundancyType: 'REDUNDANCY_EC_TYPE',
            expectChecksums: [],
        });

        const simulateInfo = await createObjectTx.simulate({
            denom: 'BNB',
        });

        const createRes = await createObjectTx.broadcast({
            denom: 'BNB',
            gasLimit: Number(simulateInfo.gasLimit),
            gasPrice: simulateInfo.gasPrice || '5000000000',
            payer: greenfieldAccount.address,
            granter: '',
        });

        if (createRes.code !== 0) {
            throw new Error(`Test object creation failed: ${createRes.rawLog}`);
        }

        // Step 2: Upload the data
        const uploadRes = await client.object.uploadObject({
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName: objectName,
            body: Buffer.from(objectData),
            txnHash: createRes.transactionHash,
        });

        // Step 3: Verify by downloading
        const downloadedData = await client.object.downloadFile({
            bucketName: process.env.GREENFIELD_BUCKET,
            objectName: objectName,
        });

        const parsedData = JSON.parse(downloadedData.toString());

        res.json({
            success: true,
            message: 'Greenfield test completed successfully!',
            results: {
                objectCreated: {
                    transactionHash: createRes.transactionHash,
                    objectName: objectName
                },
                uploadStatus: uploadRes.status || 'completed',
                downloadVerification: {
                    originalData: testObject,
                    downloadedData: parsedData,
                    dataMatches: JSON.stringify(testObject) === JSON.stringify(parsedData)
                }
            },
            accountAddress: greenfieldAccount.address,
            bucketName: process.env.GREENFIELD_BUCKET
        });

    } catch (error) {
        console.error('Greenfield test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: {
                accountAddress: greenfieldAccount.address,
                bucketName: process.env.GREENFIELD_BUCKET,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test Greenfield connection
        const bucketInfo = await client.bucket.headBucket(process.env.GREENFIELD_BUCKET);
        
        res.json({
            status: 'healthy',
            services: {
                api: 'running',
                greenfield: 'connected',
                bsc: web3.currentProvider ? 'connected' : 'disconnected'
            },
            account: greenfieldAccount.address,
            bucket: process.env.GREENFIELD_BUCKET,
            contract: contractAddress,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Account Address: ${greenfieldAccount.address}`);
        console.log(`Greenfield Bucket: ${process.env.GREENFIELD_BUCKET}`);
        console.log(`BSC Contract: ${contractAddress}`);
    });
}

module.exports = app;