#!/usr/bin/env bash

cd resources/mac
rm urbit*
curl -JLO https://urbit.org/install/macos-x86_64/latest
tar -xzvf macos-x86_64.tgz
rm macos-x86_64.tgz

cd resources/mac
rm urbit*
curl -JLO https://urbit.org/install/macos-aarch64/latest
tar -xzvf macos-aarch64.tgz
rm macos-aarch64.tgz

cd ../linux
rm urbit*  
curl -JLO https://urbit.org/install/linux-x86_64/latest
tar -xzvf linux-x86_64.tgz
rm linux-x86_64.tgz
