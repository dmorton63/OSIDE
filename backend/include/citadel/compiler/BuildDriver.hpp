#pragma once

#include <string>
#include <string_view>

namespace citadel::compiler {

class BuildDriver {
public:
  [[nodiscard]] std::string Build(std::string_view root_path) const;
};

} // namespace citadel::compiler