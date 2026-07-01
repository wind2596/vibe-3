$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPython = Join-Path $root 'backend\.venv\Scripts\python.exe'

if (-not (Test-Path $backendPython)) {
  throw "Backend virtual environment not found: $backendPython"
}

Write-Host 'Starting backend on http://127.0.0.1:8000 ...'
$backend = Start-Process `
  -FilePath $backendPython `
  -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000') `
  -WorkingDirectory (Join-Path $root 'backend') `
  -PassThru `
  -WindowStyle Hidden

Write-Host 'Starting frontend on http://127.0.0.1:5173 ...'
$npmCmd = (Get-Command npm.cmd).Source
$frontend = Start-Process `
  -FilePath $npmCmd `
  -ArgumentList @('--prefix', 'frontend', 'run', 'dev', '--', '--host', '127.0.0.1') `
  -WorkingDirectory $root `
  -PassThru `
  -WindowStyle Hidden

Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host 'Use Ctrl+C in this window to stop the launcher, then terminate the two processes if needed.'
