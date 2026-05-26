// Kiosk ATM UI logic - Retro Pixel Art Edition
document.addEventListener('DOMContentLoaded', () => {
    let sessionId = Math.random().toString(36).substring(2, 10);
    let socket = null;
    let currentUser = null;
    let activePrinterSettings = null;
    let html5QrScanner = null;

    // Helper to route printer API requests to local port 3000 if running in Vercel cloud
    function getApiRoot(url) {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.')) {
            if (url.startsWith('/api/printer/')) {
                return `http://localhost:3000${url}`;
            }
        }
        return url;
    }

    // DOM Elements
    const liveClock = document.getElementById('liveClock');
    const quickStatusPill = document.getElementById('quickStatusPill');
    const statusPillText = quickStatusPill.querySelector('.pixel-status-text');
    const statusPillIndicator = quickStatusPill.querySelector('.pixel-status-indicator');

    // Screens
    const idleScreen = document.getElementById('idleScreen');
    const receiptScreen = document.getElementById('receiptScreen');
    const printOverlay = document.getElementById('printOverlay');
    const mobileSimLink = document.getElementById('mobileSimLink');

    // Modal elements
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const printerInterface = document.getElementById('printerInterface');
    const connectPrinterBtn = document.getElementById('connectPrinterBtn');
    const disconnectPrinterBtn = document.getElementById('disconnectPrinterBtn');
    const testPrintBtn = document.getElementById('testPrintBtn');
    const connectionStatusVal = document.getElementById('connectionStatusVal');
    const printerSettingsForm = document.getElementById('printerSettingsForm');

    // Sub-panels in settings form
    const windowsPanel = document.getElementById('windowsSettingsPanel');
    const usbPanel = document.getElementById('usbSettingsPanel');
    const comPanel = document.getElementById('comSettingsPanel');
    const netPanel = document.getElementById('netSettingsPanel');
    const lptPanel = document.getElementById('lptSettingsPanel');

    // Settings inputs
    const windowsPrinterSelect = document.getElementById('windowsPrinterSelect');
    const scanWindowsBtn = document.getElementById('scanWindowsBtn');
    const usbSelect = document.getElementById('usbDeviceSelect');
    const usbPathInput = document.getElementById('usbDevicePath');
    const scanUsbBtn = document.getElementById('scanUsbBtn');
    const comPortInput = document.getElementById('comPort');
    const comBaudrateSelect = document.getElementById('comBaudrate');
    const netHostInput = document.getElementById('netHost');
    const netPortInput = document.getElementById('netPort');
    const lptPortSelect = document.getElementById('lptPort');

    // Receipt display elements
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userTier = document.getElementById('userTier');
    const activePrinterModel = document.getElementById('activePrinterModel');
    const activePrinterSetting = document.getElementById('activePrinterSetting');
    const hardwareStateText = document.getElementById('hardwareStateText');

    // Paper Receipt elements
    const paperReceipt = document.getElementById('paperReceipt');
    const rDate = document.getElementById('rDate');
    const rMemberId = document.getElementById('rMemberId');
    const rName = document.getElementById('rName');
    const rTier = document.getElementById('rTier');
    const rPoints = document.getElementById('rPoints');
    const rPetsList = document.getElementById('rPetsList');
    const rBarcodeText = document.getElementById('rBarcodeText');
    const rPetCategory = document.getElementById('rPetCategory');

    // Actions
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    const resetSessionBtn = document.getElementById('resetSessionBtn');

    // Audio context or synthesized sound effects for maximum retro immersion
    function playBeep(freq = 800, duration = 0.1) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'square'; // Square wave for standard 8-bit sound!
            oscillator.frequency.value = freq;
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
                audioCtx.close();
            }, duration * 1000);
        } catch (e) {
            // Audio context not allowed or failed
        }
    }

    // --------------------------------------------------
    // 1. Live Clock
    // --------------------------------------------------
    setInterval(() => {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        liveClock.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);

    // --------------------------------------------------
    // 2. Initialize Session & Generate QR Code
    // --------------------------------------------------
    async function initializeSession() {
        if (typeof stopWebcamStream === 'function') {
            stopWebcamStream();
        }
        sessionId = Math.random().toString(36).substring(2, 10);
        currentUser = null;

        // Reset screens & clean styles
        receiptScreen.classList.remove('active');
        idleScreen.classList.add('active');
        
        // Reset rolling paper wrapper
        const receiptWrapper = paperReceipt.parentElement;
        receiptWrapper.classList.remove('rolling-active');

        // Clear QR elements
        document.getElementById('qrcode').innerHTML = '';

        try {
            // Fetch Server LAN info
            const res = await fetch('/api/server-info');
            const info = await res.json();
            
            // Dynamically set hostUrl for mobile QR code scan
            let hostUrl;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
                hostUrl = `http://${info.ip}:${info.port}/mobile.html?sessionId=${sessionId}`;
            } else {
                hostUrl = `${window.location.origin}/mobile.html?sessionId=${sessionId}`;
            }
            
            // Set simulator quick link
            mobileSimLink.href = `/mobile.html?sessionId=${sessionId}`;

            // Generate QR Code on screen
            new QRCode(document.getElementById('qrcode'), {
                text: hostUrl,
                width: 180,
                height: 180,
                colorDark: '#252422', // Match retro charcoal
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });

            console.log(`Generated QR session link: ${hostUrl}`);

            // Initialize WebSocket
            connectWebSocket(info.ip, info.port);

        } catch (err) {
            console.error('Failed to initialize session:', err);
            showToast('Failed to connect to backend.', 'error');
        }
    }

    // --------------------------------------------------
    // 3. WebSocket Real-time Sync & Rolling Receipt
    // --------------------------------------------------
    function connectWebSocket(ip, port) {
        if (socket) {
            socket.close();
        }

        // Determine secure WebSocket protocol and domain based on how page is loaded
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let wsUrl;
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')) {
            wsUrl = `ws://${ip}:${port}/ws?role=kiosk&sessionId=${sessionId}`;
        } else {
            wsUrl = `${wsProtocol}//${window.location.host}/ws?role=kiosk&sessionId=${sessionId}`;
        }
        
        console.log(`Connecting WebSocket to: ${wsUrl}`);
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connection established.');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'user-connected' && data.user) {
                console.log('User synced via phone:', data.user);
                playBeep(900, 0.15); // play classic retro sync chime
                setTimeout(() => playBeep(1200, 0.15), 150);
                
                showToast(`SYNC SUCCESSFUL!`, 'success');
                displayReceipt(data.user);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
        };
    }

    // Display the receipt and transition screens with mechanic printer roll down
    function displayReceipt(user) {
        currentUser = user;

        // User info panel (left panel/quick header elements if they exist)
        if (userAvatar) userAvatar.src = user.petAvatar || 'images/pixel_poodle.png';
        if (userName) userName.textContent = user.name;
        if (userTier) userTier.textContent = user.tier;
        
        // Receipt details (formatting date dynamically to match image)
        const dateStr = new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        }).replace(/\//g, '-');
        
        const rNameEl = document.getElementById('rName');
        if (rNameEl) rNameEl.textContent = user.name || '---';

        const rDateEl = document.getElementById('rDate');
        if (rDateEl) rDateEl.textContent = dateStr;

        const rMemberIdEl = document.getElementById('rMemberId');
        if (rMemberIdEl) rMemberIdEl.textContent = user.displayId || user.id.substring(0, 6).toUpperCase();
        
        const rPetNameEl = document.getElementById('rPetName');
        if (rPetNameEl) rPetNameEl.textContent = user.petName || 'MOCHI';

        const rPetCategoryEl = document.getElementById('rPetCategory');
        if (rPetCategoryEl) rPetCategoryEl.textContent = (user.petCategory || 'Dog').toUpperCase();

        const rPetBreedEl = document.getElementById('rPetBreed');
        if (rPetBreedEl) rPetBreedEl.textContent = (user.petBreed || 'Poodle').toUpperCase();

        const rPetAvatarEl = document.getElementById('rPetAvatar');
        if (rPetAvatarEl) rPetAvatarEl.src = user.petAvatar || 'images/pixel_poodle.png';
        
        const rPointsEl = document.getElementById('rPoints');
        if (rPointsEl) rPointsEl.textContent = user.points || 0;

        const rPointsTodayEl = document.getElementById('rPointsToday');
        if (rPointsTodayEl) rPointsTodayEl.textContent = user.pointsDeposited || 0;

        const rTrackingDayEl = document.getElementById('rTrackingDay');
        if (rTrackingDayEl) rTrackingDayEl.textContent = `Day ${user.trackingDay || 1}`;
        
        // Render 8-day progress blocks (e.g. ■ ■ ■ ■ ■ □ □ □)
        const progressCount = user.progress || 0;
        let progressStr = '';
        for (let i = 0; i < 8; i++) {
            progressStr += i < progressCount ? '■ ' : '□ ';
        }
        const rProgressBlocksEl = document.getElementById('rProgressBlocks');
        if (rProgressBlocksEl) rProgressBlocksEl.textContent = progressStr.trim();
        
        const rStoolTypeEl = document.getElementById('rStoolType');
        if (rStoolTypeEl) rStoolTypeEl.textContent = user.stoolType || 'Type 4';

        const rStoolConditionEl = document.getElementById('rStoolCondition');
        if (rStoolConditionEl) rStoolConditionEl.textContent = user.condition || 'Healthy';

        // Clear and render receipt QR Code in yellow banner
        document.getElementById('receiptQr').innerHTML = '';
        new QRCode(document.getElementById('receiptQr'), {
            text: `https://petalife.com/member/${user.id}`,
            width: 54,
            height: 54,
            colorDark: '#252422',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });

        // Transition card
        idleScreen.classList.remove('active');
        receiptScreen.classList.add('active');

        // Reset paper rolling state
        const receiptWrapper = paperReceipt.parentElement;
        receiptWrapper.classList.remove('rolling-active');
        
        // Trigger print mechanical slot vibration (jitter)
        const printerMouthParent = document.getElementById('printerMouth').parentElement;
        printerMouthParent.classList.add('jittering');

        // Play continuous printer buzzing tone
        let buzzInterval = setInterval(() => {
            playBeep(180, 0.08); // Low square wave buzz sound!
        }, 100);

        // Force browser reflow to restart css rolling slide-down animation
        void receiptWrapper.offsetWidth;
        receiptWrapper.classList.add('rolling-active');

        // End printer mechanical vibration and buzz sound after 2.5 seconds
        setTimeout(() => {
            clearInterval(buzzInterval);
            printerMouthParent.classList.remove('jittering');
            playBeep(1000, 0.05); // High cut chime
        }, 2500);
    }

    // --------------------------------------------------
    // 4. Printer Control and Management
    // --------------------------------------------------
    async function updatePrinterStatus() {
        try {
            const res = await fetch(getApiRoot('/api/printer/status'));
            const data = await res.json();

            // Modal Status UI
            if (data.connected) {
                activePrinterSettings = data.settings;
                
                // Sync UI modal selector if setting is active
                if (data.settings) {
                    const val = data.settings;
                    if (val === 'BROWSER_PRINT') {
                        printerInterface.value = 'BROWSER';
                    } else if (val.startsWith('DRV,')) {
                        printerInterface.value = 'WINDOWS';
                        const prName = val.substring(4);
                        windowsPrinterSelect.innerHTML = '';
                        const opt = document.createElement('option');
                        opt.value = prName;
                        opt.textContent = prName;
                        windowsPrinterSelect.appendChild(opt);
                    } else if (val === 'MOCK_PRINTER_INTERFACE') {
                        printerInterface.value = 'MOCK';
                    } else if (val.startsWith('USB') || val.startsWith('\\\\')) {
                        printerInterface.value = 'USB';
                        usbPathInput.value = val;
                    } else if (val.startsWith('COM')) {
                        printerInterface.value = 'COM';
                        const parts = val.split(',');
                        comPortInput.value = parts[0] || 'COM1';
                        if (parts[1]) comBaudrateSelect.value = parts[1];
                    } else if (val.startsWith('NET,')) {
                        printerInterface.value = 'NET';
                        const host = val.substring(4);
                        netHostInput.value = host;
                    } else if (val.startsWith('LPT')) {
                        printerInterface.value = 'LPT';
                        lptPortSelect.value = val;
                    }
                    // Dispatch change event to toggle panels visibility
                    printerInterface.dispatchEvent(new Event('change'));
                }

                connectionStatusVal.textContent = data.isMock ? `MOCK PRINTER MODE (${data.status})` : `CONNECTED: ${data.status}`;
                connectionStatusVal.className = 'pixel-status-value connected';
                disconnectPrinterBtn.style.display = 'block';
                testPrintBtn.style.display = 'block';

                // Quick Status Pill in Header
                statusPillText.textContent = data.isMock ? 'MOCK READY' : 'ONLINE';
                statusPillIndicator.className = 'pixel-status-indicator green';

                // Kiosk active hardware block
                if (activePrinterSetting) activePrinterSetting.textContent = activePrinterSettings ? activePrinterSettings.toUpperCase().replace('_PRINT', '') : 'STANDARD';
                if (hardwareStateText) {
                    hardwareStateText.textContent = data.status.toUpperCase();
                    hardwareStateText.style.color = 'var(--pixel-accent)';
                }
            } else {
                connectionStatusVal.textContent = 'OFFLINE / DISCONNECTED';
                connectionStatusVal.className = 'pixel-status-value disconnected';
                disconnectPrinterBtn.style.display = 'none';
                testPrintBtn.style.display = 'none';

                statusPillText.textContent = 'PRINTER OFFLINE';
                statusPillIndicator.className = 'pixel-status-indicator red';

                if (activePrinterSetting) activePrinterSetting.textContent = 'NONE';
                if (hardwareStateText) {
                    hardwareStateText.textContent = 'OFFLINE';
                    hardwareStateText.style.color = 'var(--pixel-red)';
                }
            }
        } catch (err) {
            console.error('Error fetching printer status:', err);
        }
    }

    // Interface switch helper
    printerInterface.addEventListener('change', () => {
        if (windowsPanel) windowsPanel.style.display = 'none';
        usbPanel.style.display = 'none';
        comPanel.style.display = 'none';
        netPanel.style.display = 'none';
        lptPanel.style.display = 'none';

        const choice = printerInterface.value;
        if (choice === 'WINDOWS' && windowsPanel) windowsPanel.style.display = 'block';
        else if (choice === 'USB') usbPanel.style.display = 'block';
        else if (choice === 'COM') comPanel.style.display = 'block';
        else if (choice === 'NET') netPanel.style.display = 'block';
        else if (choice === 'LPT') lptPanel.style.display = 'block';
    });

    // Windows printer scan devices call
    if (scanWindowsBtn) {
        scanWindowsBtn.addEventListener('click', async () => {
            playBeep(700, 0.05);
            scanWindowsBtn.disabled = true;
            scanWindowsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
            
            try {
                const res = await fetch(getApiRoot('/api/printer/windows-list'));
                const data = await res.json();
                
                windowsPrinterSelect.innerHTML = '';
                if (data.printers && data.printers.length > 0) {
                    data.printers.forEach(printerStr => {
                        const opt = document.createElement('option');
                        opt.value = printerStr;
                        opt.textContent = printerStr;
                        windowsPrinterSelect.appendChild(opt);
                    });
                    showToast(`FOUND ${data.printers.length} PRINTERS`, 'success');
                } else {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'NO DEVICES FOUND. CLICK SCAN.';
                    windowsPrinterSelect.appendChild(opt);
                    showToast('NO WINDOWS PRINTERS DETECTED', 'info');
                }
            } catch (err) {
                console.error('Windows printer scan fail:', err);
                showToast('SCAN FAILED', 'error');
            } finally {
                scanWindowsBtn.disabled = false;
                scanWindowsBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> SCAN';
            }
        });
    }

    // USB scan devices call
    scanUsbBtn.addEventListener('click', async () => {
        playBeep(700, 0.05);
        scanUsbBtn.disabled = true;
        scanUsbBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
        
        try {
            const res = await fetch(getApiRoot('/api/printer/list'));
            const data = await res.json();
            
            usbSelect.innerHTML = '';
            if (data.printers && data.printers.length > 0) {
                data.printers.forEach(printerStr => {
                    const opt = document.createElement('option');
                    opt.value = printerStr;
                    opt.textContent = printerStr.toUpperCase();
                    usbSelect.appendChild(opt);
                });
                showToast(`FOUND ${data.printers.length} USB PRINTERS`, 'success');
            } else {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'NO DEVICES FOUND.';
                usbSelect.appendChild(opt);
                showToast('NO USB PRINTERS DETECTED', 'info');
            }
        } catch (err) {
            console.error('USB scan fail:', err);
            showToast('SCAN FAILED', 'error');
        } finally {
            scanUsbBtn.disabled = false;
            scanUsbBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> SCAN';
        }
    });

    // Connect form action
    connectPrinterBtn.addEventListener('click', async () => {
        playBeep(600, 0.05);
        const choice = printerInterface.value;
        let connectionString = '';

        if (choice === 'WINDOWS') {
            const selectedPrinter = windowsPrinterSelect.value;
            if (selectedPrinter) {
                connectionString = `DRV,${selectedPrinter}`;
            } else {
                connectionString = 'DRV,';
            }
        } else if (choice === 'USB') {
            const selectedUsb = usbSelect.value;
            const customPath = usbPathInput.value.trim();
            if (customPath) {
                connectionString = customPath;
            } else if (selectedUsb) {
                connectionString = selectedUsb.startsWith('USB,') ? selectedUsb : `USB,${selectedUsb}`;
            } else {
                connectionString = 'USB,';
            }
        } else if (choice === 'COM') {
            const port = comPortInput.value.trim();
            const baud = comBaudrateSelect.value;
            connectionString = `${port},${baud}`;
        } else if (choice === 'NET') {
            const host = netHostInput.value.trim();
            connectionString = `NET,${host}`;
        } else if (choice === 'LPT') {
            const port = lptPortSelect.value;
            connectionString = port;
        } else if (choice === 'MOCK') {
            connectionString = 'MOCK_PRINTER_INTERFACE';
        } else if (choice === 'BROWSER') {
            connectionString = 'BROWSER_PRINT';
        }

        connectPrinterBtn.disabled = true;
        connectPrinterBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

        try {
            const res = await fetch(getApiRoot('/api/printer/connect'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: connectionString })
            });
            const data = await res.json();

            if (data.success) {
                activePrinterSettings = connectionString;
                playBeep(1000, 0.1);
                setTimeout(() => playBeep(1200, 0.1), 100);
                showToast('PRINTER INSTALLED!', 'success');
                settingsModal.classList.remove('active');
            } else {
                playBeep(300, 0.35);
                showToast(data.message.toUpperCase(), 'error');
            }
        } catch (err) {
            console.error('Connect failed:', err);
            showToast('SERVICE ERROR', 'error');
        } finally {
            connectPrinterBtn.disabled = false;
            connectPrinterBtn.innerHTML = '<i class="fa-solid fa-plug"></i> CONNECT & SAVE';
            updatePrinterStatus();
        }
    });

    // Disconnect Action
    disconnectPrinterBtn.addEventListener('click', async () => {
        playBeep(400, 0.1);
        try {
            const res = await fetch(getApiRoot('/api/printer/disconnect'), { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                activePrinterSettings = null;
                showToast('PRINTER DISCONNECTED', 'info');
                updatePrinterStatus();
            }
        } catch (err) {
            console.error('Disconnect failed:', err);
        }
    });

    // Test print self page action
    testPrintBtn.addEventListener('click', async () => {
        playBeep(600, 0.05);
        if (activePrinterSettings === 'BROWSER_PRINT') {
            showToast('TEST PRINT VIA SYSTEM PRINT DIALOG', 'success');
            playBeep(1100, 0.1);
            window.print();
            return;
        }
        testPrintBtn.disabled = true;
        testPrintBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
        try {
            const res = await fetch(getApiRoot('/api/printer/selftest'), { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                playBeep(1100, 0.1);
                showToast('TEST PASS OK', 'success');
            } else {
                playBeep(300, 0.35);
                showToast('TEST FAIL', 'error');
            }
        } catch (err) {
            console.error('Self test call failed:', err);
            showToast('TEST FAIL', 'error');
        } finally {
            testPrintBtn.disabled = false;
            testPrintBtn.innerHTML = '<i class="fa-solid fa-file-invoice"></i> TEST PRINT';
        }
    });

    // --------------------------------------------------
    // 5. Print Receipt Card Action
    // --------------------------------------------------
    printReceiptBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        playBeep(700, 0.08);

        if (activePrinterSettings === 'BROWSER_PRINT') {
            showToast('OPENING SYSTEM PRINT DIALOG...', 'success');
            playBeep(1000, 0.1);
            setTimeout(() => playBeep(1300, 0.15), 100);
            window.print();
            return;
        }

        // Show mechanical printing strip overlay
        printOverlay.classList.add('active');

        // Synthesizer printer motor pitch shifts!
        let duration = 2400;
        let elapsed = 0;
        let synthBuzz = setInterval(() => {
            // Random mechanical variation in pitch for amazing 8-bit buzz
            let freq = 180 + Math.sin(elapsed / 100) * 15;
            playBeep(freq, 0.06);
            elapsed += 100;
        }, 100);

        setTimeout(async () => {
            clearInterval(synthBuzz);
            try {
                const res = await fetch(getApiRoot('/api/printer/print'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: currentUser })
                });
                const data = await res.json();

                if (data.success) {
                    playBeep(1000, 0.1);
                    setTimeout(() => playBeep(1300, 0.15), 100);
                    showToast('TICKET PRINT COMPLETE!', 'success');
                } else {
                    playBeep(300, 0.4);
                    showToast('HARDWARE ERROR', 'error');
                }
            } catch (err) {
                console.error('Printing call failed:', err);
                showToast('PRINT REQUEST FAIL', 'error');
            } finally {
                printOverlay.classList.remove('active');
            }
        }, duration);
    });

    // Reset Done Button click
    resetSessionBtn.addEventListener('click', () => {
        playBeep(500, 0.1);
        initializeSession();
    });

    // --------------------------------------------------
    // 6. Modal settings triggers
    // --------------------------------------------------
    openSettingsBtn.addEventListener('click', () => {
        playBeep(800, 0.05);
        settingsModal.classList.add('active');
        updatePrinterStatus().then(() => {
            printerInterface.dispatchEvent(new Event('change'));
        });
    });

    closeSettingsBtn.addEventListener('click', () => {
        playBeep(500, 0.05);
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            playBeep(500, 0.05);
            settingsModal.classList.remove('active');
        }
    });

    // --------------------------------------------------
    // 7. Toast Notifications
    // --------------------------------------------------
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `pixel-toast ${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        // Slide out and remove toast after 3.5s
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3500);
    }

    // --------------------------------------------------
    // 8. Global Barcode/QR Code Scanner Wedge Listener
    // --------------------------------------------------
    let scanBuffer = '';
    let lastKeyTime = Date.now();

    document.addEventListener('keypress', async (e) => {
        // Ignore keypress if typing in input/select fields (e.g. config modal)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            return;
        }

        const currentTime = Date.now();
        
        // Reset buffer if gap is too long (indicates separate manual typing sessions, e.g. > 1500ms)
        // Set to 1500ms so developers can easily test by typing "PL-5582-9018" at standard human speeds
        if (currentTime - lastKeyTime > 1500) {
            scanBuffer = '';
        }
        lastKeyTime = currentTime;

        if (e.key === 'Enter') {
            const rawScan = scanBuffer.trim();
            scanBuffer = ''; // Reset immediately
            
            if (rawScan.length > 0) {
                console.log(`Scan captured raw data: "${rawScan}"`);
                
                // Extract PetaLife Member ID (e.g. PL-5582-9018 or UUID format) using regex
                // This ensures it works for both the new UUID format and legacy ID formats
                const match = rawScan.match(/(PL-\d{4}-\d{4})|([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                if (match) {
                    const userId = match[0].toLowerCase(); // Convert to lowercase to match database keys
                    handleHardwareScan(userId);
                } else {
                    showToast('INVALID QR CODE FORMAT', 'error');
                    playBeep(250, 0.4); // Error sound
                }
            }
        } else {
            // Append printable character
            if (e.key && e.key.length === 1) {
                scanBuffer += e.key;
            }
        }
    });

    async function handleHardwareScan(userId) {
        // Only trigger when on the idle scan screen
        if (!idleScreen.classList.contains('active')) {
            return;
        }

        playBeep(950, 0.08); // Scan confirmation beep
        showToast('QR CARD SCANNED!', 'success');

        try {
            // Query the user profile from database
            const res = await fetch(`/api/users/profile?userId=${userId}`);
            
            if (res.status === 404) {
                showToast('MEMBER NOT FOUND IN AWS', 'error');
                playBeep(250, 0.4);
                return;
            }

            const user = await res.json();
            console.log('Scan synced user profile:', user);
            
            // Render receipt and roll down
            displayReceipt(user);

        } catch (err) {
            console.error('Scan fetch error:', err);
            showToast('DATABASE CONNECTION FAILED', 'error');
            playBeep(250, 0.4);
        }
    }

    // --------------------------------------------------
    // 9. Webcam Direct QR Scanner Controls
    // --------------------------------------------------
    const startWebcamBtn = document.getElementById('startWebcamBtn');
    const stopWebcamBtn = document.getElementById('stopWebcamBtn');
    const webcamScannerBlock = document.getElementById('webcamScannerBlock');

    startWebcamBtn.addEventListener('click', () => {
        playBeep(800, 0.05);
        webcamScannerBlock.style.display = 'flex';
        
        if (!html5QrScanner) {
            html5QrScanner = new Html5Qrcode("webcamPreview");
        }

        html5QrScanner.start(
            { facingMode: "user" }, // Use laptop front-facing camera
            {
                fps: 15,
                qrbox: (width, height) => {
                    const size = Math.min(width, height) * 0.7;
                    return { width: size, height: size };
                }
            },
            async (decodedText) => {
                const rawScan = decodedText.trim();
                console.log(`Webcam scanned QR: "${rawScan}"`);
                
                stopWebcamStream();

                const match = rawScan.match(/(PL-\d{4}-\d{4})|([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                if (match) {
                    const userId = match[0].toLowerCase();
                    handleHardwareScan(userId);
                } else {
                    showToast('INVALID QR CODE FORMAT', 'error');
                    playBeep(250, 0.4);
                }
            },
            () => {
                // suppress error logging for scanning attempts
            }
        ).catch(err => {
            console.error("Webcam scan init failed:", err);
            showToast("CAMERA PERMISSION DENIED OR NOT FOUND", "error");
            webcamScannerBlock.style.display = 'none';
        });
    });

    stopWebcamBtn.addEventListener('click', () => {
        playBeep(500, 0.05);
        stopWebcamStream();
    });

    function stopWebcamStream() {
        webcamScannerBlock.style.display = 'none';
        if (html5QrScanner && html5QrScanner.isScanning) {
            html5QrScanner.stop().catch(err => {
                console.error("Error stopping webcam scanner:", err);
            });
        }
    }

    // Bootstrap init
    initializeSession();
    updatePrinterStatus();
});
