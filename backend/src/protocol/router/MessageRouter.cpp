#include <citadel/protocol/MessageRouter.hpp>

namespace citadel::protocol {

void MessageRouter::Register(const std::string& message_type, Handler handler) {
  handlers_.insert_or_assign(message_type, std::move(handler));
}

bool MessageRouter::CanHandle(const std::string& message_type) const {
  return handlers_.contains(message_type);
}

std::optional<std::string> MessageRouter::Dispatch(const std::string& message_type, std::string_view payload) const {
  const auto handler = handlers_.find(message_type);
  if (handler == handlers_.end()) {
    return std::nullopt;
  }

  return handler->second(payload);
}

} // namespace citadel::protocol
