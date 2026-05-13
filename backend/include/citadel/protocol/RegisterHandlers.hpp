#pragma once

namespace citadel::protocol {

class MessageRouter;

void RegisterHandlers(MessageRouter& router);

} // namespace citadel::protocol
