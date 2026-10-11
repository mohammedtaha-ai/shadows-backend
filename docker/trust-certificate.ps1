# Run explicitly by the developer after inspecting the certificate. No machine-wide trust changes.
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$taskCertPath = Join-Path $PSScriptRoot '..\.local-runtime\tls\ca.cer'
$taskCertificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new((Resolve-Path -LiteralPath $taskCertPath).Path)
Write-Host "Shadows local CA subject: $($taskCertificate.Subject)"
Write-Host "SHA-1 store identifier: $($taskCertificate.Thumbprint)"
Write-Host "Valid until: $($taskCertificate.NotAfter.ToString('o'))"
if ($Remove) {
    $taskStorePath = "Cert:\CurrentUser\Root\$($taskCertificate.Thumbprint)"
    if (Test-Path -LiteralPath $taskStorePath) { Remove-Item -LiteralPath $taskStorePath }
    Write-Host 'Removed only this certificate from CurrentUser Root.'
} else {
    Import-Certificate -FilePath $taskCertPath -CertStoreLocation 'Cert:\CurrentUser\Root' | Out-Null
    Write-Host 'Trusted this local development CA for the current Windows user.'
}
