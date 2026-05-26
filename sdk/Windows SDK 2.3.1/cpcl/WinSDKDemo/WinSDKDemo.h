#pragma once
#ifndef __AFXWIN_H__
#error "Include 'pch. h' before including this file to generate PCH"
#endif
#include "resource.h"




class CWinSDKDemoApp : public CWinApp
{
public:
	CWinSDKDemoApp();

public:
	virtual BOOL InitInstance();

	DECLARE_MESSAGE_MAP()
};

extern CWinSDKDemoApp theApp;

