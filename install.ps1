설치 경로 설정 (관리자 권한 없이 실행 가능하도록 AppData 사용)
$installPath = "$env:LOCALAPPDATA\myWorkList"

# 폴더가 없으면 생성
if (!(Test-Path $installPath)) {
    New-Item -ItemType Directory -Path $installPath -Force
}

# 파일 복사 (현재 폴더의 모든 파일을 설치 경로로 이동)
Copy-Item -Path "$PSScriptRoot\*" -Destination $installPath -Recurse -Force

# 바탕화면에 Shortcut 생성
$shortcutPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath("Desktop"), "myWorkList.lnk")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)

# Shortcut 대상 파일 지정 (설치된 실행 파일)
$Shortcut.TargetPath = "$installPath\run.bat"
$Shortcut.WorkingDirectory = $installPath

# Shortcut 아이콘 변경 (설치 폴더 내 `myicon.ico` 사용)
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,321"

# Shortcut 저장
$Shortcut.Save()

Write-Host "설치 완료! 바탕화면에 아이콘이 생성되었습니다."