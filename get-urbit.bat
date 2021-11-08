cd resources/win
del urbit*
curl -JLO https://github.com/urbit/urbit/releases/latest/download/windows.tgz
tar zxvf ./windows.tgz --strip-components=1 --strip=1
del windows.tgz