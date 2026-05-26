
typedef void* (__cdecl* pFindPrinters)(const char* type, void (*callback)(char*));
typedef void* (__cdecl* pPrinterCreator)(void** handle, const char* model);
typedef int(__cdecl* pOpenPort)(void* handle, const char* setting);
typedef int(__cdecl* pClosePort)(void* handle);
typedef int(__cdecl* pReleasePrinter)(void* handle);
typedef int(__cdecl* pWriteData)(void* handle, unsigned char* buffer, size_t size);
typedef int(__cdecl* pReadData)(void* handle, unsigned char* buffer, unsigned int size);
typedef int(__cdecl* pCPCL_AddLabel)(void* handle, int offSet, int height, int qty);
typedef int(__cdecl* pCPCL_SetAlign)(void* handle, int align);
typedef int(__cdecl* pCPCL_AddText)(void* handle, int rotate, const char* fontType, int fontSize, int xPos, int yPos, const char* data);
typedef int(__cdecl* pCPCL_AddBarCode)(void* handle, int rotate, int type, int width, int ratio, int height, int xPos, int yPos, const char* data);
typedef int(__cdecl* pCPCL_AddBarCodeText)(void* handle, int enable, int fontType, int fontSize, int offset);
typedef int(__cdecl* pCPCL_AddQRCode)(void* handle, int rotate, int xPos, int yPos, int model, int unitWidth, int eccLevel, const char* data);
typedef int(__cdecl* pCPCL_AddPDF417)(void* handle, int rotate, int xPos, int yPos, int xDots, int yDots, int columns, int eccLevel, const char* data);
typedef int(__cdecl* pCPCL_AddBox)(void* handle, int xPos, int yPos, int endXPos, int endYPos, int thickness);
typedef int(__cdecl* pCPCL_AddLine)(void* handle, int xPos, int yPos, int endXPos, int endYPos, int thickness);
typedef int(__cdecl* pCPCL_AddImage)(void* handle, int rotate, int xPos, int yPos, const char* filePath);
typedef int(__cdecl* pCPCL_SetTextUnderline)(void* handle, int underline);
typedef int(__cdecl* pCPCL_Print)(void* handle);
typedef int(__cdecl* pCPCL_GetPrinterStatus)(void* handle, unsigned int* status);
typedef int(__cdecl* pCPCL_AddInverseLine)(void* handle, int x, int y, int xEnd, int yEnd, int width);
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
	pCPCL_AddLabel CPCL_AddLabel = NULL;
	pCPCL_SetAlign CPCL_SetAlign = NULL;
	pCPCL_AddText CPCL_AddText = NULL;
	pCPCL_AddBarCode CPCL_AddBarCode = NULL;
	pCPCL_AddBarCodeText CPCL_AddBarCodeText = NULL;
	pCPCL_AddQRCode CPCL_AddQRCode = NULL;
	pCPCL_AddPDF417 CPCL_AddPDF417 = NULL;
	pCPCL_AddBox CPCL_AddBox = NULL;
	pCPCL_AddLine CPCL_AddLine = NULL;
	pCPCL_AddImage CPCL_AddImage = NULL;
	pCPCL_SetTextUnderline CPCL_SetTextUnderline = NULL;
	pCPCL_Print CPCL_Print = NULL;
	pCPCL_GetPrinterStatus CPCL_GetPrinterStatus = NULL;
	pCPCL_AddInverseLine CPCL_AddInverseLine = NULL;
	void loadDll();
	void GetStatus(void* dlg);
	void PrintSample();
	void PrintQRCode();
	void PrintBarcode();
	void PrintImage(char* path);

private:
	HINSTANCE hDllInst;

};

