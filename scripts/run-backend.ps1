. "$PSScriptRoot\backend-env.ps1"
Push-Location "$PSScriptRoot\..\backend"
try {
    mvn spring-boot:run
} finally {
    Pop-Location
}
