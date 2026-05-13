# oside

Linux-only v1 repository for The OS IDE.

This scaffold contains:
- a shared protocol contract in `protocol/`
- a React/TypeScript frontend in `frontend/`
- a C++ backend daemon in `backend/`
- placeholders for templates, samples, docs, scripts, and internal tools

Validation:
- Run `./scripts/validate.sh` from the repo root to validate the protocol install, frontend install/typecheck/build/audit, and backend CMake build in one pass.
- `./scripts/validate.sh` also verifies that the canonical template and `samples/tinyos` sample match the Version 1 OS IDE Project layout and that the sample build produces expected artifacts.
- In VS Code, run the `Validate Repo` task for the same workflow.

Development:
- Run `./scripts/build.sh` from the repo root to install package dependencies, build the frontend production bundle, and build the backend binary.
- Run `./scripts/run.sh` from the repo root to start the backend binary, building it first if needed.
- Run `./scripts/dev.sh` from the repo root to build and launch the backend, then start the frontend Vite dev server.
- Run `./scripts/clean.sh` from the repo root to remove generated build outputs and installed package directories.
- In VS Code, run the `Run Repo`, `Build Repo`, `Dev Repo`, and `Clean Repo` tasks for the same workflows.
