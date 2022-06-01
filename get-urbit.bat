cd resources/win
del urbit*
curl -JLO https://urbit.org/install/windows/latest
tar zxvf ./windows.tgz --strip-components=1 --strip=1
del windows.tgz