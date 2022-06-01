#!/usr/bin/env bash

cd resources/mac
rm urbit*
curl -JLO https://urbit.org/install/mac/latest
tar zxvf ./darwin.tgz --strip-components=1 --strip=1
rm darwin.tgz

cd ../linux
rm urbit*  
curl -JLO https://urbit.org/install/linux64/latest
tar zxvf ./linux64.tgz --strip-components=1 --strip=1
rm linux64.tgz
