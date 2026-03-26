@echo off
echo Building APK...

set EAS_NO_VCS=1
eas build --platform android --profile preview

echo Build started! Check Expo dashboard for download link.
pause