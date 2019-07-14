#!/bin/sh

<<EOF
cd ~camel24-backend
git pull
npm install
pm2 restart all
EOF
