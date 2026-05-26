#pragma once
#include "PrinterDemo.h"

class CWinSDKDemoDlg : public CDialog
{
public:
	CWinSDKDemoDlg(CWnd* pParent = nullptr);


#ifdef AFX_DESIGN_TIME
	enum { IDD = IDD_SDKDEMO_DIALOG };
#endif

protected:
	virtual void DoDataExchange(CDataExchange* pDX);

protected:
	HICON m_hIcon;

	virtual BOOL OnInitDialog();
	afx_msg void OnPaint();
	DECLARE_MESSAGE_MAP()
public:
	CButton m_radioUsb;
	CButton m_radioCom;
	CButton m_radioNet;
	CEdit m_msg;
	CEdit m_editHost;
	CComboBox m_comboComPortName;
	CComboBox m_comboBaudrate;
	CComboBox m_comboUSB;
	CComboBox lptCb;
	afx_msg void OnClickedButtonOpen();
	afx_msg void OnClickedButtonClose();
	CString msg;

	CTime currentTime;
	void AddCom();
	void AddUSB();
	void SetMsg(CString r);
	void EnableBtn(bool e);

	int portflag = 0;
	afx_msg void OnClickedButtonText();
	afx_msg void OnClickedButtonBarcode();
	afx_msg void OnClickedButtonQrcode();
	afx_msg void OnClickedButtonBitmap();
	afx_msg void OnClickedButtonPrintstatus();
private:
	PrinterDemo printerDemo;
	static CWinSDKDemoDlg* s_currentInstance;
};