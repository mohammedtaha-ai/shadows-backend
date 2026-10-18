param([int]$Port=8642)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$hermesSource=Join-Path $env:LOCALAPPDATA 'hermes/hermes-agent'
$bootstrap=Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'hermes/tools') -Directory -Filter 'python-*' | Sort-Object Name -Descending | Select-Object -First 1
if(!$bootstrap){throw 'Installed Hermes Python was not found'}
& (Join-Path $bootstrap.FullName 'python.exe') -I (Join-Path $repoRoot 'docker/hermes-host-acceptance.py') --source $hermesSource --home (Join-Path $repoRoot '.local-runtime/hermes-chat') --port $Port --use-configured-minimax --serve
exit $LASTEXITCODE
