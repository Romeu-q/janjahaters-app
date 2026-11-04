# Compila native/sysaudio.cpp em bin/janja-sysaudio.exe (precisa do Visual Studio Build Tools com C++).
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$vs = & "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $vs) { throw 'Visual Studio com C++ não encontrado' }
New-Item -ItemType Directory -Force "$root\bin" | Out-Null
$cmd = "`"$vs\VC\Auxiliary\Build\vcvars64.bat`" >nul && cl /nologo /O2 /EHsc /std:c++17 /utf-8 /MT /DUNICODE /D_UNICODE " +
  "`"$root\native\sysaudio.cpp`" /Fo`"$env:TEMP\\`" /Fe`"$root\bin\janja-sysaudio.exe`" /link winmm.lib"
cmd /c $cmd
if ($LASTEXITCODE) { throw "cl falhou ($LASTEXITCODE)" }
