#!/usr/bin/env bash

rpath=/nix/store/cx86fgsqp9dkx2h88rq7q73hhh0an9fy-swift-corefoundation/Library/Frameworks
staticpath=/System/Library/Frameworks
cd resources/mac
rm urbit*
# https://urbit.org/install/mac/latest
curl -JLO https://bootstrap.urbit.org/ci/urbit-v1.6-x86_64-darwin-b1bc4b54f.tgz
tar zxvf ./urbit-v1.6-x86_64-darwin-b1bc4b54f.tgz --strip-components=1 --strip=1
rm urbit-*.tgz urbit-king
install_name_tool -rpath $rpath $staticpath urbit
install_name_tool -rpath $rpath $staticpath urbit-worker

cd ../linux
rm urbit*
# https://urbit.org/install/linux64/latest 
curl -JLO https://bootstrap.urbit.org/ci/urbit-v1.6-x86_64-linux-b1bc4b54f.tgz
tar zxvf ./urbit-v1.6-x86_64-linux-b1bc4b54f.tgz --strip-components=1 --strip=1
rm urbit-*.tgz urbit-king