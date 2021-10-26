cd resources/win
del urbit*
curl -JLO https://github.com/urbit/urbit/releases/download/urbit-v1.6/windows.tgz
tar zxvf ./windows.tgz --strip-components=1 --strip=1
del windows.tgz