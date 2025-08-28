!macro customInstall
  ; Check if Node.js is installed
  nsExec::ExecToStack 'node -v'
  Pop $0
  Pop $1
  
  ${If} $0 != 0
    ; Node.js not found, install it
    MessageBox MB_YESNO "Node.js is required but not installed. Install it now?$\n$\nThis will download and install Node.js LTS automatically." IDYES install_nodejs IDNO skip_nodejs
    
    install_nodejs:
      DetailPrint "Installing Node.js..."
      nsExec::ExecToLog 'winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent'
      Pop $0
      
      ${If} $0 == 0
        DetailPrint "Node.js installed successfully"
        MessageBox MB_OK "Node.js has been installed successfully!"
      ${Else}
        DetailPrint "Node.js installation failed"
        MessageBox MB_OK "Node.js installation failed. You may need to install it manually from https://nodejs.org"
      ${EndIf}
      Goto done_nodejs
    
    skip_nodejs:
      MessageBox MB_OK "Warning: The application may not work properly without Node.js.$\n$\nYou can install it later from https://nodejs.org"
    
    done_nodejs:
  ${Else}
    DetailPrint "Node.js is already installed"
  ${EndIf}
!macroend