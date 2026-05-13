#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_dirs=(src include modules boot build scripts)
required_files=(project.json linker.ld)

check_project_layout() {
    local project_root="$1"
    local label="$2"

    echo "Checking ${label} layout: ${project_root}"

    for dir_name in "${required_dirs[@]}"; do
        if [[ ! -d "${project_root}/${dir_name}" ]]; then
            echo "error: ${label} missing required directory ${dir_name}" >&2
            return 1
        fi
    done

    for file_name in "${required_files[@]}"; do
        if [[ ! -f "${project_root}/${file_name}" ]]; then
            echo "error: ${label} missing required file ${file_name}" >&2
            return 1
        fi
    done

    if ! grep -q '"type"[[:space:]]*:[[:space:]]*"oside.os-project"' "${project_root}/project.json"; then
        echo "error: ${label} project.json does not declare oside.os-project" >&2
        return 1
    fi

    echo "ok: ${label} canonical layout verified"
}

check_sample_build() {
    local sample_root="$1"

    echo "Checking sample build workflow: ${sample_root}"
    bash "${sample_root}/scripts/build.sh"

    local expected_artifacts=(
        "${sample_root}/build/tinyos-kernel.bin"
        "${sample_root}/build/tinyos.map"
        "${sample_root}/build/oside-build.log"
    )

    for artifact in "${expected_artifacts[@]}"; do
        if [[ ! -f "${artifact}" ]]; then
            echo "error: sample build did not produce $(basename "${artifact}")" >&2
            return 1
        fi
    done

    echo "ok: sample build artifacts verified"
}

TEMPLATE_ROOT="${ROOT_DIR}/templates/os-project"
SAMPLE_ROOT="${ROOT_DIR}/samples/tinyos"

check_project_layout "${TEMPLATE_ROOT}" "template"
check_project_layout "${SAMPLE_ROOT}" "sample"
check_sample_build "${SAMPLE_ROOT}"