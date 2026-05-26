const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
    require('dotenv').config({ path: path.join(__dirname, '.env.local') });
} else {
    require('dotenv').config();
}
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const printer = require('./printer_helper');

// DynamoDB client initialization with graceful fallback
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

let ddbDocClient = null;
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || "ap-east-1";
const dynamoTableName = process.env.DYNAMODB_TABLE_NAME || "PetaLifeUsers";

if (awsAccessKeyId && awsSecretAccessKey && awsAccessKeyId.trim() !== "" && awsSecretAccessKey.trim() !== "") {
    try {
        console.log(`Connecting to AWS DynamoDB in region: ${awsRegion}...`);
        const client = new DynamoDBClient({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKeyId.trim(),
                secretAccessKey: awsSecretAccessKey.trim()
            }
        });
        ddbDocClient = DynamoDBDocumentClient.from(client);
        console.log(`DynamoDB client initialized successfully for table: ${dynamoTableName}`);
    } catch (err) {
        console.error("Failed to initialize AWS DynamoDB client. Falling back to Mock DB.", err.message);
        ddbDocClient = null;
    }
} else {
    console.log("No AWS credentials provided in environmental parameters. Running in local MOCK DATABASE fallback mode.");
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Redirect HTTP to HTTPS in production
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

// Set Security Headers to satisfy Chrome SSL checks
app.use((req, res, next) => {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

// Mock "AWS Database" of User & Pet Information
const mockDatabase = {
    "d78ac515-e85d-4d25-9a23-5b07438a28b4": {
        id: "d78ac515-e85d-4d25-9a23-5b07438a28b4",
        displayId: "8X29F2",
        name: "tes",
        email: "tes@petalife.com",
        tier: "Gold Elite",
        points: 120,
        pointsDeposited: 10,
        trackingDay: 5,
        progress: 5,
        stoolType: "Type 4",
        condition: "Healthy",
        petName: "Mochi",
        petBreed: "Poodle",
        petCategory: "dog",
        petAvatar: "/images/pixel_poodle.png",
        location: "Mall 2/F",
        rewardTitle: "Free Pet Photoboth Session",
        rewardSubtitle: "Digital Version",
        rewardChinese: "免費寵物自拍館拍攝 (電子版)"
    },
    "PL-5582-9018": {
        id: "PL-5582-9018",
        displayId: "9F21A4",
        name: "Johnny Doe",
        email: "johnny@petalife.com",
        tier: "Platinum VIP",
        points: 340,
        pointsDeposited: 20,
        trackingDay: 7,
        progress: 7,
        stoolType: "Type 3",
        condition: "Healthy",
        petName: "Rocky",
        petBreed: "Siberian Husky",
        petCategory: "dog",
        petAvatar: "/images/pixel_poodle.png", // fallback or default pixel dog
        location: "Central Kiosk",
        rewardTitle: "Dyson Pencil Wash Coupon",
        rewardSubtitle: "30-Day Premium Log",
        rewardChinese: "Dyson 寵物吸塵洗地機優惠券"
    },
    "PL-1029-4475": {
        id: "PL-1029-4475",
        displayId: "2B88C4",
        name: "Alice Smith",
        email: "alice.smith@gmail.com",
        tier: "Gold Elite",
        points: 90,
        pointsDeposited: 10,
        trackingDay: 3,
        progress: 3,
        stoolType: "Type 4",
        condition: "Soft Stool",
        petName: "Bella",
        petBreed: "Golden Retriever",
        petCategory: "dog",
        petAvatar: "/images/pixel_poodle.png",
        location: "Mall 2/F",
        rewardTitle: "Free Treat Sample Pack",
        rewardSubtitle: "Organic Salmon flavor",
        rewardChinese: "有機三文魚凍乾零食包"
    },
    "PL-8823-1102": {
        id: "PL-8823-1102",
        displayId: "3C99D5",
        name: "Bob Johnson",
        email: "bob.j@outlook.com",
        tier: "Silver Club",
        points: 40,
        pointsDeposited: 5,
        trackingDay: 2,
        progress: 2,
        stoolType: "Type 5",
        condition: "Diarrhea",
        petName: "Cooper",
        petBreed: "French Bulldog",
        petCategory: "dog",
        petAvatar: "/images/pixel_poodle.png",
        location: "Kowloon Branch",
        rewardTitle: "10% Off Vet Checkup",
        rewardSubtitle: "Standard consultation",
        rewardChinese: "獸醫門診九折優惠券"
    }
};

// WebSocket Sessions Registry (maps sessionId -> kiosk WebSocket client)
const activeSessions = new Map();

// Helper to get local network IP address
const os = require('os');
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// REST API Endpoints

// 0. Get server LAN info (for mobile QR link)
app.get('/api/server-info', (req, res) => {
    res.json({
        ip: getLocalIp(),
        port: PORT
    });
});

// 1. Get AWS users list
app.get('/api/users', (req, res) => {
    // Return summary details (no sub-details needed for simple listing)
    const usersSummary = Object.values(mockDatabase).map(u => ({
        id: u.id,
        name: u.name,
        tier: u.tier,
        avatar: u.avatar
    }));
    res.json(usersSummary);
});

// Helper to aggregate data across multiple AWS DynamoDB tables (Stool records, Enrollments links, Pet Profiles, P Coin balances)
async function fetchCompleteUserProfile(scannedId) {
    if (!ddbDocClient) return null;

    try {
        console.log(`[AWS Aggregator] Beginning multi-table fetch for enrollmentId: "${scannedId}"`);
        
        let userId = null;
        let petId = null;
        let petName = "Mochi"; // default fallback
        let petBreed = "Poodle";
        let petCategory = "dog";
        let points = 120; // default points
        let trackingDay = 1;
        let progress = 1;
        let stoolType = "Type 4";
        let condition = "Healthy";
        let latestStoolItem = null;
        let hasEnrollment = false;

        // Step 0: Scan petalife-okr1-enrollments to get userId and petId
        try {
            console.log(`[AWS Enrollments] Searching enrollment details...`);
            const enrollRes = await ddbDocClient.send(new ScanCommand({
                TableName: "petalife-okr1-enrollments",
                FilterExpression: "enrollmentId = :enrollmentId",
                ExpressionAttributeValues: {
                    ":enrollmentId": scannedId
                }
            }));
            if (enrollRes.Items && enrollRes.Items.length > 0) {
                const enrollment = enrollRes.Items[0];
                userId = enrollment.userId || null;
                petId = enrollment.petId || null;
                hasEnrollment = true;
                if (enrollment.petName) petName = enrollment.petName;
                if (enrollment.petBreed) petBreed = enrollment.petBreed;
                console.log(`[AWS Enrollments] Found enrollment. userId: "${userId}", petId: "${petId}", petName: "${petName}"`);
            }
        } catch (e) {
            console.error(`[AWS Enrollments Error]`, e.message);
        }

        // Step 1: Query latest stool record from petalife-okr1-stool-records (filtering out cached insights)
        try {
            console.log(`[AWS Stool Records] Querying latest stool logs...`);
            const stoolRes = await ddbDocClient.send(new QueryCommand({
                TableName: "petalife-okr1-stool-records",
                KeyConditionExpression: "enrollmentId = :enrollmentId",
                FilterExpression: "attribute_exists(userId) AND attribute_exists(petId)",
                ExpressionAttributeValues: {
                    ":enrollmentId": scannedId
                },
                ScanIndexForward: false, // latest first
                Limit: 5 // Get a few to account for cached insight entries
            }));
            
            if (stoolRes.Items && stoolRes.Items.length > 0) {
                latestStoolItem = stoolRes.Items[0];
                userId = latestStoolItem.userId || userId;
                petId = latestStoolItem.petId || petId;
                trackingDay = latestStoolItem.dayNumber || 1;
                progress = latestStoolItem.dayNumber || 1;
                
                if (latestStoolItem.analysisResult) {
                    stoolType = latestStoolItem.analysisResult.bssLabel || `Type ${latestStoolItem.analysisResult.bssType || 4}`;
                    condition = latestStoolItem.analysisResult.colorLabel || "Healthy";
                }
                console.log(`[AWS Stool Records] Found stool entry. userId: "${userId}", petId: "${petId}", trackingDay: ${trackingDay}`);
            } else {
                console.log(`[AWS Stool Records] No stool records found for enrollmentId: "${scannedId}"`);
            }
        } catch (e) {
            console.error(`[AWS Stool Records Error]`, e.message);
        }

        // Step 3: Fetch Pet Profile from petalife-pet
        if (petId) {
            try {
                console.log(`[AWS Pet Profile] Fetching pet name for ID: "${petId}"...`);
                const petRes = await ddbDocClient.send(new GetCommand({
                    TableName: "petalife-pet",
                    Key: { ID: petId }
                }));
                if (petRes.Item) {
                    petName = petRes.Item.petName || petName || "Mochi";
                    petBreed = petRes.Item.breed ? petRes.Item.breed.replace("dogBreed.", "").replace("catBreed.", "").toUpperCase() : (petBreed || "Poodle");
                    petCategory = petRes.Item.selectedPet || "dog";
                    console.log(`[AWS Pet Profile] Found pet name: "${petName}", breed: "${petBreed}", category: "${petCategory}"`);
                }
            } catch (e) {
                console.error(`[AWS Pet Profile Error]`, e.message);
            }
        }

        // Step 4: Fetch P Coin points balance from petalife-pcoin-balances
        if (userId) {
            try {
                console.log(`[AWS P Coin] Fetching balance for userId: "${userId}"...`);
                const pcoinRes = await ddbDocClient.send(new GetCommand({
                    TableName: "petalife-pcoin-balances",
                    Key: { userId: userId }
                }));
                if (pcoinRes.Item && typeof pcoinRes.Item.balance === 'number') {
                    points = pcoinRes.Item.balance;
                    console.log(`[AWS P Coin] Loaded live balance: ${points} P`);
                }
            } catch (e) {
                console.error(`[AWS P Coin Error]`, e.message);
            }
        }

        // Compile aggregate profile if we loaded at least a stool record, user, pet, or found an enrollment
        if (userId || petId || latestStoolItem || hasEnrollment) {
            const displayIdVal = userId ? userId.substring(0, 6).toUpperCase() : scannedId.substring(0, 6).toUpperCase();
            
            return {
                id: scannedId,
                displayId: displayIdVal,
                name: petName ? (petName + "'s Parent") : "Member Parent",
                email: "member@petalife.com",
                tier: "Gold Elite",
                points: points,
                pointsDeposited: latestStoolItem ? 10 : 0,
                trackingDay: trackingDay,
                progress: progress,
                stoolType: stoolType,
                condition: condition,
                petName: petName,
                petBreed: petBreed,
                petCategory: petCategory,
                petAvatar: "/images/pixel_poodle.png",
                location: "Mall 2/F",
                rewardTitle: "Free Pet Photoboth Session",
                rewardSubtitle: "Digital Version",
                rewardChinese: "免費寵物自拍館拍攝 (電子版)"
            };
        }

        console.log(`[AWS Aggregator] No real records found for enrollmentId "${scannedId}".`);
        return null;

    } catch (err) {
        console.error("[AWS Aggregator Error] Failed to aggregate profile:", err.message);
        return null;
    }
}

// 1.5 Get single user profile by ID (for hardware QR scans)
app.get('/api/users/profile', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    // Try live AWS Multi-Table aggregation
    if (ddbDocClient) {
        const liveUser = await fetchCompleteUserProfile(userId);
        if (liveUser) {
            return res.json(liveUser);
        }
    }

    // Local mock database fallback
    console.log(`[Database Fallback] Searching local mock DB for "${userId}"`);
    const user = mockDatabase[userId];
    if (!user) {
        return res.status(404).json({ error: "User not found in database (AWS / Mock)" });
    }
    res.json(user);
});

// 2. Connect mobile session (updates kiosk screen)
app.post('/api/connect-session', async (req, res) => {
    const { sessionId, userId } = req.body;
    
    if (!sessionId || !userId) {
        return res.status(400).json({ error: "Missing sessionId or userId" });
    }

    let user = null;

    // Try live AWS Multi-Table aggregation
    if (ddbDocClient) {
        user = await fetchCompleteUserProfile(userId);
    }

    // Local mock database fallback
    if (!user) {
        console.log(`[Database Fallback] Fetching from local mock DB for "${userId}"`);
        user = mockDatabase[userId];
    }

    if (!user) {
        return res.status(404).json({ error: "User not found in database (AWS / Mock)" });
    }

    const kioskWs = activeSessions.get(sessionId);
    if (!kioskWs || kioskWs.readyState !== WebSocket.OPEN) {
        return res.status(400).json({ error: "No active kiosk session found. The session may have expired." });
    }

    // Push the user data over the WebSocket connection to the kiosk
    kioskWs.send(JSON.stringify({
        event: "user-connected",
        user: user
    }));

    console.log(`Linked user ${user.name || userId} (${userId}) to kiosk session ${sessionId}`);
    res.json({ success: true, message: `Successfully linked profile for ${user.name || userId}` });
});

// 3. Printer APIs
app.get('/api/printer/status', (req, res) => {
    res.json(printer.getStatus());
});

app.get('/api/printer/list', async (req, res) => {
    try {
        const list = await printer.listPrinters();
        res.json({ printers: list });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/printer/connect', (req, res) => {
    const { settings } = req.body;
    if (!settings) {
        return res.status(400).json({ error: "Missing connection settings" });
    }
    const result = printer.connect(settings);
    res.json(result);
});

app.post('/api/printer/disconnect', (req, res) => {
    const result = printer.disconnect();
    res.json(result);
});

app.post('/api/printer/print', (req, res) => {
    const { user } = req.body;
    if (!user) {
        return res.status(400).json({ error: "Missing user information for print job" });
    }
    const result = printer.printReceipt(user);
    res.json(result);
});

app.post('/api/printer/selftest', (req, res) => {
    const result = printer.printSelfTest();
    res.json(result);
});


// WebSocket Server Connection Handler
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const role = url.searchParams.get('role');
    const sessionId = url.searchParams.get('sessionId');

    if (role === 'kiosk' && sessionId) {
        // Register the kiosk socket
        activeSessions.set(sessionId, ws);
        console.log(`Kiosk registered WebSocket session: ${sessionId}`);

        ws.on('close', () => {
            activeSessions.delete(sessionId);
            console.log(`Kiosk session closed: ${sessionId}`);
        });
    }

    // Ping / Pong keepalive
    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// Ping interval to keep connections alive
const interval = setInterval(() => {
    wss.clients.forEach(ws => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});


// Start server
server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` PetaLife ATM Backend Server Running at: http://localhost:${PORT}`);
    console.log(` Kiosk Web Interface:   http://localhost:${PORT}/kiosk.html`);
    console.log(` Mobile Web Simulator: http://localhost:${PORT}/mobile.html`);
    console.log(` Mode:                 ${printer.isMock ? 'MOCK PRINTER MODE' : 'HARDWARE DLL MODE'}`);
    console.log(`================================================================`);
});

module.exports = app;
