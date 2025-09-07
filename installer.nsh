!macro customInstall
  DetailPrint "Installation completed"
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'taskkill /f /im HisabGhar.exe 2>nul'
!macroend