#pragma once

#include <functional>
#include <optional>
#include <string>
#include <string_view>
#include <unordered_map>

namespace citadel::protocol {

class MessageRouter {
public:
  using Handler = std::function<std::string(std::string_view payload)>;

  void Register(const std::string& message_type, Handler handler);
  [[nodiscard]] bool CanHandle(const std::string& message_type) const;
  [[nodiscard]] std::optional<std::string> Dispatch(const std::string& message_type, std::string_view payload = {}) const;

private:
  std::unordered_map<std::string, Handler> handlers_;
};

} // namespace citadel::protocol
