#pragma once
#include "printersdk.h"

PRINTER_API int CALL_STACK TSPL_Bar(void* hPrinter, int x, int y, int width, int height);
PRINTER_API int CALL_STACK TSPL_BarCode(void* hPrinter, int x, int y, int type,
    const char* content, int height,
    int showText = 0,
    int rotation = 0,
    int narrow = 2,
    int wide = 2);
PRINTER_API int CALL_STACK TSPL_BitMap(void* hPrinter, int x, int y, int width, int height, int mode, unsigned char* data);
PRINTER_API int CALL_STACK TSPL_ImageW(void* hPrinter, int x, int y, int mode, const wchar_t* imgPathW);
PRINTER_API int CALL_STACK TSPL_Image(void* hPrinter, int x, int y, int mode, const char* imgPath);
PRINTER_API int CALL_STACK TSPL_Block(void* hPrinter, int x, int y, int width, int height,
    const char* fontName,
    const char* content,
    int rotation = 0,
    int x_multiplication = 1,
    int y_multiplication = 1,
    int alignment = 0
);
PRINTER_API int CALL_STACK TSPL_Box(void* hPrinter, int x, int y, int x_end, int y_end, int thickness = 1, int radius = 0);
PRINTER_API int CALL_STACK TSPL_Diagonal(void* hPrinter, int x1, int y1, int x2, int y2, int thickness = 1);
PRINTER_API int CALL_STACK TSPL_Direction(void* hPrinter, int direction, int mirror);
PRINTER_API int CALL_STACK TSPL_Dmatrix(void* hPrinter, int x, int y, int width, int height,
    const char* content,
    int blockSize = 0,
    int row = 10,
    int col = 10
);
PRINTER_API int CALL_STACK TSPL_Feed(void* hPrinter, int n);
PRINTER_API int CALL_STACK TSPL_FormFeed(void* hPrinter);
PRINTER_API int CALL_STACK TSPL_GapDetect(void* hPrinter, int x = 0, int y = 0);
PRINTER_API int CALL_STACK TSPL_GetPrinterStatus(void* hPrinter, unsigned int* printerStatus);
PRINTER_API int CALL_STACK TSPL_GetSN(void* hPrinter, char* snBuffer, int bufSize);
PRINTER_API int CALL_STACK TSPL_Home(void* hPrinter);
PRINTER_API int CALL_STACK TSPL_Learn(void* hPrinter);
PRINTER_API int CALL_STACK TSPL_Offset(void* hPrinter, int distance);
PRINTER_API int CALL_STACK TSPL_PDF417(
    void* hPrinter,
    int x,
    int y,
    int width,
    int height,
    int rotate, const char* option, const char* data
);
PRINTER_API int CALL_STACK TSPL_Print(void* hPrinter, int num, int copies);
PRINTER_API int CALL_STACK TSPL_QrCode(
    void* hPrinter,
    int x,
    int y,
    int width,
    int eccLevel,
    int mode,
    int rotate,
    int model,
    int mask,
    const char* data
);
PRINTER_API int CALL_STACK TSPL_Reverse(
    void* hPrinter,
    int x,
    int y,
    int width,
    int height
);
PRINTER_API int CALL_STACK TSPL_SelfTest(void* hPrinter);
PRINTER_API int CALL_STACK TSPL_SetCodePage(void* hPrinter, const char* codepage);
PRINTER_API int CALL_STACK TSPL_SetCutter(void* hPrinter, int pieces);
PRINTER_API int CALL_STACK TSPL_SetRibbon(void* hPrinter, int mode);
PRINTER_API int CALL_STACK TSPL_SetTear(void* hPrinter, int mode);
PRINTER_API int CALL_STACK TSPL_Text(void* hPrinter, int x, int y,
    const char* fontName,
    const char* content,
    int rotation = 0,
    int x_multiplication = 1,
    int y_multiplication = 1,
    int alignment = 0
);
PRINTER_API int CALL_STACK TSPL_Setup(
    void* hPrinter,
    int printSpeed,
    int printDensity,
    int labelWidth,
    int labelHeight,
    int labelType,
    int gapHeight,
    int offset
);
PRINTER_API int CALL_STACK TSPL_ClearBuffer(void* hPrinter);
PRINTER_API int CALL_STACK TSPL_GetRibbonState(void* hPrinter, int* mode);
PRINTER_API int CALL_STACK TSPL_SetSendID(void* hPrinter, char* id);

// =========================================
// [ GPIO ]
// =========================================
#define MAX_GPIO_TIME_MS	32000

enum GPO_NUMBER { GPO1 = 1, GPO2, GPO3, GPO4, GPO5, GPO6, GPO7 };
enum GPI_NUMBER { GPI1 = 1, GPI2, GPI3, GPI4 };

enum GPIO_SIGNAL_STATE {
    GPSS_LOW,
    GPSS_HIGH,
    GPSS_NEG,
    GPSS_POS
};

enum GPO_FUNCTION_CONDITION {
    GOFC_FAULT,
    GOFC_FAULT_RIBBON,
    GOFC_FAULT_PAPER,
    GOFC_FAULT_CARRIAGE,
    GOFC_FAULT_MEMORY,
    GOFC_FAULT_CUTTER,
    GOFC_FAULT_OVERHEAT,
    GOFC_PAUSE,
    GOFC_TAKELABEL,
    GOFC_IDLE,
    GOFC_PRINT
};

enum GPI_FUNCTION_CONTROL {
    GIFC_PAUSE,
    GIFC_PAUSE_ON,
    GIFC_PAUSE_OFF,
    GIFC_PRINT,
    GIFC_CUT,
    GIFC_FEED,
    GIFC_BACKFEED,
    GIFC_FORMFEED,
    GIFC_BACKLABEL
};

PRINTER_API int CALL_STACK TSPL_SetGPO(
    void* hPrinter,
    int gpo_number,
    int state,
    int Delay0_ms,
    int Pulse0_ms,
    int Delay1_ms,
    int Pulse1_ms,
    int gpo_fc
);

PRINTER_API int CALL_STACK TSPL_SetGPI(
    void* hPrinter,
    int gpi_number,
    int state,
    int Pulse_ms,
    int gpi_fc,
    int n
);
PRINTER_API int CALL_STACK TSPL_SetBlineSensor(void* hPrinter, int isOpen);
