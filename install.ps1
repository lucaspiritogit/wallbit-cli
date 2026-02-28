Param(
  [string]$Repo = $(if ($env:WALLBIT_CLI_REPO) { $env:WALLBIT_CLI_REPO } else { "lpirito/wallbit-cli" }),
  [string]$Version = "latest",
  [string]$InstallDir = $(if ($env:WALLBIT_CLI_INSTALL_DIR) { $env:WALLBIT_CLI_INSTALL_DIR } else { "$HOME\\.local\\bin" })
)

$ErrorActionPreference = "Stop"

$arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
switch ($arch) {
  "X64" { $archPart = "x64" }
  "Arm64" { $archPart = "arm64" }
  default { throw "Unsupported architecture: $arch" }
}

$asset = "wallbit-cli-windows-$archPart.exe"
$apiBase = "https://api.github.com/repos/$Repo/releases"
$releaseUrl = if ($Version -eq "latest") { "$apiBase/latest" } else { "$apiBase/tags/$Version" }

Write-Host "Fetching release metadata from $Repo..."
$release = Invoke-RestMethod -Uri $releaseUrl -Headers @{ "User-Agent" = "wallbit-cli-installer" }
$assetUrl = $release.assets | Where-Object { $_.name -eq $asset } | Select-Object -First 1 -ExpandProperty browser_download_url

if (-not $assetUrl) {
  throw "Could not find asset: $asset. Try -Repo OWNER/REPO or -Version vX.Y.Z"
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$target = Join-Path $InstallDir "wallbit-cli.exe"

Write-Host "Downloading $asset..."
Invoke-WebRequest -Uri $assetUrl -OutFile $target

Write-Host "Installed to: $target"
Write-Host "Add '$InstallDir' to your PATH if needed."
