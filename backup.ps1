# backup.ps1
# Guardá esto en la raíz de tu proyecto

param(
    [string]$ProjectName = "gym-app"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\${ProjectName}_backup_${timestamp}.sql"

# Crear carpeta si no existe
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Verificar que DATABASE_URL esté seteada
if (!$env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL no está definida" -ForegroundColor Red
    Write-Host "   Seteala con: $env:DATABASE_URL = 'postgresql://...'"
    exit 1
}

Write-Host "🔄 Haciendo backup de la base de datos..." -ForegroundColor Cyan
Write-Host "   Archivo: $backupFile"

try {
    pg_dump $env:DATABASE_URL > $backupFile
    Write-Host "✅ Backup completado: $backupFile" -ForegroundColor Green
    
    # Mostrar tamaño
    $size = (Get-Item $backupFile).Length / 1KB
    Write-Host "   Tamaño: $([math]::Round($size, 2)) KB"
} catch {
    Write-Host "❌ Error al hacer backup: $_" -ForegroundColor Red
}