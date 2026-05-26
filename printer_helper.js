const koffi = require('koffi');
const path = require('path');

let lib = null;
let isMock = false;
let printerHandle = null;

// DLL functions
let PrinterCreator = null;
let OpenPortA = null;
let ClosePort = null;
let ReleasePrinter = null;
let PrinterInitialize = null;
let PrintTextS = null;
let PrintAndFeedLine = null;
let PrintBarCode = null;
let PrintSymbol = null;
let CutPaperWithDistance = null;
let GetPrinterState = null;
let FindPrinters = null;
let SetAlign = null;
let SetTextBold = null;
let PrintSelfTest = null;

// Resolve path to the x64 DLL
const dllPath = path.join(__dirname, 'sdk', 'Windows SDK 2.3.1', 'esc', 'lib', 'x64', 'printer.sdk.dll');

// Register FindPrinters callback prototype
const FindCallback = koffi.proto('void FindCallback(const char *device)');

try {
    console.log('Loading printer.sdk.dll...');
    lib = koffi.load(dllPath);

    // Bind basic library functions
    PrinterCreator = lib.func('int PrinterCreator(void *handle, const char *model)');
    OpenPortA = lib.func('int OpenPortA(void *handle, const char *setting)');
    ClosePort = lib.func('int ClosePort(void *handle)');
    ReleasePrinter = lib.func('int ReleasePrinter(void *handle)');
    
    // Bind ESC commands
    PrinterInitialize = lib.func('int PrinterInitialize(void *hPrinter)');
    PrintTextS = lib.func('int PrintTextS(void *hPrinter, const char *data)');
    PrintAndFeedLine = lib.func('int PrintAndFeedLine(void *hPrinter)');
    PrintBarCode = lib.func('int PrintBarCode(void *hPrinter, int bcType, const char *data, int width, int height, int alignment, int hriPosition)');
    PrintSymbol = lib.func('int PrintSymbol(void *hPrinter, int type, const char *data, int errLevel, int width, int height, int alignment)');
    CutPaperWithDistance = lib.func('int CutPaperWithDistance(void *hPrinter, int distance)');
    GetPrinterState = lib.func('int GetPrinterState(void *hPrinter, uint32_t *printerStatus)');
    FindPrinters = lib.func('int FindPrinters(const char *type, FindCallback *callback)');
    SetAlign = lib.func('int SetAlign(void *hPrinter, int align)');
    SetTextBold = lib.func('int SetTextBold(void *hPrinter, int bold)');
    PrintSelfTest = lib.func('int PrintSelfTest(void *hPrinter)');

    console.log('Printer SDK DLL loaded and functions bound successfully.');
} catch (err) {
    console.warn('\n======================================================');
    console.warn('WARNING: Failed to load printer.sdk.dll.');
    console.warn('The application will run in MOCK PRINTER MODE.');
    console.warn('Reason:', err.message);
    console.warn('======================================================\n');
    isMock = true;
}

// Keep track of active connection info
let activeSettings = null;

// Find USB Printers (using callback)
function listPrinters() {
    if (isMock) {
        return ['MOCK_USB_PRINTER_01', 'MOCK_USB_PRINTER_02'];
    }

    return new Promise((resolve) => {
        const devices = [];
        try {
            const cb = koffi.register((device) => {
                devices.push(device);
            }, 'FindCallback *');

            FindPrinters("USB,", cb);

            // Give it 1 second to gather devices
            setTimeout(() => {
                koffi.unregister(cb);
                resolve(devices);
            }, 1000);
        } catch (err) {
            console.error('Error finding printers:', err);
            resolve([]);
        }
    });
}

// Connect to printer
function connectPrinter(settings) {
    if (settings === 'MOCK_PRINTER_INTERFACE' || (typeof settings === 'string' && settings.toUpperCase().includes('MOCK'))) {
        isMock = true;
        activeSettings = settings;
        console.log(`[Mock Printer] Connected using settings: ${settings}`);
        return { success: true, message: `Connected to Mock Printer (${settings})` };
    } else {
        // Only allow switching to hardware mode if DLL is loaded
        if (lib !== null) {
            isMock = false;
        } else {
            return { success: false, message: 'Cannot connect to hardware printer: printer.sdk.dll failed to load.' };
        }
    }

    try {
        // Release old handle if exists
        if (printerHandle) {
            try {
                ReleasePrinter(printerHandle);
            } catch (e) {}
            printerHandle = null;
        }

        // Create new handle
        const handleBuf = Buffer.alloc(8);
        let ret = PrinterCreator(handleBuf, "");
        if (ret !== 0) {
            return { success: false, message: `PrinterCreator failed with code ${ret}` };
        }

        const handle = handleBuf.readBigInt64LE(0);
        if (handle === 0n) {
            return { success: false, message: 'PrinterCreator returned null handle' };
        }

        console.log(`Opening printer port with settings: "${settings}"...`);
        let openRet = OpenPortA(handle, settings);
        if (openRet !== 0) {
            ReleasePrinter(handle);
            return { success: false, message: `OpenPortA failed with code ${openRet}` };
        }

        printerHandle = handle;
        activeSettings = settings;
        console.log(`Printer connected successfully! Handle: 0x${handle.toString(16)}`);
        return { success: true, message: 'Printer connected successfully.' };
    } catch (err) {
        console.error('Error connecting to printer:', err);
        return { success: false, message: err.message };
    }
}

// Disconnect printer
function disconnectPrinter() {
    if (isMock) {
        activeSettings = null;
        console.log('[Mock Printer] Disconnected.');
        isMock = (lib === null);
        return { success: true };
    }

    if (!printerHandle) {
        return { success: true, message: 'No printer connected.' };
    }

    try {
        console.log('Closing port and releasing printer handle...');
        ClosePort(printerHandle);
        ReleasePrinter(printerHandle);
        printerHandle = null;
        activeSettings = null;
        isMock = (lib === null);
        return { success: true };
    } catch (err) {
        console.error('Error disconnecting printer:', err);
        return { success: false, message: err.message };
    }
}

// Get Printer Status
function getStatus() {
    if (isMock) {
        return { 
            connected: activeSettings !== null, 
            status: activeSettings ? 'Ready' : 'Disconnected', 
            code: 0x12,
            isMock: true 
        };
    }

    if (!printerHandle) {
        return { connected: false, status: 'Not Connected', code: -1 };
    }

    try {
        const statusBuf = Buffer.alloc(4);
        let ret = GetPrinterState(printerHandle, statusBuf);
        if (ret !== 0) {
            return { connected: true, status: `Status Error (Code: ${ret})`, code: ret };
        }

        const status = statusBuf.readUInt32LE(0);
        
        // Parse status byte
        if (status === 0x12) {
            return { connected: true, status: 'Ready', code: status };
        }

        let errors = [];
        if (status & 0x04) errors.push('Cover opened');
        if (status & 0x08) errors.push('Feed button pressed');
        if (status & 0x20) errors.push('Out of paper');
        if (status & 0x40) errors.push('Error condition');

        const statusStr = errors.length > 0 ? errors.join(', ') : `Unknown Status (${status})`;
        return { connected: true, status: statusStr, code: status };
    } catch (err) {
        console.error('Error getting printer status:', err);
        return { connected: false, status: `Error: ${err.message}`, code: -2 };
    }
}

// Print Receipt
function printReceipt(user) {
    const now = new Date();
    const dateStr = now.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    }).replace(/\//g, '-');

    const progressCount = user.progress || 0;
    let progressStrMock = '';
    let progressStrHW = '';
    for (let i = 0; i < 8; i++) {
        progressStrMock += i < progressCount ? '■ ' : '□ ';
        progressStrHW += i < progressCount ? '[X]' : '[ ]';
    }
    progressStrMock = progressStrMock.trim();

    const displayId = user.displayId || (user.id ? user.id.substring(0, 6).toUpperCase() : '------');
    const petName = user.petName || 'Mochi';
    const petCategory = user.petCategory || 'Dog';
    const petBreed = user.petBreed || 'Poodle';
    const points = user.points || 0;
    const pointsToday = user.pointsDeposited || 0;
    const trackingDay = user.trackingDay || 1;
    const stoolType = user.stoolType || 'Type 4';
    const condition = user.condition || 'Healthy';

    if (isMock) {
        console.log('\n=================== MOCK PRINT RECEIPT ===================');
        console.log('            便便銀行 | POOP BANK');
        console.log('              DEPOSIT RECEIPT');
        console.log('--------------------------------------------------');
        console.log(`User ID   : ${displayId}`);
        console.log(`Pet Name  : ${petName}`);
        console.log(`Category  : ${petCategory.toUpperCase()}`);
        console.log(`Breed     : ${petBreed.toUpperCase()}`);
        console.log(`Date      : ${dateStr}`);
        console.log('--------------------------------------------------');
        console.log('🐾 ACCOUNT SUMMARY');
        console.log(`P-Coins   : ${points} P-Coins`);
        console.log(`Today     : +${pointsToday} P-Coins deposited today`);
        console.log(`Tracking  : Day ${trackingDay}`);
        console.log(`Progress  : ${progressStrMock}`);
        console.log('--------------------------------------------------');
        console.log('🐾 DEPOSIT DETAILS');
        console.log(`Stool Type: ${stoolType}`);
        console.log(`Condition : ${condition}`);
        console.log('--------------------------------------------------');
        console.log(`BARCODE   : [${user.id}]`);
        console.log(`QR CODE   : [https://petalife.com/member/${user.id}]`);
        console.log('==========================================================\n');
        return { success: true, message: 'Printed receipt to mock console successfully.' };
    }

    if (!printerHandle) {
        return { success: false, message: 'Printer not connected. Please open the settings panel and connect.' };
    }

    try {
        console.log(`Printing receipt for pet: ${petName}...`);
        
        // Initialize
        PrinterInitialize(printerHandle);
        
        // Header
        SetAlign(printerHandle, 1); // Center
        SetTextBold(printerHandle, 1);
        PrintTextS(printerHandle, "PETALIFE POOP BANK\n");
        PrintTextS(printerHandle, "便便銀行 | POOP BANK\n");
        PrintTextS(printerHandle, "DEPOSIT RECEIPT\n");
        PrintTextS(printerHandle, "================================\n");
        SetTextBold(printerHandle, 0);

        // Meta Info
        SetAlign(printerHandle, 0); // Left
        PrintTextS(printerHandle, `User ID   : ${displayId}\n`);
        PrintTextS(printerHandle, `Pet Name  : ${petName}\n`);
        PrintTextS(printerHandle, `Category  : ${petCategory.toUpperCase()}\n`);
        PrintTextS(printerHandle, `Breed     : ${petBreed.toUpperCase()}\n`);
        PrintTextS(printerHandle, `Date      : ${dateStr}\n`);
        PrintTextS(printerHandle, "--------------------------------\n");

        // Account Summary
        PrintTextS(printerHandle, "🐾 ACCOUNT SUMMARY\n");
        PrintTextS(printerHandle, `P-Coins   : ${points} P-Coins\n`);
        PrintTextS(printerHandle, `Today     : +${pointsToday} P-Coins deposited\n`);
        PrintTextS(printerHandle, `Tracking  : Day ${trackingDay}\n`);
        PrintTextS(printerHandle, `Progress  : ${progressStrHW}\n`);
        PrintTextS(printerHandle, "--------------------------------\n");

        // Deposit Details
        PrintTextS(printerHandle, "🐾 DEPOSIT DETAILS\n");
        PrintTextS(printerHandle, `Stool Type: ${stoolType}\n`);
        PrintTextS(printerHandle, `Condition : ${condition}\n`);
        PrintTextS(printerHandle, "--------------------------------\n");

        // Footer Thank you
        SetAlign(printerHandle, 1); // Center
        PrintTextS(printerHandle, "Thank you for using PetaLife!\n\n");

        // Print Barcode (using CODE128 - type 73)
        console.log(`Printing barcode for user: ${user.id}`);
        PrintBarCode(printerHandle, 73, user.id, 2, 80, 1, 2);
        
        PrintAndFeedLine(printerHandle);
        PrintAndFeedLine(printerHandle);

        // Print QR Code Symbol (type 49, errLevel 48, width 8, height 8, center 1)
        console.log(`Printing QR code for member link`);
        PrintSymbol(printerHandle, 49, `https://petalife.com/member/${user.id}`, 48, 8, 8, 1);

        // Feed & Cut
        PrintAndFeedLine(printerHandle);
        PrintAndFeedLine(printerHandle);
        CutPaperWithDistance(printerHandle, 10);

        console.log('Receipt printed successfully.');
        return { success: true, message: 'Receipt printed successfully.' };
    } catch (err) {
        console.error('Error printing receipt:', err);
        return { success: false, message: `Print Error: ${err.message}` };
    }
}

// Print Self Test Page
function printSelfTest() {
    if (isMock) {
        console.log('\n=================== MOCK SELF TEST ===================');
        console.log('[Mock Printer] Printing Self-Test Configuration Page');
        console.log('======================================================\n');
        return { success: true, message: 'Printed self-test on mock console.' };
    }

    if (!printerHandle) {
        return { success: false, message: 'Printer not connected. Please open the settings panel and connect.' };
    }

    try {
        console.log('Printing printer self test...');
        PrintSelfTest(printerHandle);
        return { success: true, message: 'Self-test printed successfully.' };
    } catch (err) {
        console.error('Error printing self-test:', err);
        return { success: false, message: `Self-Test Print Error: ${err.message}` };
    }
}

module.exports = {
    isMock,
    listPrinters,
    connect: connectPrinter,
    disconnect: disconnectPrinter,
    getStatus,
    printReceipt,
    printSelfTest
};
