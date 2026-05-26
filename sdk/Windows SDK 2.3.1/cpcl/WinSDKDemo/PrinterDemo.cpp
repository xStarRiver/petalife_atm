#include "pch.h"
#include "PrinterDemo.h"
#include "WinSDKDemoDlg.h"

void PrinterDemo::loadDll()
{
	hDllInst = ::LoadLibrary(_T("printer.sdk.dll"));
	if (hDllInst)
	{
		FindPrinters = (pFindPrinters)GetProcAddress(hDllInst, "FindPrinters");
		PrinterCreator = (pPrinterCreator)GetProcAddress(hDllInst, "PrinterCreator");
		OpenPort = (pOpenPort)GetProcAddress(hDllInst, "OpenPortA");
		ClosePort = (pClosePort)GetProcAddress(hDllInst, "ClosePort");
		ReleasePrinter = (pReleasePrinter)GetProcAddress(hDllInst, "ReleasePrinter");
		WriteData = (pWriteData)GetProcAddress(hDllInst, "WriteData");
		ReadData = (pReadData)GetProcAddress(hDllInst, "ReadData");
		CPCL_AddLabel = (pCPCL_AddLabel)GetProcAddress(hDllInst, "CPCL_AddLabel");
		CPCL_SetAlign = (pCPCL_SetAlign)GetProcAddress(hDllInst, "CPCL_SetAlign");
		CPCL_AddText = (pCPCL_AddText)GetProcAddress(hDllInst, "CPCL_AddText");
		CPCL_AddBarCode = (pCPCL_AddBarCode)GetProcAddress(hDllInst, "CPCL_AddBarCode");
		CPCL_AddBarCodeText = (pCPCL_AddBarCodeText)GetProcAddress(hDllInst, "CPCL_AddBarCodeText");
		CPCL_AddQRCode = (pCPCL_AddQRCode)GetProcAddress(hDllInst, "CPCL_AddQRCode");
		CPCL_AddPDF417 = (pCPCL_AddPDF417)GetProcAddress(hDllInst, "CPCL_AddPDF417");
		CPCL_AddBox = (pCPCL_AddBox)GetProcAddress(hDllInst, "CPCL_AddBox");
		CPCL_AddLine = (pCPCL_AddLine)GetProcAddress(hDllInst, "CPCL_AddLine");
		CPCL_AddImage = (pCPCL_AddImage)GetProcAddress(hDllInst, "CPCL_AddImageA");
		CPCL_SetTextUnderline = (pCPCL_SetTextUnderline)GetProcAddress(hDllInst, "CPCL_SetTextUnderline");
		CPCL_Print = (pCPCL_Print)GetProcAddress(hDllInst, "CPCL_Print");
		CPCL_GetPrinterStatus = (pCPCL_GetPrinterStatus)GetProcAddress(hDllInst, "CPCL_GetPrinterStatus");
		CPCL_AddInverseLine = (pCPCL_AddInverseLine)GetProcAddress(hDllInst, "CPCL_AddInverseLine");
	}
	else
	{
		AfxMessageBox(_T("Failed to load the dynamic library. Procedure printer.sdk.dll"));
	}
}

CString ParseStatus(int status)
{
	if (status == 0)
	{
		return _T("Normal!");
	}
	else if ((status & 0b1) > 0)
	{
		return _T("Head opened£¡");
	}
	else if ((status & 0b10) > 0)
	{
		return _T("Paper jam£¡");
	}
	else if ((status & 0b100) > 0)
	{
		return _T("Out of paper£¡");
	}
	else if ((status & 0b1000) > 0)
	{
		return _T("Out of ribbon£¡");
	}
	else if ((status & 0b10000) > 0)
	{
		return _T("Pause£¡");
	}
	else if ((status & 0b100000) > 0)
	{
		return _T("Printing£¡");
	}
	else if ((status & 0b1000000) > 0)
	{
		return _T("Cover opened£¡");
	}
	else
	{
		return _T("Other error£¡");
	}
}

void PrinterDemo::GetStatus(void* dlg)
{
	unsigned int status;
	int  rValue = CPCL_GetPrinterStatus(printer, &status);
	CString result;
	if (rValue == 0)
	{
		result = _T("The printer status is ");
		result += ParseStatus(status);
	}
	else
	{
		result.Format(_T("Get Error, Code is: %d"), rValue);
	}
	((CWinSDKDemoDlg*)dlg)->SetMsg(result);
}

void PrinterDemo::PrintSample()
{
	CPCL_AddLabel(printer, 0, 400, 1);
	CPCL_AddBox(printer, 10, 10, 510, 280, 5);
	CPCL_AddLine(printer, 10, 180, 510, 180, 4);
	CPCL_AddQRCode(printer, 0, 20, 20, 2, 6, 3, "QR CODE ABC123");
	CPCL_SetAlign(printer, 0);
	CPCL_AddText(printer, 0, "0", 0, 300, 20, "REVERSE");
	CPCL_AddInverseLine(printer, 290, 20, 390, 20, 24);
	CPCL_AddText(printer, 0, "0", 0, 170, 20, "FONT0");
	CPCL_AddText(printer, 0, "1", 0, 170, 60, "FONT1");
	CPCL_AddText(printer, 0, "2", 0, 170, 80, "FONT2");
	CPCL_AddText(printer, 0, "3", 0, 170, 120, "FONT3");
	CPCL_AddBarCode(printer, 0, 20, 1, 1, 50, 270, 80, "123456789");
	CPCL_AddText(printer, 0, "0", 0, 20, 210, "Hello World!");
	CPCL_AddLine(printer, 200, 200, 450, 200, 50);
	CPCL_Print(printer);
}

void PrinterDemo::PrintQRCode()
{
	CPCL_AddLabel(printer, 0, 400, 1);
	CPCL_AddQRCode(printer, 0, 20, 20, 2, 8, 3, "QR CODE ABC123");
	CPCL_Print(printer);
}

void PrinterDemo::PrintBarcode()
{
	CPCL_AddLabel(printer, 0, 800, 1);
	CPCL_AddBarCodeText(printer, 1, 7, 0, 0);
	CPCL_AddText(printer, 0, "0", 0, 0, 0, "Code 128");
	CPCL_AddBarCode(printer, 0, 20, 1, 1, 50, 0, 30, "123456789");
	CPCL_AddText(printer, 0, "0", 0, 0, 120, "UPC-E");
	CPCL_AddBarCode(printer, 0, 3, 1, 1, 50, 0, 150, "223456");
	CPCL_AddText(printer, 0, "0", 0, 0, 240, "EAN/JAN-13");
	CPCL_AddBarCode(printer, 0, 6, 1, 1, 50, 0, 270, "323456791234");
	CPCL_AddText(printer, 0, "0", 0, 0, 360, "Code 39");
	CPCL_AddBarCode(printer, 0, 12, 1, 1, 50, 0, 390, "72233445");
	CPCL_AddText(printer, 0, "0", 0, 250, 0, "UPC-A");
	CPCL_AddBarCode(printer, 0, 0, 1, 1, 50, 250, 30, "423456789012");
	CPCL_AddText(printer, 0, "0", 0, 250, 120, "EAN/JAN-8");
	CPCL_AddBarCode(printer, 0, 9, 1, 1, 50, 250, 150, "52233445");
	CPCL_AddText(printer, 0, "0", 0, 300, 360, "CODABAR");
	CPCL_AddBarCode(printer, 1, 22, 1, 1, 50, 300, 540, "A67859B");
	CPCL_AddText(printer, 0, "0", 0, 0, 480, "Code 93/Ext.93");
	CPCL_AddBarCode(printer, 0, 16, 1, 1, 50, 0, 510, "823456789");
	CPCL_AddBarCodeText(printer, 0, 7, 0, 0);
	CPCL_Print(printer);
}

void PrinterDemo::PrintImage(char* path)
{
	CPCL_AddLabel(printer, 0, 600, 1);
	CPCL_SetAlign(printer, 0);
	CPCL_AddImage(printer, 0, 40, 0, path);
	CPCL_Print(printer);
}
