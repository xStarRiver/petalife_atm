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
		PrinterInitialize = (pPrinterInitialize)GetProcAddress(hDllInst, "PrinterInitialize");
		PrintTextS = (pPrintTextS)GetProcAddress(hDllInst, "PrintTextS");
		PrintAndFeedLine = (pPrintAndFeedLine)GetProcAddress(hDllInst, "PrintAndFeedLine");
		PrintBarCode = (pPrintBarCode)GetProcAddress(hDllInst, "PrintBarCode");
		CutPaperWithDistance = (pCutPaperWithDistance)GetProcAddress(hDllInst, "CutPaperWithDistance");
		PrintSymbol = (pPrintSymbol)GetProcAddress(hDllInst, "PrintSymbol");
		SetRelativeHorizontal = (pSetRelativeHorizontal)GetProcAddress(hDllInst, "SetRelativeHorizontal");
		GetPrinterState = (pGetPrinterState)GetProcAddress(hDllInst, "GetPrinterState");
		OpenCashDrawer = (pOpenCashDrawer)GetProcAddress(hDllInst, "OpenCashDrawer");
		PrintImageS = (pPrintImage)GetProcAddress(hDllInst, "PrintImage");
		SetAlign = (pSetAlign)GetProcAddress(hDllInst, "SetAlign");
		SetTextBold = (pSetTextBold)GetProcAddress(hDllInst, "SetTextBold");
		SetTextFont = (pSetTextFont)GetProcAddress(hDllInst, "SetTextFont");
	}
	else
	{
		AfxMessageBox(_T("Failed to load the dynamic library. Procedure printer.sdk.dll"));
	}
}

CString ParseStatus(int status)
{
	if (0x12 == status)
	{
		return _T("Ready");
	}
	else if ((status & 0b100) > 0)
	{
		return _T("Cover opened");
	}
	else if ((status & 0b1000) > 0)
	{
		return _T("Feed button has been pressed");
	}
	else if ((status & 0b100000) > 0)
	{
		return _T("Printer is out of paper");
	}
	else if ((status & 0b1000000) > 0)
	{
		return _T("Error condition");
	}
	else
	{
		return _T("Error");
	}
}

void PrinterDemo::GetStatus(void* dlg)
{
	unsigned int status = 2;
	int  rValue = GetPrinterState(printer, &status);
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
	int xPos = 40;
	PrinterInitialize(printer);
	SetRelativeHorizontal(printer, 180);
	PrintTextS(printer, "Las vegas,NV5208\r\n");
	PrintAndFeedLine(printer);
	PrintAndFeedLine(printer);
	PrintTextS(printer, "Ticket #30-57320             User:HAPPY\r\n");
	PrintTextS(printer, "Station:52-102          Sales Rep HAPPY\r\n");
	PrintTextS(printer, "10/10/2019 3:55:01PM\r\n");
	PrintTextS(printer, "---------------------------------------\r\n");
	PrintTextS(printer, "Item         QTY         Price    Total\r\n");
	PrintTextS(printer, "Description\r\n");
	PrintTextS(printer, "---------------------------------------\r\n");
	PrintTextS(printer, "100328       1           7.99      7.99\r\n");
	PrintTextS(printer, "MAGARITA MIX 7           7.99      3.96\r\n");
	PrintTextS(printer, "680015       1          43.99     43.99\r\n");
	PrintTextS(printer, "LIME\r\n");
	PrintTextS(printer, "102501       1          43.99     43.99\r\n");
	PrintTextS(printer, "V0DKA\r\n");
	PrintTextS(printer, "021048       1           3.99      3.99\r\n");
	PrintTextS(printer, "ORANGE 3200Z\r\n");
	PrintTextS(printer, "---------------------------------------\r\n");
	PrintTextS(printer, "Subtobal                          60.93\r\n");
	PrintTextS(printer, "8.1% Sales Tax                     3.21\r\n");
	PrintTextS(printer, "2% Concession Recov                1.04\r\n");
	PrintTextS(printer, "---------------------------------------\r\n");
	PrintTextS(printer, "Total                             66.18\r\n");
	PrintBarCode(printer, 73, "1234567890", 3, 150, 0, 2);
	CutPaperWithDistance(printer, 10);
}

void PrinterDemo::PrintQRCode()
{
	PrinterInitialize(printer);
	PrintTextS(printer, "Example qrcode.\r\n");
	PrintSymbol(printer, 49, "123456789", 48, 10, 10, 1);
	SetAlign(printer, 0);
	PrintTextS(printer, "Example PDF417.\r\n");
	PrintSymbol(printer, 48, "123456789", 48, 10, 8, 1);
	SetAlign(printer, 0);
	CutPaperWithDistance(printer, 10);
}

void PrinterDemo::PrintBarcode()
{
	PrinterInitialize(printer);
	PrintTextS(printer, "Example UPC_A.\r\n");
	PrintBarCode(printer, 65, "614141999996", 3, 150, 0, 2);
	PrintTextS(printer, "Example UPC_E.\r\n");
	PrintBarCode(printer, 66, "040100002931", 3, 150, 0, 2);
	PrintTextS(printer, "Example JAN13(EAN13).\r\n");
	PrintBarCode(printer, 67, "2112345678917", 3, 150, 0, 2);
	PrintTextS(printer, "Example JAN8(EAN8).\r\n");
	PrintBarCode(printer, 68, "21234569", 3, 150, 0, 2);
	PrintTextS(printer, "Example CODE39.\r\n");
	PrintBarCode(printer, 69, "12345678", 3, 150, 0, 2);
	PrintTextS(printer, "Example ITF.\r\n");
	PrintBarCode(printer, 70, "10614141999993", 3, 150, 0, 2);
	PrintTextS(printer, "Example CODABAR.\r\n");
	PrintBarCode(printer, 71, "B1234567890B", 3, 150, 0, 2);
	PrintTextS(printer, "Example CODE93.\r\n");
	PrintBarCode(printer, 72, "12345678", 3, 150, 0, 2);
	PrintTextS(printer, "Example barcode 128.\r\n");
	PrintBarCode(printer, 73, "1234567890", 3, 150, 0, 2);
	CutPaperWithDistance(printer, 10);
}

void PrinterDemo::PrintImage(char* path)
{
	USES_CONVERSION;
	PrintImageS(printer, path, 0);
	CutPaperWithDistance(printer, 10);
}
