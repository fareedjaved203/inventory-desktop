!macro customInstall
  DetailPrint "Checking Node.js installation..."
  
  ; Check if Node.js is already installed
  nsExec::ExecToStack 'node --version'
  Pop $0 ; Exit code
  Pop $1 ; Output
  
  ${If} $0 == 0
    DetailPrint "Node.js is already installed: $1"
  ${Else}
    DetailPrint "Node.js not found. Installing Node.js..."
    
    ; Detect Windows version and use appropriate Node.js version
    ReadRegStr $R0 HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion" CurrentVersion
    
    ; Use Node.js 16.20.2 for Windows 7/8 compatibility
    StrCpy $R1 "https://nodejs.org/dist/v16.20.2/node-v16.20.2-x64.msi"
    
    ; Try PowerShell first (Windows 8.1+)
    nsExec::ExecToLog 'powershell -Command "try { (New-Object Net.WebClient).DownloadFile('$R1', '$TEMP\nodejs-installer.msi'); exit 0 } catch { exit 1 }"'
    Pop $0
    
    ; If PowerShell fails, try certutil (available on all Windows versions)
    ${If} $0 != 0
      nsExec::ExecToLog 'certutil -urlcache -split -f "$R1" "$TEMP\nodejs-installer.msi"'
      Pop $0
    ${EndIf}
    
    ${If} $0 == 0
      DetailPrint "Node.js installer downloaded successfully"
      
      ; Install Node.js silently
      nsExec::ExecToLog 'msiexec /i "$TEMP\nodejs-installer.msi" /quiet /norestart'
      Pop $0
      
      ${If} $0 == 0
        DetailPrint "Node.js installed successfully"
        ; Clean up installer
        Delete "$TEMP\nodejs-installer.msi"
      ${Else}
        DetailPrint "Node.js installation failed (exit code: $0)"
      ${EndIf}
    ${Else}
      DetailPrint "Failed to download Node.js installer"
    ${EndIf}
  ${EndIf}
  
  DetailPrint "Installation completed"
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'taskkill /f /im HisabGhar.exe 2>nul'
!macroend