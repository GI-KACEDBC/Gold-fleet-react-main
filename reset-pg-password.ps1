# Reset PostgreSQL postgres user password to 'zachy'
$pgBin = "C:\Program Files\PostgreSQL\18\bin"

# Create a temporary SQL script
$sqlScript = @"
ALTER USER postgres WITH PASSWORD 'zachy';
"@

$sqlScript | Out-File -Encoding UTF8 -FilePath "c:\temp\reset_pwd.sql" -Force

Write-Host "Resetting PostgreSQL password..."
Write-Host "Note: You may be prompted for the current postgres password"

# Try to reset using psql - you'll need to provide current password
# Option 1: Using pg_ctl to restart with trust authentication (requires admin)
Write-Host "`nTo reset the password, use one of these options:`n"

Write-Host "Option 1 - Using Windows Services (Recommended):"
Write-Host "1. Open Windows Services (services.msc)"
Write-Host "2. Find 'postgresql-x64-18' or similar"
Write-Host "3. Stop the service"
Write-Host "4. Open cmd as Administrator and run:"
Write-Host "   `"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe`" -D `"C:\Program Files\PostgreSQL\18\data`" -l logfile.txt start -o `"-c password_encryption=scram-sha-256`""
Write-Host "5. Then run: `"C:\Program Files\PostgreSQL\18\bin\psql.exe`" -U postgres -h 127.0.0.1"
Write-Host "6. Type: ALTER USER postgres WITH PASSWORD 'zachy';"

Write-Host "`nOption 2 - Direct command (if you know current password):"
Write-Host "Set password to 'zachy' with:"
Write-Host "&`"C:\Program Files\PostgreSQL\18\bin\psql.exe`" -U postgres -h 127.0.0.1 -c `"ALTER USER postgres WITH PASSWORD 'zachy';`""
