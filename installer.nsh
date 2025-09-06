!macro customInstall
  ; Install Node.js
  DetailPrint "Checking Node.js installation..."
  nsExec::ExecToStack 'node -v'
  Pop $0
  Pop $1
  
  ${If} $0 != 0
    DetailPrint "Installing Node.js..."
    nsExec::ExecToLog 'winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent'
    Pop $0
    
    ${If} $0 == 0
      DetailPrint "Node.js installed successfully"
    ${Else}
      DetailPrint "Node.js installation failed, trying alternative method..."
      nsExec::ExecToLog 'powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri \"https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi\" -OutFile \"$env:TEMP\\nodejs.msi\"; Start-Process msiexec.exe -ArgumentList \"/i $env:TEMP\\nodejs.msi /quiet\" -Wait}"'
    ${EndIf}
  ${Else}
    DetailPrint "Node.js is already installed"
  ${EndIf}
  
  ; Install PostgreSQL
  DetailPrint "Setting up PostgreSQL..."
  nsExec::ExecToLog '"$INSTDIR\\scripts\\setup-postgres.bat"'
  Pop $0
  
  ${If} $0 == 0
    DetailPrint "PostgreSQL setup completed successfully"
  ${Else}
    DetailPrint "PostgreSQL setup encountered issues"
  ${EndIf}
  
  ; Setup database
  DetailPrint "Setting up database..."
  nsExec::ExecToLog '"$INSTDIR\\setup-database.bat"'
  Pop $0
  
  ${If} $0 == 0
    DetailPrint "Database setup completed successfully"
  ${Else}
    DetailPrint "Database setup encountered issues"
  ${EndIf}
!macroend