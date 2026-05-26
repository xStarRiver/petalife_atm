
typedef void* (__cdecl* pFindPrinters)(const char* type, void (*callback)(char*));
typedef void* (__cdecl* pPrinterCreator)(void** handle, const char* model);
typedef int(__cdecl* pOpenPort)(void* handle, const char* setting);
typedef int(__cdecl* pClosePort)(void* handle);
typedef int(__cdecl* pReleasePrinter)(void* handle);
typedef int(__cdecl* pWriteData)(void* handle, unsigned char* buffer, size_t size);
typedef int(__cdecl* pReadData)(void* handle, unsigned char* buffer, unsigned int size);
typedef int(__cdecl* pZPL_StartFormat)(void* handle);
typedef int(__cdecl* pZPL_EndFormat)(void* handle);
typedef int(__cdecl* pZPL_Text)(void* handle, int xPos, int yPos, int fontNum, int orientation, int fontWidth, int fontHeight, const char* text);
typedef int(__cdecl* pZPL_BarCode128)(void* handle, int xPos, int yPos, int orientation, int moduleWidth, int codeHeight, char line, char lineAboveCode, char checkDigit, char mode, const char* text);
typedef int(__cdecl* pZPL_QRCode)(void* handle, int xPos, int yPos, int orientation, int model, int dpi, char eccLevel, char input, char charMode, const char* text);
typedef int(__cdecl* pZPL_GraphicBox)(void* handle, int xPos, int yPos, int width, int height, int thickness, int rounding);
typedef int(__cdecl* pZPL_PrintImage)(void* handle, int xPos, int yPos, const char* imgName);
typedef int(__cdecl* pZPL_DataMatrixBarcode)(void* handle, int xPos, int yPos, int orientation, int codeHeight, int level, int columns, int rows, int formatId, int aspectRatio, const char* text);
typedef int(__cdecl* pZPL_Text_Block)(void* handle, int xPos, int yPos, int fontNum, int orientation, int fontWidth, int fontHeight, int textblockWidth, int textblockHeight, const char* text);
typedef int(__cdecl* pZPL_GetPrinterStatus)(void* handle, unsigned int* status);
typedef int(__cdecl* pZPL_PrintConfigurationLabel)(void* handle);
typedef int(__cdecl* pZPL_Pdf417)(void* handle, int xPos, int yPos, int orientation, int moduleWidth, int codeHeight, int securityLevel, int columns, int rows, char truncate, const char* text);
//int FindPrinters(const char* type, void (*callback)(char*));
#pragma once
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
	pZPL_StartFormat ZPL_StartFormat = NULL;
	pZPL_EndFormat ZPL_EndFormat = NULL;
	pZPL_Text ZPL_Text = NULL;
	pZPL_BarCode128 ZPL_BarCode128 = NULL;
	pZPL_QRCode ZPL_QRCode = NULL;
	pZPL_GraphicBox ZPL_GraphicBox = NULL;
	pZPL_PrintImage ZPL_PrintImage = NULL;
	pZPL_DataMatrixBarcode ZPL_DataMatrixBarcode = NULL;
	pZPL_Text_Block ZPL_Text_Block = NULL;
	pZPL_GetPrinterStatus ZPL_GetPrinterStatus = NULL;
	pZPL_PrintConfigurationLabel ZPL_PrintConfigurationLabel = NULL;
	pZPL_Pdf417 ZPL_Pdf417 = NULL;
	void loadDll();
	void GetStatus(void* dlg);
	void PrintSample();
	void PrintQRCode();
	void PrintBarcode();
	void PrintImage(char* path);

private:
	HINSTANCE hDllInst;

};

