param(
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$env:TRUECOST_EDIT_PORT = "$Port"
node .\tools\apply-copy.mjs
Write-Host "Open http://127.0.0.1:$Port/index.html?dev=1"
node .\tools\edit-server.mjs
