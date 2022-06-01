cd resources/win
del urbit*
curl -JLO https://bootstrap.urbit.org/vere/soon/1.9-rc6/vere-v1.9-rc6-x86_64-windows.exe
@REM tar zxvf ./windows.tgz --strip-components=1 --strip=1
@REM del windows.tgz
MOVE vere-v1.9-rc6-x86_64-windows.exe urbit.exe