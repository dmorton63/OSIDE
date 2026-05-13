#include <citadel/Application.hpp>
#include <citadel/debug/DebuggerSession.hpp>
#include <citadel/protocol/MessageRouter.hpp>
#include <citadel/protocol/RegisterHandlers.hpp>
#include <citadel/protocol/WebSocketServer.hpp>

#include <chrono>
#include <charconv>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <optional>
#include <sstream>
#include <string_view>
#include <thread>

#include <citadel/workspace/ProjectMetadataLoader.hpp>

namespace citadel {
namespace {

std::string ResolveSampleProjectRoot() {
  const auto current = std::filesystem::current_path();
  const auto local_candidate = current / "samples" / "tinyos";
  if (std::filesystem::exists(local_candidate)) {
    return local_candidate.string();
  }

  const auto parent_candidate = current.parent_path() / "samples" / "tinyos";
  if (std::filesystem::exists(parent_candidate)) {
    return parent_candidate.string();
  }

  return {};
}

std::string EscapeJson(std::string_view text) {
  std::string escaped;
  escaped.reserve(text.size() + 16U);

  for (const char character : text) {
    switch (character) {
    case '\\':
      escaped += "\\\\";
      break;
    case '"':
      escaped += "\\\"";
      break;
    case '\n':
      escaped += "\\n";
      break;
    default:
      escaped.push_back(character);
      break;
    }
  }

  return escaped;
}

std::string Envelope(std::string_view type, std::string_view payload_json) {
  std::ostringstream out;
  out << "{"
      << "\"protocolVersion\":\"1.0.0\","
      << "\"type\":\"" << type << "\","
      << "\"payload\":" << payload_json
      << "}";
  return out.str();
}

std::string ExtractJsonStringField(const std::string& text, std::string_view key) {
  const auto key_token = std::string("\"") + std::string(key) + "\"";
  const auto key_position = text.find(key_token);
  if (key_position == std::string::npos) {
    return {};
  }

  const auto colon_position = text.find(':', key_position + key_token.size());
  const auto first_quote = text.find('"', colon_position + 1U);
  if (colon_position == std::string::npos || first_quote == std::string::npos) {
    return {};
  }

  const auto second_quote = text.find('"', first_quote + 1U);
  if (second_quote == std::string::npos) {
    return {};
  }

  return text.substr(first_quote + 1U, second_quote - first_quote - 1U);
}

std::optional<int> ExtractJsonIntField(const std::string& text, std::string_view key) {
  const auto key_token = std::string("\"") + std::string(key) + "\"";
  const auto key_position = text.find(key_token);
  if (key_position == std::string::npos) {
    return std::nullopt;
  }

  const auto colon_position = text.find(':', key_position + key_token.size());
  if (colon_position == std::string::npos) {
    return std::nullopt;
  }

  const auto value_start = text.find_first_of("-0123456789", colon_position + 1U);
  if (value_start == std::string::npos) {
    return std::nullopt;
  }

  auto value_end = value_start;
  if (text[value_end] == '-') {
    ++value_end;
  }

  while (value_end < text.size() && text[value_end] >= '0' && text[value_end] <= '9') {
    ++value_end;
  }

  int value = 0;
  const auto token = std::string_view(text).substr(value_start, value_end - value_start);
  const auto parse_result = std::from_chars(token.data(), token.data() + token.size(), value);
  if (parse_result.ec != std::errc()) {
    return std::nullopt;
  }

  return value;
}

std::string BuildCompletePayload(std::string_view root_path, bool success) {
  std::ostringstream payload;
  payload << "{\"success\":" << (success ? "true" : "false") << ",\"diagnostics\":[],\"artifacts\":["
          << "{\"kind\":\"kernel\",\"path\":\"" << root_path << "/build/tinyos-kernel.bin\"},"
          << "{\"kind\":\"map\",\"path\":\"" << root_path << "/build/tinyos.map\"},"
          << "{\"kind\":\"log\",\"path\":\"" << root_path << "/build/oside-build.log\"}"
          << "]}";
  return payload.str();
}

struct RuntimeBreakpoint {
  std::string id;
  std::string file_id;
  int line = 0;
  bool enabled = true;
};

std::optional<std::string> ReadTextFile(const std::filesystem::path& file_path) {
  std::ifstream input(file_path);
  if (!input) {
    return std::nullopt;
  }

  std::ostringstream buffer;
  buffer << input.rdbuf();
  return buffer.str();
}

std::optional<std::filesystem::path> ResolveProjectFilePath(std::string_view root_path, std::string_view file_path) {
  if (root_path.empty() || file_path.empty()) {
    return std::nullopt;
  }

  const auto canonical_root = std::filesystem::weakly_canonical(std::filesystem::path(root_path));
  const auto candidate = canonical_root / std::filesystem::path(file_path);
  const auto canonical_candidate = std::filesystem::weakly_canonical(candidate);
  const auto root_text = canonical_root.generic_string();
  const auto candidate_text = canonical_candidate.generic_string();
  if (candidate_text != root_text && candidate_text.rfind(root_text + "/", 0) != 0) {
    return std::nullopt;
  }

  if (!std::filesystem::is_regular_file(canonical_candidate)) {
    return std::nullopt;
  }

  return canonical_candidate;
}

std::string WorkspaceTreePayload(const workspace::ProjectTreeNode& node) {
  std::ostringstream payload;
  payload << "{\"name\":\"" << EscapeJson(node.name)
          << "\",\"path\":\"" << EscapeJson(node.path)
          << "\",\"kind\":\"" << (node.is_directory ? "directory" : "file") << "\"";

  if (node.is_directory) {
    payload << ",\"children\":[";
    for (std::size_t index = 0; index < node.children.size(); ++index) {
      if (index > 0) {
        payload << ",";
      }
      payload << WorkspaceTreePayload(node.children[index]);
    }
    payload << "]";
  }

  payload << "}";
  return payload.str();
}

std::string ProjectMetadataPayload(const workspace::ProjectMetadata& metadata) {
  std::ostringstream payload;
  payload << "{\"name\":\"" << EscapeJson(metadata.name)
          << "\",\"type\":\"" << EscapeJson(metadata.type)
          << "\",\"toolchainPrefix\":\"" << EscapeJson(metadata.toolchain_prefix)
          << "\",\"linkerScript\":\"" << EscapeJson(metadata.linker_script)
          << "\",\"rootPath\":\"" << EscapeJson(metadata.root_path)
          << "\",\"includePaths\":[";
  for (std::size_t index = 0; index < metadata.include_paths.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }
    payload << "\"" << EscapeJson(metadata.include_paths[index]) << "\"";
  }
  payload << "],\"modules\":[";
  for (std::size_t index = 0; index < metadata.modules.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }
    payload << "\"" << EscapeJson(metadata.modules[index]) << "\"";
  }
  payload << "],\"tree\":[";
  for (std::size_t index = 0; index < metadata.tree.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }
    payload << WorkspaceTreePayload(metadata.tree[index]);
  }
  payload << "]}";
  return payload.str();
}

std::string ProjectFilePayload(std::string_view file_path, std::string_view content) {
  std::ostringstream payload;
  payload << "{\"filePath\":\"" << EscapeJson(file_path)
          << "\",\"content\":\"" << EscapeJson(content)
          << "\"}";
  return payload.str();
}

std::string BreakpointsPayload(const std::vector<RuntimeBreakpoint>& breakpoints) {
  std::ostringstream payload;
  payload << "{\"breakpoints\":[";
  for (std::size_t index = 0; index < breakpoints.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }

    const auto& breakpoint = breakpoints[index];
    payload << "{\"id\":\"" << EscapeJson(breakpoint.id)
            << "\",\"fileId\":\"" << EscapeJson(breakpoint.file_id)
            << "\",\"line\":" << breakpoint.line
            << ",\"enabled\":" << (breakpoint.enabled ? "true" : "false")
            << "}";
  }
  payload << "]}";
  return payload.str();
}

std::string ResolveDebugTarget(std::string_view target) {
  if (!target.empty()) {
    const std::filesystem::path candidate(target);
    if (candidate.is_absolute()) {
      return candidate.string();
    }

    const auto current = std::filesystem::current_path();
    const auto local_candidate = current / candidate;
    if (std::filesystem::exists(local_candidate)) {
      return local_candidate.string();
    }

    const auto parent_candidate = current.parent_path() / candidate;
    if (std::filesystem::exists(parent_candidate)) {
      return parent_candidate.string();
    }

    return candidate.string();
  }

  const auto sample_project_root = ResolveSampleProjectRoot();
  if (sample_project_root.empty()) {
    return "samples/tinyos/build/tinyos-kernel.elf";
  }

  return sample_project_root + "/build/tinyos-kernel.elf";
}

std::string DebugSessionStartedPayload(std::string_view target, std::string_view status) {
  std::ostringstream payload;
  payload << "{\"sessionId\":\"tinyos-session\",\"status\":\""
          << status
          << "\",\"target\":\""
          << EscapeJson(target)
          << "\",\"moduleIds\":[\"kernel\"]}";
  return payload.str();
}

std::string DebugPausedPayload(const debug::DebugSnapshot& snapshot) {
  std::ostringstream payload;
  payload << "{\"thread\":{\"threadId\":\"thread-0\",\"name\":\"bootstrap\",\"status\":\"paused\",\"activeFrameId\":\""
          << EscapeJson(snapshot.frame.frameId)
          << "\"},\"frame\":{\"frameId\":\""
          << EscapeJson(snapshot.frame.frameId)
          << "\",\"filePath\":\""
          << EscapeJson(snapshot.frame.filePath)
          << "\",\"line\":"
          << snapshot.frame.line
          << ",\"functionName\":\""
          << EscapeJson(snapshot.frame.functionName)
          << "\"}}";
  return payload.str();
}

std::string DebugCallStackPayload(const debug::DebugSnapshot& snapshot) {
  std::ostringstream payload;
  payload << "{\"frames\":[{\"frameId\":\""
          << EscapeJson(snapshot.frame.frameId)
          << "\",\"filePath\":\""
          << EscapeJson(snapshot.frame.filePath)
          << "\",\"line\":"
          << snapshot.frame.line
          << ",\"functionName\":\""
          << EscapeJson(snapshot.frame.functionName)
          << "\"}]}";
  return payload.str();
}

std::string DebugVariablesPayload(const debug::DebugSnapshot& snapshot) {
  std::ostringstream payload;
  payload << "{\"variables\":[";
  for (std::size_t index = 0; index < snapshot.variables.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }

    const auto& variable = snapshot.variables[index];
    payload << "{\"name\":\"" << EscapeJson(variable.name)
            << "\",\"type\":\"" << EscapeJson(variable.type)
            << "\",\"value\":\"" << EscapeJson(variable.value)
            << "\"}";
  }
  payload << "]}";
  return payload.str();
}

std::string DebugRegistersPayload(const debug::DebugSnapshot& snapshot) {
  std::ostringstream payload;
  payload << "{\"registers\":[";
  for (std::size_t index = 0; index < snapshot.registers.size(); ++index) {
    if (index > 0) {
      payload << ",";
    }

    const auto& reg = snapshot.registers[index];
    payload << "{\"name\":\"" << EscapeJson(reg.name)
            << "\",\"value\":\"" << EscapeJson(reg.value)
            << "\",\"category\":\"gpr\",\"changed\":" << (reg.changed ? "true" : "false")
            << "}";
  }
  payload << "]}";
  return payload.str();
}

void PublishPausedSnapshot(protocol::WebSocketServer& server, const debug::DebugSnapshot& snapshot) {
  server.PublishMessage(Envelope("debug.callStackUpdated", DebugCallStackPayload(snapshot)));
  server.PublishMessage(Envelope("debug.variablesUpdated", DebugVariablesPayload(snapshot)));
  server.PublishMessage(Envelope("debug.registersUpdated", DebugRegistersPayload(snapshot)));
  server.PublishMessage(Envelope("debug.paused", DebugPausedPayload(snapshot)));
}

} // namespace

int Application::Run() {
  protocol::MessageRouter router;
  protocol::RegisterHandlers(router);
  debug::DebuggerSession debugger_session;
  workspace::ProjectMetadataLoader metadata_loader;
  std::vector<RuntimeBreakpoint> breakpoints = {
      {"bp-src-kernel-3", "src/kernel.cpp", 3, true},
  };

  protocol::WebSocketServer server;
  server.SetMessageHandler([&router, &server, &debugger_session, &metadata_loader, &breakpoints](std::string_view raw_message) {
    const std::string raw(raw_message);
    const auto type = ExtractJsonStringField(raw, "type");
    if (type.empty()) {
      return;
    }

    if (type == "build.start") {
      const auto root_path = ExtractJsonStringField(raw, "rootPath");
      server.PublishMessage(Envelope("build.output", "{\"stream\":\"stdout\",\"text\":\"Build requested\"}"));
      const auto result = router.Dispatch(type, root_path);
      if (!result.has_value()) {
        return;
      }

      const bool success = result->rfind("error:", 0) != 0;
      server.PublishMessage(Envelope("build.output", std::string("{\"stream\":\"stdout\",\"text\":\"") + EscapeJson(*result) + "\"}"));
      server.PublishMessage(Envelope("build.complete", BuildCompletePayload(root_path.empty() ? "samples/tinyos" : root_path, success)));
      return;
    }

    if (type == "project.loadMetadata") {
      const auto root_path = ExtractJsonStringField(raw, "rootPath");
      const auto result = router.Dispatch(type, root_path);
      if (!result.has_value() || result->rfind("error:", 0) == 0) {
        return;
      }

      const auto metadata = metadata_loader.LoadMetadata(root_path);
      if (!metadata.has_value()) {
        return;
      }

      server.PublishMessage(Envelope("project.metadataLoaded", ProjectMetadataPayload(*metadata)));
      return;
    }

    if (type == "project.readFile") {
      const auto root_path = ExtractJsonStringField(raw, "rootPath");
      const auto file_path = ExtractJsonStringField(raw, "filePath");
      const auto resolved_file = ResolveProjectFilePath(root_path, file_path);
      if (!resolved_file.has_value()) {
        return;
      }

      const auto content = ReadTextFile(*resolved_file);
      if (!content.has_value()) {
        return;
      }

      server.PublishMessage(Envelope("project.fileLoaded", ProjectFilePayload(file_path, *content)));
      return;
    }

    if (type == "debug.setBreakpoint" || type == "debug.clearBreakpoint") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      const auto file_id = ExtractJsonStringField(raw, "fileId");
      const auto line = ExtractJsonIntField(raw, "line");
      if (file_id.empty() || !line.has_value()) {
        return;
      }

      const auto existing = std::find_if(breakpoints.begin(), breakpoints.end(), [&](const RuntimeBreakpoint& breakpoint) {
        return breakpoint.file_id == file_id && breakpoint.line == *line;
      });

      if (type == "debug.setBreakpoint") {
        if (existing == breakpoints.end()) {
          breakpoints.push_back(RuntimeBreakpoint{
              "bp-" + file_id + "-" + std::to_string(*line),
              file_id,
              *line,
              true,
          });
        } else {
          existing->enabled = true;
        }
      } else if (existing != breakpoints.end()) {
        breakpoints.erase(existing);
      }

      server.PublishMessage(Envelope("debug.breakpointsUpdated", BreakpointsPayload(breakpoints)));
      return;
    }

    if (type == "debug.start") {
      const auto resolved_target = ResolveDebugTarget(ExtractJsonStringField(raw, "target"));
      const auto snapshot = debugger_session.Start(resolved_target);
      if (!snapshot.has_value()) {
        return;
      }

      server.PublishMessage(Envelope("debug.sessionStarted", DebugSessionStartedPayload(resolved_target, "paused")));
      server.PublishMessage(Envelope("debug.breakpointsUpdated", BreakpointsPayload(breakpoints)));
      PublishPausedSnapshot(server, *snapshot);
      return;
    }

    if (type == "debug.pause") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      const auto snapshot = debugger_session.Pause();
      if (!snapshot.has_value()) {
        return;
      }

      PublishPausedSnapshot(server, *snapshot);
      return;
    }

    if (type == "debug.continue") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      server.PublishMessage(Envelope("debug.resumed", "{\"sessionId\":\"tinyos-session\"}"));
      const auto snapshot = debugger_session.Continue();
      if (!snapshot.has_value()) {
        return;
      }

      if (snapshot->exited) {
        server.PublishMessage(Envelope("debug.sessionEnded", "{\"sessionId\":\"tinyos-session\"}"));
      }
      return;
    }

    if (type == "debug.stepInto") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      const auto snapshot = debugger_session.StepInto();
      if (!snapshot.has_value()) {
        return;
      }

      if (snapshot->exited) {
        server.PublishMessage(Envelope("debug.sessionEnded", "{\"sessionId\":\"tinyos-session\"}"));
        return;
      }

      PublishPausedSnapshot(server, *snapshot);
      return;
    }

    if (type == "debug.stepOver") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      const auto snapshot = debugger_session.StepOver();
      if (!snapshot.has_value()) {
        return;
      }

      if (snapshot->exited) {
        server.PublishMessage(Envelope("debug.sessionEnded", "{\"sessionId\":\"tinyos-session\"}"));
        return;
      }

      PublishPausedSnapshot(server, *snapshot);
      return;
    }

    if (type == "debug.stepOut") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      const auto snapshot = debugger_session.StepOut();
      if (!snapshot.has_value()) {
        return;
      }

      if (snapshot->exited) {
        server.PublishMessage(Envelope("debug.sessionEnded", "{\"sessionId\":\"tinyos-session\"}"));
        return;
      }

      PublishPausedSnapshot(server, *snapshot);
      return;
    }

    if (type == "debug.stop") {
      if (!router.Dispatch(type, "").has_value()) {
        return;
      }

      debugger_session.Stop();
      server.PublishMessage(Envelope("debug.sessionEnded", "{\"sessionId\":\"tinyos-session\"}"));
    }
  });
  server.Start("127.0.0.1:9001");

  const auto sample_project_root = ResolveSampleProjectRoot();

  std::cout << "oside-backend bootstrap started" << std::endl;
  std::cout << "handler for build.start registered: " << (router.CanHandle("build.start") ? "yes" : "no") << std::endl;
  const auto build_result = router.Dispatch("build.start", sample_project_root);
  std::cout << "dispatch result for build.start: " << (build_result.has_value() ? *build_result : "no handler") << std::endl;
  const auto project_result = router.Dispatch("project.loadMetadata", sample_project_root);
  std::cout << "dispatch result for project.loadMetadata: " << (project_result.has_value() ? *project_result : "no handler") << std::endl;

  const auto startup_metadata = metadata_loader.LoadMetadata(sample_project_root);
  if (startup_metadata.has_value()) {
    server.PublishMessage(Envelope("project.metadataLoaded", ProjectMetadataPayload(*startup_metadata)));
  }

  const bool one_shot_mode = std::getenv("OSIDE_ONESHOT") != nullptr;
  if (one_shot_mode) {
    server.Stop();
    return 0;
  }

  while (server.IsRunning()) {
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
  }

  return 0;
}

} // namespace citadel
