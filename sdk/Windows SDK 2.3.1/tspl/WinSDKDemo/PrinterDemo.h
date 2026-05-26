#pragma once

typedef void* (__cdecl* pFindPrinters)(const char* type, void (*callback)(char*));
typedef void* (__cdecl* pPrinterCreator)(void** handle, const char* model);
typedef int(__cdecl* pOpenPort)(void* handle, const char* setting);
typedef int(__cdecl* pClosePort)(void* handle);
typedef int(__cdecl* pReleasePrinter)(void* handle);
typedef int(__cdecl* pWriteData)(void* handle, unsigned char* buffer, size_t size);
typedef int(__cdecl* pReadData)(void* handle, unsigned char* buffer, unsigned int size);
typedef int(__cdecl* pTSPL_Text)(void* handle, int x, int y, const char* fontName, const char* content, int rotation, int x_multiplication, int y_multiplication, int alignment);
typedef int(__cdecl* pTSPL_Print)(void* handle, int num, int copies);
typedef int(__cdecl* pTSPL_Bar)(void* handle, int x, int y, int width, int height);
typedef int(__cdecl* pTSPL_BarCode)(void* handle, int x, int y, int type, const char* content, int height, int showText, int rotation, int narrow, int wide);
typedef int(__cdecl* pTSPL_Image)(void* handle, int x, int y, int mode, const char* imgPathW);
typedef int(__cdecl* pTSPL_Setup)(void* handle, int printSpeed, int printDensity, int labelWidth, int labelHeight, int labelType, int gapHight, int offset);
typedef int(__cdecl* pTSPL_Direction)(void* hPrinter, int direction, int mirror);
typedef int(__cdecl* pTSPL_ClearBuffer)(void* handle);
typedef int(__cdecl* pTSPL_Box)(void* handle, int x, int y, int x_end, int y_end, int thickness, int radius);
typedef int(__cdecl* pTSPL_QrCode)(void* handle, int x, int y, int width, int eccLevel, int mode, int rotate, int model, int mask, const char* data);
typedef int(__cdecl* pTSPL_Home)(void* handle);
typedef int(__cdecl* pTSPL_GetPrinterStatus)(void* handle, unsigned int* status);
typedef int(__cdecl* pTSPL_PDF417)(void* handle, int x, int y, int width, int height, int rotate, const char* option, const char* data);
typedef int(__cdecl* pTSPL_Block)(void* handle, int x, int y, int width, int height, const char* fontName, const char* content, int rotation, int x_multiplication, int y_multiplication, int alignment);
typedef int(__cdecl* pTSPL_Dmatrix)(void* handle, int x, int y, int width, int height, const char* content, int blockSize, int row, int col);

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
	pTSPL_Text TSPL_Text = NULL;
	pTSPL_Direction TSPL_Direction = NULL;
	pTSPL_Print TSPL_Print = NULL;
	pTSPL_Bar TSPL_Bar = NULL;
	pTSPL_BarCode TSPL_BarCode = NULL;
	pTSPL_Image TSPL_Image = NULL;
	pTSPL_Setup TSPL_Setup = NULL;
	pTSPL_ClearBuffer TSPL_ClearBuffer = NULL;
	pTSPL_Box TSPL_Box = NULL;
	pTSPL_QrCode TSPL_QrCode = NULL;
	pTSPL_Home TSPL_Home = NULL;
	pTSPL_GetPrinterStatus TSPL_GetPrinterStatus = NULL;
	pTSPL_PDF417 TSPL_PDF417 = NULL;
	pTSPL_Block TSPL_Block = NULL;
	pTSPL_Dmatrix TSPL_Dmatrix = NULL;
	void loadDll();
	void GetStatus(void* dlg);
	void PrintSample();
	void PrintQRCode();
	void PrintBarcode();
	void PrintImage(char* path);

private:
	HINSTANCE hDllInst;

};

