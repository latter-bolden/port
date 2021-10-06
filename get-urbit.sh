#!/usr/bin/env bash

rpath=/nix/store/cx86fgsqp9dkx2h88rq7q73hhh0an9fy-swift-corefoundation/Library/Frameworks
staticpath=/System/Library/Frameworks
cd resources/mac
rm urbit*
curl -JLO https://urbit.org/install/mac/latest
tar zxvf ./darwin.tgz --strip-components=1 --strip=1
rm darwin.tgz urbit-king
install_name_tool -rpath $rpath $staticpath urbit
install_name_tool -rpath $rpath $staticpath urbit-worker

cd ../linux
rm urbit*  
curl -JLO https://urbit.org/install/linux64/latest
tar zxvf ./linux64.tgz --strip-components=1 --strip=1
rm linux64.tgz urbit-king

cd ../win
rm urbit*
curl -JLO https://github.com/urbit/urbit/releases/download/urbit-v1.6/windows.tgz
tar zxvf ./windows.tgz --strip-components=1 --strip=1
rm windows.tgz