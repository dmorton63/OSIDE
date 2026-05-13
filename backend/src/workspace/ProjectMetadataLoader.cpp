#include <citadel/workspace/ProjectMetadataLoader.hpp>

#include <algorithm>
#include <filesystem>
#include <fstream>
#include <optional>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace citadel::workspace {
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

std::optional<std::string> ParseStringField(const std::string& text, const std::string& key) {
  const std::regex pattern("\"" + key + "\"\\s*:\\s*\"([^\"]+)\"");
  std::smatch match;
  if (!std::regex_search(text, match, pattern)) {
    return std::nullopt;
  }

  return match[1].str();
}

std::optional<std::vector<std::string>> ParseStringArrayField(const std::string& text, const std::string& key) {
  const std::regex array_pattern("\"" + key + "\"\\s*:\\s*\\[([^\\]]*)\\]");
  std::smatch array_match;
  if (!std::regex_search(text, array_match, array_pattern)) {
    return std::nullopt;
  }

  std::vector<std::string> values;
  const std::string array_text = array_match[1].str();
  const std::regex item_pattern("\"([^\"]+)\"");
  for (std::sregex_iterator iter(array_text.begin(), array_text.end(), item_pattern); iter != std::sregex_iterator(); ++iter) {
    values.push_back((*iter)[1].str());
  }

  return values;
}

std::optional<std::string> ReadFile(const std::filesystem::path& file_path) {
  std::ifstream input(file_path);
  if (!input) {
    return std::nullopt;
  }

  std::ostringstream buffer;
  buffer << input.rdbuf();
  return buffer.str();
}

ProjectTreeNode BuildTreeNode(const std::filesystem::path& project_root, const std::filesystem::path& path) {
  ProjectTreeNode node;
  node.name = path.filename().string();
  node.path = std::filesystem::relative(path, project_root).generic_string();
  node.is_directory = std::filesystem::is_directory(path);

  if (!node.is_directory) {
    return node;
  }

  std::vector<std::filesystem::path> children;
  for (const auto& entry : std::filesystem::directory_iterator(path)) {
    children.push_back(entry.path());
  }

  std::sort(children.begin(), children.end(), [](const auto& left, const auto& right) {
    const bool left_directory = std::filesystem::is_directory(left);
    const bool right_directory = std::filesystem::is_directory(right);
    if (left_directory != right_directory) {
      return left_directory > right_directory;
    }

    return left.filename().string() < right.filename().string();
  });

  for (const auto& child : children) {
    node.children.push_back(BuildTreeNode(project_root, child));
  }

  return node;
}

} // namespace

std::string ProjectMetadataLoader::Load(std::string_view root_path) const {
  const auto metadata = LoadMetadata(root_path);
  if (!metadata.has_value()) {
    return "error: invalid project metadata";
  }

  std::ostringstream summary;
  summary << "metadata loaded: " << metadata->name << " toolchain=" << metadata->toolchain_prefix << " includePaths="
          << metadata->include_paths.size() << " modules=" << metadata->modules.size();
  return summary.str();
}

std::optional<ProjectMetadata> ProjectMetadataLoader::LoadMetadata(std::string_view root_path) const {
  if (root_path.empty()) {
    return std::nullopt;
  }

  const auto project_root = ResolveProjectRoot(root_path);
  if (!std::filesystem::exists(project_root)) {
    return std::nullopt;
  }

  constexpr const char* required_directories[] = {"src", "include", "modules", "boot", "build", "scripts"};
  for (const auto* directory : required_directories) {
    if (!std::filesystem::is_directory(project_root / directory)) {
      return std::nullopt;
    }
  }

  const auto project_file = project_root / "project.json";
  const auto linker_script = project_root / "linker.ld";
  if (!std::filesystem::is_regular_file(project_file) || !std::filesystem::is_regular_file(linker_script)) {
    return std::nullopt;
  }

  const auto contents = ReadFile(project_file);
  if (!contents.has_value()) {
    return std::nullopt;
  }

  ProjectMetadata metadata;
  const auto name = ParseStringField(*contents, "name");
  const auto type = ParseStringField(*contents, "type");
  const auto toolchain_prefix = ParseStringField(*contents, "toolchainPrefix");
  const auto linker_script_path = ParseStringField(*contents, "linkerScript");
  const auto include_paths = ParseStringArrayField(*contents, "includePaths");
  const auto modules = ParseStringArrayField(*contents, "modules");

  if (!name.has_value() || !type.has_value() || !toolchain_prefix.has_value() || !linker_script_path.has_value() ||
      !include_paths.has_value() || !modules.has_value()) {
    return std::nullopt;
  }

  if (*type != "oside.os-project" || !std::filesystem::exists(project_root / *linker_script_path)) {
    return std::nullopt;
  }

  metadata.name = *name;
  metadata.type = *type;
  metadata.toolchain_prefix = *toolchain_prefix;
  metadata.linker_script = *linker_script_path;
  metadata.root_path = project_root.generic_string();
  metadata.include_paths = *include_paths;
  metadata.modules = *modules;

  std::vector<std::filesystem::path> top_level_entries;
  for (const auto& entry : std::filesystem::directory_iterator(project_root)) {
    top_level_entries.push_back(entry.path());
  }

  std::sort(top_level_entries.begin(), top_level_entries.end(), [](const auto& left, const auto& right) {
    const bool left_directory = std::filesystem::is_directory(left);
    const bool right_directory = std::filesystem::is_directory(right);
    if (left_directory != right_directory) {
      return left_directory > right_directory;
    }

    return left.filename().string() < right.filename().string();
  });

  for (const auto& entry : top_level_entries) {
    metadata.tree.push_back(BuildTreeNode(project_root, entry));
  }

  return metadata;
  }

} // namespace citadel::workspace