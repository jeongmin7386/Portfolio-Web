. "$PSScriptRoot\backend-env.ps1"
Push-Location "$PSScriptRoot\..\backend"
try {
    mvn test
} finally {
    Pop-Location
}
