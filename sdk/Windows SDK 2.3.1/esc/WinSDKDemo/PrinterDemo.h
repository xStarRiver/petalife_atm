#pragma once

typedef void* (__cdecl* pFindPrinters)(const char* type, void (*callback)(char*));
typedef void* (__cdecl* pPrinterCreator)(void** handle, const char* model);
typedef int(__cdecl* pOpenPort)(void* handle, const char* setting);
typedef int(__cdecl* pClosePort)(void* handle);
typedef int(__cdecl* pReleasePrinter)(void* handle);
typedef int(__cdecl* pWriteData)(void* handle, unsigned char* buffer, size_t size);
typedef int(__cdecl* pReadData)(void* handle, unsigned char* buffer, unsigned int size);
typedef int(__cdecl* pPrinterInitialize)(void* handle);
typedef int(__cdecl* pPrintTextS)(void* hPrinter, const char* data);
typedef int(__cdecl* pPrintAndFeedLine)(void* hPrinter);
typedef int(__cdecl* pPrintBarCode)(void* hPrinter, int bcType, const char* data, int width, int height, int alignment, int hriPosition);
typedef int(__cdecl* pCutPaperWithDistance)(void* hPrinter, int distance);
typedef int(__cdecl* pPrintSymbol)(void* hPrinter, int type, const char* data, int errLevel, int width, int height, int alignment);
typedef int(__cdecl* pSetRelativeHorizontal)(void* hPrinter, int position);
typedef int(__cdecl* pGetPrinterState)(void* hPrinter, unsigned int* printerStatus);
typedef int(__cdecl* pOpenCashDrawer)(void* hPrinter, int pinMode, int onTime, int ofTime);
typedef int(__cdecl* pPrintImage)(void* hPrinter, const char* imagePath, int scaleMode);
typedef int(__cdecl* pSetAlign)(void* hPrinter, int align);
typedef int(__cdecl* pSetTextBold)(void* hPrinter, int bold);
typedef int(__cdecl* pSetTextFont)(void* hPrinter, int font);

class PrinterDemo
{
public:
	void* printer;
	pPrinterCreator PrinterCreator = NULL;
	pFindPrinters FindPrinters = NULL;
	pOpenPort OpenPort = NULL;
	pClosePort ClosePort = NULL;
	pReleasePrinter ReleasePrinter = NULL;
	pWriteData WriteData = NULL;
	pReadData ReadData = NULL;
	pPrinterInitialize PrinterInitialize = NULL;
	pPrintTextS PrintTextS = NULL;
	pPrintAndFeedLine PrintAndFeedLine = NULL;
	pPrintBarCode PrintBarCode = NULL;
	pCutPaperWithDistance CutPaperWithDistance = NULL;
	pPrintSymbol PrintSymbol = NULL;
	pSetRelativeHorizontal SetRelativeHorizontal = NULL;
	pGetPrinterState GetPrinterState = NULL;
	pOpenCashDrawer OpenCashDrawer = NULL;
	pPrintImage PrintImageS = NULL;
	pSetAlign SetAlign = NULL;
	pSetTextBold SetTextBold = NULL;
	pSetTextFont SetTextFont = NULL;
	void loadDll();
	void GetStatus(void* dlg);
	void PrintSample();
	void PrintQRCode();
	void PrintBarcode();
	void PrintImage(char* path);

private:
	HINSTANCE hDllInst;

};

