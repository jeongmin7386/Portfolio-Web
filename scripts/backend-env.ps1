$Root = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = Join-Path $Root "work\tools\jdk-21.0.11+10"
$env:MAVEN_HOME = Join-Path $Root "work\tools\apache-maven-3.9.9"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MAVEN_HOME=$env:MAVEN_HOME"
