#!/bin/bash
PATCHES_DIR="../../patches"
cd node_modules/better-auth
for patch_file in $PATCHES_DIR/*.patch; do
  patch -p1 < "$patch_file"
done
