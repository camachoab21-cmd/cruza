$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (!(Test-Path -LiteralPath $pythonExe)) {
    throw 'Esta copia necesita su entorno Python. Ejecuta ABRIR-CRUZA.bat.'
}
$url = 'http://127.0.0.1:8765/'
$ready = $false
try {
    $response = Invoke-WebRequest -Uri ($url + 'api/session') -UseBasicParsing -TimeoutSec 2
    $ready = $response.StatusCode -eq 200
} catch {}
if (!$ready) {
    $env:CRUZA_DEMO_MODE = '1'
    $env:CRUZA_DB_PATH = Join-Path $PSScriptRoot 'data\cruza.sqlite3'
    $env:CRUZA_HTTPS = '0'
    $logDir = Join-Path $PSScriptRoot '.local'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $server = Start-Process -FilePath $pythonExe -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8765') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'servidor-out.log') -RedirectStandardError (Join-Path $logDir 'servidor-error.log') -PassThru
    Set-Content -LiteralPath (Join-Path $logDir 'servidor.pid') -Value $server.Id
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 300
        try {
            $response = Invoke-WebRequest -Uri ($url + 'api/session') -UseBasicParsing -TimeoutSec 1
            if ($response.StatusCode -eq 200) { $ready = $true; break }
        } catch {}
    }
}
if (!$ready) { throw 'No inicio CRUZA. Revisa .local\servidor-error.log.' }
Start-Process $url
Write-Host 'CRUZA lista en http://127.0.0.1:8765/'
