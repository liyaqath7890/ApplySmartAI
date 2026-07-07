$base = "c:\Users\liyaq\OneDrive\Desktop\ai-job-agent\frontend\src\features\profiles\components"
$files = @("ExperienceManager.tsx", "EducationManager.tsx", "CertificationManager.tsx", "PersonalInfoManager.tsx")

foreach ($name in $files) {
  $file = Join-Path $base $name
  $c = Get-Content $file -Raw
  $c = $c -replace 'bg-white rounded-xl border border-gray-200', 'bg-app-card rounded-xl border border-app-border'
  $c = $c -replace 'bg-gray-50 rounded-lg border border-gray-200', 'bg-app-hover rounded-lg border border-app-border'
  $c = $c -replace 'text-xl font-bold text-gray-900', 'text-xl font-bold text-app-primary'
  $c = $c -replace 'text-lg font-semibold text-gray-900', 'text-lg font-semibold text-app-primary'
  $c = $c -replace 'text-sm font-medium text-gray-700', 'text-sm font-medium text-app-secondary'
  $c = $c -replace '"text-sm text-gray-600', '"text-sm text-app-secondary'
  $c = $c -replace '"text-xs text-gray-500', '"text-xs text-app-secondary'
  $c = $c -replace 'border border-gray-300 rounded-lg', 'border border-app-border rounded-lg bg-app-bg text-app-primary'
  Set-Content $file -Value $c -Encoding UTF8
  Write-Host "Fixed: $name"
}

Write-Host "Done."
