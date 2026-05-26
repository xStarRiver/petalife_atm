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
		ZPL_StartFormat = (pZPL_StartFormat)GetProcAddress(hDllInst, "ZPL_StartFormat");
		ZPL_EndFormat = (pZPL_EndFormat)GetProcAddress(hDllInst, "ZPL_EndFormat");
		ZPL_Text = (pZPL_Text)GetProcAddress(hDllInst, "ZPL_TextA");
		ZPL_BarCode128 = (pZPL_BarCode128)GetProcAddress(hDllInst, "ZPL_BarCode128");
		ZPL_QRCode = (pZPL_QRCode)GetProcAddress(hDllInst, "ZPL_QRCode");
		ZPL_GraphicBox = (pZPL_GraphicBox)GetProcAddress(hDllInst, "ZPL_GraphicBox");
		ZPL_PrintImage = (pZPL_PrintImage)GetProcAddress(hDllInst, "ZPL_PrintImageA");
		ZPL_DataMatrixBarcode = (pZPL_DataMatrixBarcode)GetProcAddress(hDllInst, "ZPL_DataMatrixBarcode");
		ZPL_Text_Block = (pZPL_Text_Block)GetProcAddress(hDllInst, "ZPL_Text_BlockA");
		ZPL_GetPrinterStatus = (pZPL_GetPrinterStatus)GetProcAddress(hDllInst, "ZPL_GetPrinterStatus");
		ZPL_PrintConfigurationLabel = (pZPL_PrintConfigurationLabel)GetProcAddress(hDllInst, "ZPL_PrintConfigurationLabel");
		ZPL_Pdf417 = (pZPL_Pdf417)GetProcAddress(hDllInst, "ZPL_Pdf417");
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
		return "Normal!";
	}
	else if ((status & 0b1) > 0)
	{
		return "Head opened£¡";
	}
	else if ((status & 0b10) > 0)
	{
		return "Paper jam£¡";
	}
	else if ((status & 0b100) > 0)
	{
		return "Out of paper£¡";
	}
	else if ((status & 0b1000) > 0)
	{
		return "Out of ribbon£¡";
	}
	else if ((status & 0b10000) > 0)
	{
		return "Pause£¡";
	}
	else if ((status & 0b100000) > 0)
	{
		return "Printing£¡";
	}
	else if ((status & 0b1000000) > 0)
	{
		return "Cover opened£¡";
	}
	else
	{
		return "Other error£¡";
	}
}

void PrinterDemo::GetStatus(void* dlg)
{
	unsigned int status;
	int  rValue = ZPL_GetPrinterStatus(printer, &status);
	CString result;
	if (rValue == 0)
	{
		result = "The printer status is ";
		result += ParseStatus(status);
	}
	else
	{
		result.Format("Get Error, Code is: %d", rValue);
	}
	((CWinSDKDemoDlg*)dlg)->SetMsg(result);
}

void PrinterDemo::PrintSample()
{
	int xPos = 40;
	ZPL_StartFormat(printer);
	ZPL_Text(printer, xPos, 50, 13, 0, 59, 53, "FROM:");
	ZPL_Text(printer, 200, 40, 3, 0, 18, 30, "Company Name");
	ZPL_Text(printer, 200, 80, 3, 0, 18, 30, "Street, City");
	ZPL_Text(printer, 200, 120, 3, 0, 18, 30, "Phone");
	ZPL_GraphicBox(printer, xPos, 170, 500, 8, 4, 0);
	ZPL_Text(printer, xPos, 200, 13, 0, 59, 53, "SHIP TO:");
	ZPL_Text(printer, 200, 190, 3, 0, 18, 30, "Company Name");
	ZPL_Text(printer, 200, 230, 3, 0, 18, 30, "Street, City");
	ZPL_Text(printer, 200, 270, 3, 0, 18, 30, "Phone");
	ZPL_GraphicBox(printer, xPos, 320, 500, 8, 4, 0);
	ZPL_Text(printer, xPos, 340, 13, 0, 59, 53, "WEIGHT:");
	ZPL_Text(printer, 200, 340, 3, 0, 18, 30, "1kg/2,2lb");
	ZPL_BarCode128(printer, 80, 410, 0, 5, 150, 'Y', 'N', 'N', 'A', "12345678");
	ZPL_EndFormat(printer);
}

void PrinterDemo::PrintQRCode()
{
	ZPL_StartFormat(printer);
	ZPL_QRCode(printer, 120, 5, 0, 2, 5, 'Q', '0', 'B', "Welcome to the world of printing!");
	ZPL_EndFormat(printer);
}

void PrinterDemo::PrintBarcode()
{
	ZPL_StartFormat(printer);
	ZPL_BarCode128(printer, 120, 10, 0, 3, 80, 'Y', 'N', 'N', 'A', "123456");
	ZPL_EndFormat(printer);
}

void PrinterDemo::PrintImage(char* path)
{
	ZPL_StartFormat(printer);
	ZPL_PrintImage(printer, 120, 10, path);
	ZPL_EndFormat(printer);
}
