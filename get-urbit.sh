#!/usr/bin/env bash

rpath=/nix/store/cx86fgsqp9dkx2h88rq7q73hhh0an9fy-swift-corefoundation/Library/Frameworks
staticpath=/System/Library/Frameworks
cd resources/mac
rm urbit*
curl -JLO https://bootstrap.urbit.org/urbit-v1.9-rc3-darwin.tgz
tar zxvf ./urbit-v1.9-rc3-darwin.tgz --strip-components=1 --strip=1
rm urbit-v1.9-rc3-darwin.tgz
install_name_tool -rpath $rpath $staticpath urbit

cd ../linux
rm urbit*  
curl -JLO https://bootstrap.urbit.org/urbit-v1.9-rc3-linux64.tgz
tar zxvf ./urbit-v1.9-rc3-linux64.tgz --strip-components=1 --strip=1
rm urbit-v1.9-rc3-linux64.tgz
