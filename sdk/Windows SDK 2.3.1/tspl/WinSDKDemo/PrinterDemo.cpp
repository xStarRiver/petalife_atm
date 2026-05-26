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
		TSPL_Text = (pTSPL_Text)GetProcAddress(hDllInst, "TSPL_Text");
		TSPL_Print = (pTSPL_Print)GetProcAddress(hDllInst, "TSPL_Print");
		TSPL_Direction = (pTSPL_Direction)GetProcAddress(hDllInst, "TSPL_Direction");
		TSPL_Bar = (pTSPL_Bar)GetProcAddress(hDllInst, "TSPL_Bar");
		TSPL_BarCode = (pTSPL_BarCode)GetProcAddress(hDllInst, "TSPL_BarCode");
		TSPL_Image = (pTSPL_Image)GetProcAddress(hDllInst, "TSPL_Image");
		TSPL_Setup = (pTSPL_Setup)GetProcAddress(hDllInst, "TSPL_Setup");
		TSPL_ClearBuffer = (pTSPL_ClearBuffer)GetProcAddress(hDllInst, "TSPL_ClearBuffer");
		TSPL_Box = (pTSPL_Box)GetProcAddress(hDllInst, "TSPL_Box");
		TSPL_QrCode = (pTSPL_QrCode)GetProcAddress(hDllInst, "TSPL_QrCode");
		TSPL_Home = (pTSPL_Home)GetProcAddress(hDllInst, "TSPL_Home");
		TSPL_GetPrinterStatus = (pTSPL_GetPrinterStatus)GetProcAddress(hDllInst, "TSPL_GetPrinterStatus");
		TSPL_PDF417 = (pTSPL_PDF417)GetProcAddress(hDllInst, "TSPL_PDF417");
		TSPL_Block = (pTSPL_Block)GetProcAddress(hDllInst, "TSPL_Block");
		TSPL_Dmatrix = (pTSPL_Dmatrix)GetProcAddress(hDllInst, "TSPL_Dmatrix");
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
		return _T("Head opened!");
	}
	else if ((status & 0b10) > 0)
	{
		return _T("Paper jam!");
	}
	else if ((status & 0b100) > 0)
	{
		return _T("Out of paper!");
	}
	else if ((status & 0b1000) > 0)
	{
		return _T("Out of ribbon!");
	}
	else if ((status & 0b10000) > 0)
	{
		return _T("Pause!");
	}
	else if ((status & 0b100000) > 0)
	{
		return _T("Printing!");
	}
	else if ((status & 0b1000000) > 0)
	{
		return _T("Cover opened!");
	}
	else
	{
		return _T("Other error!");
	}
}

void PrinterDemo::GetStatus(void* dlg)
{
	unsigned int status;
	int  rValue = TSPL_GetPrinterStatus(printer, &status);
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
	TSPL_Setup(printer, 4, 8, 63, 101, 1, 2, 4);
	TSPL_ClearBuffer(printer);
	TSPL_Direction(printer, 0, 0);
	TSPL_Box(printer, 6, 6, 384, 235, 5, 1);
	TSPL_Box(printer, 16, 16, 376, 225, 5, 1);
	TSPL_BarCode(printer, 30, 30, 7, "ABCDEFGH", 100, 0, 0, 2, 2);
	TSPL_QrCode(printer, 265, 30, 4, 1, 0, 0, 1, 2, "test qrcode");
	TSPL_Text(printer, 200, 144, "3", "Test EN", 0, 1, 1, -1);
	TSPL_Text(printer, 38, 165, "3", "Test EN", 0, 1, 2, -1);
	TSPL_Bar(printer, 200, 183, 166, 30);
	TSPL_Bar(printer, 334, 145, 30, 30);
	TSPL_Print(printer, 1, 1);
}

void PrinterDemo::PrintQRCode()
{
	TSPL_Setup(printer, 4, 8, 76, 30, 1, 0, 0);
	TSPL_ClearBuffer(printer);
	TSPL_QrCode(printer, 265, 30, 8, 1, 0, 0, 1, 2, "test qrcode");
	TSPL_Print(printer, 1, 1);
}

void PrinterDemo::PrintBarcode()
{
	TSPL_Setup(printer, 4, 8, 76, 30, 1, 0, 0);
	TSPL_ClearBuffer(printer);
	TSPL_BarCode(printer, 30, 30, 7, "ABCDEFGH", 100, 2, 0, 2, 2);
	TSPL_Print(printer, 1, 1);
}

void PrinterDemo::PrintImage(char* path)
{
	TSPL_Setup(printer, 4, 8, 76, 80, 1, 2, 0);
	TSPL_ClearBuffer(printer);
	TSPL_Image(printer, 10, 50, 0, path);
	TSPL_Print(printer, 1, 1);
}
