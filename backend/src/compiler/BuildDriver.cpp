#include <citadel/compiler/BuildDriver.hpp>
#include <citadel/workspace/ProjectMetadataLoader.hpp>

#include <cstdlib>
#include <filesystem>
#include <sstream>
#include <string>
#include <vector>

namespace citadel::compiler {
namespace {

std::filesystem::path ResolveProjectRoot(std::string_view root_path) {
  const std::filesystem::path candidate(root_path);
  if (candidate.is_absolute()) {
    return candidate;
  }

  const auto current = std::filesystem::current_path();
  const auto local_candidate = current / candidate;
  if (std::filesystem::exists(local_candidate)) {
    return local_candidate;
  }

  const auto parent_candidate = current.parent_path() / candidate;
  if (std::filesystem::exists(parent_candidate)) {
    return parent_candidate;
  }

  return candidate;
}

std::string QuoteShell(std::string_view value) {
  std::string quoted = "'";
  for (const char character : value) {
    if (character == '\'') {
      quoted += "'\\''";
      continue;
    }

    quoted += character;
  }
  quoted += "'";
  return quoted;
}

std::vector<std::filesystem::path> CollectArtifacts(const std::filesystem::path& build_directory) {
  std::vector<std::filesystem::path> artifacts;
  if (!std::filesystem::is_directory(build_directory)) {
    return artifacts;
  }

  for (const auto& entry : std::filesystem::directory_iterator(build_directory)) {
    if (!entry.is_regular_file()) {
      continue;
    }

    const auto file_name = entry.path().filename().string();
    if (file_name == "README.md" || file_name == ".gitkeep") {
      continue;
    }

    artifacts.push_back(entry.path().filename());
  }

  return artifacts;
}

} // namespace

std::string BuildDriver::Build(std::string_view root_path) const {
  const auto metadata_result = workspace::ProjectMetadataLoader().Load(root_path);
  if (metadata_result.rfind("error:", 0) == 0) {
    return metadata_result;
  }

  const auto project_root = ResolveProjectRoot(root_path);
  const auto build_script = project_root / "scripts" / "build.sh";
  const auto build_directory = project_root / "build";
  const auto build_log = build_directory / "oside-build.log";

  if (!std::filesystem::is_regular_file(build_script)) {
    return "error: missing build script";
  }

  std::filesystem::create_directories(build_directory);

  const auto command = std::string("cd ") + QuoteShell(project_root.string()) + " && bash " + QuoteShell(build_script.string()) +
                       " > " + QuoteShell(build_log.string()) + " 2>&1";
  const int exit_code = std::system(command.c_str());
  if (exit_code != 0) {
    return "error: build script failed";
  }

  const auto artifacts = CollectArtifacts(build_directory);
  std::ostringstream result;
  result << "build complete: success artifacts=" << artifacts.size();
  if (!artifacts.empty()) {
    result << " [";
    for (std::size_t index = 0; index < artifacts.size(); ++index) {
      if (index > 0) {
        result << ", ";
      }
      result << artifacts[index].string();
    }
    result << "]";
  }

  return result.str();
}

} // namespace citadel::compiler