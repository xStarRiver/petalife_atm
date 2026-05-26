#include "pch.h"
#include "framework.h"
#include "WinSDKDemo.h"
#include "WinSDKDemoDlg.h"
#include "afxdialogex.h"
#ifdef _DEBUG
#define new DEBUG_NEW
#endif

bool isOpen = false;
CWinSDKDemoDlg* CWinSDKDemoDlg::s_currentInstance = nullptr;
CWinSDKDemoDlg::CWinSDKDemoDlg(CWnd* pParent /*=nullptr*/)
	: CDialog(IDD_SDKDEMO_DIALOG, pParent)
{
	m_hIcon = AfxGetApp()->LoadIcon(IDR_MAINFRAME);
}

void CWinSDKDemoDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	DDX_Control(pDX, IDC_RADIO_USB, m_radioUsb);
	DDX_Control(pDX, IDC_RADIO_COM, m_radioCom);
	DDX_Control(pDX, IDC_RADIO_NET, m_radioNet);
	DDX_Control(pDX, IDC_EDIT_MSG, m_msg);
	DDX_Control(pDX, IDC_EDIT_NET, m_editHost);
	DDX_Control(pDX, IDC_COMBO_COM_PORT_NAME, m_comboComPortName);
	DDX_Control(pDX, IDC_COMBO_BAUDRATE, m_comboBaudrate);
	DDX_Control(pDX, IDC_COMBO_LPT, lptCb);
	DDX_Control(pDX, IDC_COMBO_USB, m_comboUSB);
}

BEGIN_MESSAGE_MAP(CWinSDKDemoDlg, CDialog)
	ON_WM_PAINT()
	ON_WM_QUERYDRAGICON()
	ON_BN_CLICKED(IDC_BUTTON_OPEN, &CWinSDKDemoDlg::OnClickedButtonOpen)
	ON_BN_CLICKED(IDC_BUTTON_CLOSE, &CWinSDKDemoDlg::OnClickedButtonClose)
	ON_BN_CLICKED(IDC_BUTTON_TEXT, &CWinSDKDemoDlg::OnClickedButtonText)
	ON_BN_CLICKED(IDC_BUTTON_BARCODE, &CWinSDKDemoDlg::OnClickedButtonBarcode)
	ON_BN_CLICKED(IDC_BUTTON_QRCODE, &CWinSDKDemoDlg::OnClickedButtonQrcode)
	ON_BN_CLICKED(IDC_BUTTON_BITMAP, &CWinSDKDemoDlg::OnClickedButtonBitmap)
	ON_BN_CLICKED(IDC_BUTTON_PRINTSTATUS, &CWinSDKDemoDlg::OnClickedButtonPrintstatus)
END_MESSAGE_MAP()

BOOL CWinSDKDemoDlg::OnInitDialog()
{
	s_currentInstance = this;
	CDialog::OnInitDialog();
	SetIcon(m_hIcon, TRUE);
	SetIcon(m_hIcon, FALSE);
	m_radioUsb.SetCheck(BST_CHECKED);
	m_comboBaudrate.InsertString(-1, _T("9600"));
	m_comboBaudrate.InsertString(-1, _T("19200"));
	m_comboBaudrate.InsertString(-1, _T("38400"));
	m_comboBaudrate.InsertString(-1, _T("57600"));
	m_comboBaudrate.InsertString(-1, _T("115200"));
	lptCb.InsertString(0, _T("LPT1"));
	lptCb.InsertString(1, _T("LPT2"));
	lptCb.InsertString(2, _T("LPT3"));
	printerDemo.loadDll();
	AddCom();
	AddUSB();
	EnableBtn(false);

	return TRUE;
}

void CWinSDKDemoDlg::OnPaint()
{
	if (IsIconic())
	{
		CPaintDC dc(this);
		SendMessage(WM_ICONERASEBKGND, reinterpret_cast<WPARAM>(dc.GetSafeHdc()), 0);
		int cxIcon = GetSystemMetrics(SM_CXICON);
		int cyIcon = GetSystemMetrics(SM_CYICON);
		CRect rect;
		GetClientRect(&rect);
		int x = (rect.Width() - cxIcon + 1) / 2;
		int y = (rect.Height() - cyIcon + 1) / 2;
		dc.DrawIcon(x, y, m_hIcon);
	}
	else
	{
		CDialog::OnPaint();
	}
}

void CWinSDKDemoDlg::OnClickedButtonOpen()
{
	if (printerDemo.printer)
	{
		printerDemo.ReleasePrinter(printerDemo.printer);
	}
	printerDemo.PrinterCreator(&printerDemo.printer, "");
	char info[100] = { 0 };
	CString usbPort;
	m_comboUSB.GetWindowText(usbPort);
	if (((CButton*)GetDlgItem(IDC_RADIO_USB))->GetCheck())
	{
		CT2A ascii(usbPort);
		sprintf_s(info, sizeof(info), "USB,%s", ascii.m_psz);
	}
	else if (((CButton*)GetDlgItem(IDC_RADIO_COM))->GetCheck())
	{
		CString baudrateStr, portName;
		m_comboBaudrate.GetWindowText(baudrateStr);
		m_comboComPortName.GetWindowText(portName);
		CT2A ascii(baudrateStr);
		CT2A ascii2(portName);
		sprintf_s(info, sizeof(info), "%s,%s", ascii2.m_psz, ascii.m_psz);
	}
	else if (((CButton*)GetDlgItem(IDC_RADIO_NET))->GetCheck())
	{
		CString host;
		m_editHost.GetWindowText(host);
		host.Trim();
		CT2A ascii(host);
		sprintf_s(info, sizeof(info), "NET,%s", ascii.m_psz);
	}
	else if (((CButton*)GetDlgItem(IDC_RADIO_LPT))->GetCheck())
	{
		CString lptTxt;
		lptCb.GetWindowText(lptTxt);
		CT2A ascii(lptTxt);
		strcpy_s(info, sizeof(info), ascii.m_psz);
	}
	int ret = printerDemo.OpenPort(printerDemo.printer, info);
	isOpen = ret == 0;
	if (isOpen)
	{
		SetMsg(_T("Open port succeed!"));
		EnableBtn(true);
	}
	else
	{
		SetMsg(_T("Open port fail, please check!"));
	}
}

void CWinSDKDemoDlg::OnClickedButtonClose()
{
	if (isOpen)
	{
		SetMsg(_T("Close port"));
		printerDemo.ClosePort(printerDemo.printer);
		EnableBtn(false);
		isOpen = false;
	}
}

void CWinSDKDemoDlg::EnableBtn(bool e)
{
	((CButton*)GetDlgItem(IDC_BUTTON_TEXT))->EnableWindow(e);
	((CButton*)GetDlgItem(IDC_BUTTON_BARCODE))->EnableWindow(e);
	((CButton*)GetDlgItem(IDC_BUTTON_QRCODE))->EnableWindow(e);
	((CButton*)GetDlgItem(IDC_BUTTON_BITMAP))->EnableWindow(e);
	((CButton*)GetDlgItem(IDC_BUTTON_PRINTSTATUS))->EnableWindow(e && !((CButton*)GetDlgItem(IDC_RADIO_LPT))->GetCheck());
	((CButton*)GetDlgItem(IDC_BUTTON_CLOSE))->EnableWindow(e);
}

void CWinSDKDemoDlg::AddUSB(void)
{
	printerDemo.FindPrinters("USB,", [](char* device) {
		if (s_currentInstance) 
		{
			((CWinSDKDemoDlg*)s_currentInstance)->m_comboUSB.AddString(CString(device));
		}
	});
}
void CWinSDKDemoDlg::AddCom(void)
{
	for (int i = 1; i < 256; i++)
	{
		CString sPort;
		sPort.Format(_T("\\\\.\\COM%d"), i);
		BOOL bSuccess = FALSE;
		HANDLE hPort = ::CreateFile(sPort, GENERIC_READ | GENERIC_WRITE, 0, 0, OPEN_EXISTING, 0, 0);
		if (hPort != INVALID_HANDLE_VALUE) {
			CString str;
			str.Format(_T("COM%d"), i);
			m_comboComPortName.AddString(str);
			CloseHandle(hPort);
		}
	}
}
void CWinSDKDemoDlg::SetMsg(CString r)
{
	currentTime = CTime::GetCurrentTime();
	msg += currentTime.Format(_T("%m-%d %H:%M:%S  ")) + r + _T("\r\n");
	m_msg.SetWindowText(msg);
	m_msg.LineScroll(m_msg.GetLineCount() - 1, 0);
}

void CWinSDKDemoDlg::OnClickedButtonText()
{
	printerDemo.PrintSample();
	SetMsg(_T("Print Sample"));
}

void CWinSDKDemoDlg::OnClickedButtonBarcode()
{
	printerDemo.PrintBarcode();
	SetMsg(_T("Print Barcode"));
}

void CWinSDKDemoDlg::OnClickedButtonQrcode()
{
	printerDemo.PrintQRCode();
	SetMsg(_T("Print Qrcode"));
}

void CWinSDKDemoDlg::OnClickedButtonBitmap()
{
	TCHAR tpath[MAX_PATH];
	CFileDialog BmpFileDlg(TRUE);
	BmpFileDlg.m_ofn.lpstrInitialDir = tpath;
	BmpFileDlg.m_ofn.lpstrFilter = _T("Image Files\0*.jpg;*.jpeg;*.png;*.bmp\0All Files\0*.*\0");
	if (IDOK == BmpFileDlg.DoModal())
	{
		CString strBmpFilePath = BmpFileDlg.GetPathName();
		CT2A ascii(strBmpFilePath);
		printerDemo.PrintImage(ascii.m_psz);
	}
}

void CWinSDKDemoDlg::OnClickedButtonPrintstatus()
{
	printerDemo.GetStatus(this);
}
