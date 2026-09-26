#!/bin/bash
set -ea
pnpm install --frozen-lockfile
pnpm --filter db push
