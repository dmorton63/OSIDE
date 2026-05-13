#pragma once

#include <optional>
#include <string>
#include <string_view>
#include <vector>

namespace citadel::workspace {

struct ProjectTreeNode {
  std::string name;
  std::string path;
  bool is_directory = false;
  std::vector<ProjectTreeNode> children;
};

struct ProjectMetadata {
  std::string name;
  std::string type;
  std::string toolchain_prefix;
  std::string linker_script;
  std::string root_path;
  std::vector<std::string> include_paths;
  std::vector<std::string> modules;
  std::vector<ProjectTreeNode> tree;
};

class ProjectMetadataLoader {
public:
  [[nodiscard]] std::string Load(std::string_view root_path) const;
  [[nodiscard]] std::optional<ProjectMetadata> LoadMetadata(std::string_view root_path) const;
};

} // namespace citadel::workspace