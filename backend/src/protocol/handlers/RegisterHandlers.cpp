#include <citadel/protocol/RegisterHandlers.hpp>
#include <citadel/compiler/BuildDriver.hpp>
#include <citadel/protocol/MessageRouter.hpp>
#include <citadel/workspace/ProjectMetadataLoader.hpp>

namespace citadel::protocol {

void RegisterHandlers(MessageRouter& router) {
  router.Register("debug.start", [](std::string_view payload) {
    return payload.empty() ? std::string("debug.start accepted") : std::string(payload);
  });
  router.Register("debug.pause", [](std::string_view) {
    return std::string("debug.pause accepted");
  });
  router.Register("debug.continue", [](std::string_view) {
    return std::string("debug.continue accepted");
  });
  router.Register("debug.stepInto", [](std::string_view) {
    return std::string("debug.stepInto accepted");
  });
  router.Register("debug.stepOver", [](std::string_view) {
    return std::string("debug.stepOver accepted");
  });
  router.Register("debug.stepOut", [](std::string_view) {
    return std::string("debug.stepOut accepted");
  });
  router.Register("debug.stop", [](std::string_view) {
    return std::string("debug.stop accepted");
  });
  router.Register("build.start", [](std::string_view payload) {
    return compiler::BuildDriver().Build(payload);
  });
  router.Register("project.loadMetadata", [](std::string_view payload) {
    return workspace::ProjectMetadataLoader().Load(payload);
  });
}

} // namespace citadel::protocol
