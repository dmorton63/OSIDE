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

echo "Compiling template OS project"
g++ -std=c++20 -g -O0 -Iinclude build/host_main.cpp src/kernel.cpp -Wl,-Map,build/os-project-template.map -o build/os-project-template.elf
cp build/os-project-template.elf build/os-project-template.bin
echo "Build complete"