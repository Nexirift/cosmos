#!/bin/bash
cd node_modules/better-auth
patch -p1 < ../../patches/fix-prettify-preservejsdoc.patch
patch -p1 < ../../patches/fix-drizzle-adapter-count.patch
