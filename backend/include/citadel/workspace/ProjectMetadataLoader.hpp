#pragma once

#include <string>
#include <string_view>

namespace citadel::workspace {

class ProjectMetadataLoader {
public:
  [[nodiscard]] std::string Load(std::string_view root_path) const;
};

} // namespace citadel::workspace