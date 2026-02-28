$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Repo = "lucaspiritogit/wallbit-cli"
$BinDir = if ($env:WALLBIT_CLI_BIN_DIR) { $env:WALLBIT_CLI_BIN_DIR } else { Join-Path $env:USERPROFILE ".local\bin" }
$BinName = "wallbit-cli"

function Fail {
  param([string]$Message)
  Write-Error $Message
  exit 1
}

$Version = if ($env:WALLBIT_CLI_VERSION) { $env:WALLBIT_CLI_VERSION } else { "" }
if (-not $Version) {
  try {
    $latest = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest"
    $Version = [string]$latest.tag_name
  } catch {
    Fail "Could not resolve wallbit-cli version from GitHub releases."
  }
}

$Arch = switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) {
  "X64" { "amd64" }
  "Arm64" { "arm64" }
  default { Fail "Unsupported CPU architecture: $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)" }
}

$Asset = "${BinName}_Windows_${Arch}.zip"
$ChecksumsAsset = "SHA256SUMS"
$BaseUrl = "https://github.com/$Repo/releases/download/$Version"
$AssetUrl = "$BaseUrl/$Asset"
$ChecksumsUrl = "$BaseUrl/$ChecksumsAsset"

$tmpRoot = Join-Path $env:TEMP ("wallbit-cli-install-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmpRoot -Force | Out-Null

try {
  $archivePath = Join-Path $tmpRoot $Asset
  $checksumsPath = Join-Path $tmpRoot $ChecksumsAsset
  $extractDir = Join-Path $tmpRoot "extract"

  Invoke-WebRequest -Uri $AssetUrl -OutFile $archivePath
  Invoke-WebRequest -Uri $ChecksumsUrl -OutFile $checksumsPath

  $expectedHash = $null
  foreach ($line in (Get-Content $checksumsPath)) {
    if ($line -match "^\s*([a-fA-F0-9]{64})\s+\*?(.+)$") {
      if ($Matches[2].Trim() -eq $Asset) {
        $expectedHash = $Matches[1].ToLowerInvariant()
        break
      }
    }
  }
  if (-not $expectedHash) {
    Fail "Could not find checksum for $Asset."
  }

  $actualHash = (Get-FileHash -Path $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne $expectedHash) {
    Fail "Checksum verification failed for $Asset."
  }

  Expand-Archive -Path $archivePath -DestinationPath $extractDir -Force
  $exePath = Join-Path $extractDir "$BinName.exe"
  if (-not (Test-Path $exePath)) {
    Fail "Archive did not contain $BinName.exe"
  }

  if (-not (Test-Path $BinDir)) {
    New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
  }

  $targetExe = Join-Path $BinDir "$BinName.exe"
  Copy-Item -Path $exePath -Destination $targetExe -Force
} finally {
  if (Test-Path $tmpRoot) {
    Remove-Item -Path $tmpRoot -Recurse -Force
  }
}

if (-not (Test-Path $BinDir)) {
  New-Item -ItemType Directory -Path $BinDir -Force | Out-Null
}

$launcherPath = Join-Path $BinDir "$BinName.cmd"
$launcher = @(
  "@echo off"
  "setlocal"
  """$BinDir\$BinName.exe"" %*"
)
Set-Content -Path $launcherPath -Value $launcher -Encoding ASCII

$pathEntries = @($env:Path -split ';' | Where-Object { $_ })
$inSessionPath = $false
foreach ($entry in $pathEntries) {
  if ($entry.TrimEnd('\\') -ieq $BinDir.TrimEnd('\\')) {
    $inSessionPath = $true
    break
  }
}

if (-not $inSessionPath) {
  $env:Path = "$BinDir;$env:Path"
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPathEntries = if ($userPath) { @($userPath -split ';' | Where-Object { $_ }) } else { @() }
$inUserPath = $false
foreach ($entry in $userPathEntries) {
  if ($entry.TrimEnd('\\') -ieq $BinDir.TrimEnd('\\')) {
    $inUserPath = $true
    break
  }
}

if (-not $inUserPath) {
  $newUserPath = if ($userPath) { "$userPath;$BinDir" } else { $BinDir }
  [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
}

Write-Host ""
Write-Host "Installed $BinName $Version to $launcherPath"
Write-Host ""
if ($inUserPath) {
  Write-Host "'$BinDir' is already on PATH. If the command is not found, open a new shell."
} else {
  Write-Host "Added '$BinDir' to your user PATH. Open a new shell and run '$BinName'."
}
