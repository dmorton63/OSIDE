#!/usr/bin/env bash
set -euo pipefail

mkdir -p build

cat > build/host_main.cpp <<'EOF'
#include "kernel.hpp"

int main() {
	return KernelMain();
}
EOF

exec > >(tee build/oside-build.log) 2>&1

echo "Compiling tinyos sample"
g++ -std=c++20 -g -O0 -Iinclude build/host_main.cpp src/kernel.cpp -Wl,-Map,build/tinyos.map -o build/tinyos-kernel.elf
cp build/tinyos-kernel.elf build/tinyos-kernel.bin
echo "Build complete"