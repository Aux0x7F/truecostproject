param(
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$NodeCommand = Get-Command node -ErrorAction SilentlyContinue
$Node = if ($NodeCommand) {
  $NodeCommand.Source
} elseif (Test-Path (Join-Path $Root ".local\node\node.exe")) {
  Join-Path $Root ".local\node\node.exe"
} else {
  $null
}

if (-not $Node) {
  Write-Error "Node is needed to run the editor. Ask your agent to set up a local portable Node runtime for this repo."
}

$env:TRUECOST_EDIT_PORT = "$Port"
& $Node .\tools\apply-copy.mjs
Write-Host "Open http://127.0.0.1:$Port/index.html?dev=1"
& $Node .\tools\edit-server.mjs
