#include <citadel/debug/DebuggerSession.hpp>

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <regex>
#include <sstream>
#include <string_view>
#include <vector>

namespace citadel::debug {
namespace {

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

std::optional<std::string> ReadFile(const std::filesystem::path& file_path) {
  std::ifstream input(file_path);
  if (!input) {
    return std::nullopt;
  }

  std::ostringstream buffer;
  buffer << input.rdbuf();
  return buffer.str();
}

std::string InferType(const std::string& value) {
  if (value == "true" || value == "false") {
    return "bool";
  }

  static const std::regex integer_pattern("^-?[0-9]+$");
  if (std::regex_match(value, integer_pattern)) {
    return "int";
  }

  return "unknown";
}

std::string NormalizeFunctionName(std::string text) {
  const auto in_position = text.rfind(" in ");
  if (in_position != std::string::npos) {
    text = text.substr(in_position + 4U);
  }

  const auto argument_list = text.rfind(" (");
  if (argument_list != std::string::npos) {
    text.erase(argument_list);
  }

  return text;
}

std::optional<DebugSnapshot> ParseSnapshot(const std::string& output) {
  DebugSnapshot snapshot;
  if (output.find("exited normally") != std::string::npos || output.find("exited with code") != std::string::npos) {
    snapshot.exited = true;
    return snapshot;
  }

  std::smatch frame_match;
  const std::regex frame_pattern("#0\\s+(.+?)\\s+at\\s+([^:\\n]+):(\\d+)");
  if (!std::regex_search(output, frame_match, frame_pattern)) {
    return std::nullopt;
  }

  snapshot.frame.functionName = NormalizeFunctionName(frame_match[1].str());
  snapshot.frame.filePath = frame_match[2].str();
  snapshot.frame.line = std::stoi(frame_match[3].str());
  snapshot.frame.frameId = snapshot.frame.functionName + ":" + std::to_string(snapshot.frame.line);

  std::istringstream input(output);
  std::string line;
  const std::regex local_pattern("^([A-Za-z_][A-Za-z0-9_]*) = (.+)$");
  const std::regex register_pattern("^(rip|rsp)\\s+(0x[0-9a-fA-F]+).*$");
  while (std::getline(input, line)) {
    std::smatch local_match;
    if (std::regex_match(line, local_match, local_pattern)) {
      const auto name = local_match[1].str();
      const auto value = local_match[2].str();
      snapshot.variables.push_back(DebugVariable{name, InferType(value), value});
      continue;
    }

    std::smatch register_match;
    if (std::regex_match(line, register_match, register_pattern)) {
      snapshot.registers.push_back(DebugRegister{register_match[1].str(), register_match[2].str(), false});
    }
  }

  return snapshot;
}

std::optional<DebugSnapshot> RunGdb(const std::string& target, const std::vector<std::string>& commands) {
  const auto output_path = std::filesystem::temp_directory_path() / "oside-gdb-output.txt";

  std::ostringstream command;
  command << "gdb --batch --quiet " << QuoteShell(target);
  for (const auto& entry : commands) {
    command << " -ex " << QuoteShell(entry);
  }
  command << " > " << QuoteShell(output_path.string()) << " 2>&1";

  const int exit_code = std::system(command.str().c_str());
  const auto output = ReadFile(output_path);
  std::error_code error;
  std::filesystem::remove(output_path, error);
  if (!output.has_value()) {
    return std::nullopt;
  }

  auto snapshot = ParseSnapshot(*output);
  if (!snapshot.has_value() && exit_code == 0) {
    DebugSnapshot exited_snapshot;
    exited_snapshot.exited = true;
    return exited_snapshot;
  }

  return snapshot;
}

} // namespace

std::optional<DebugSnapshot> DebuggerSession::Start(const std::string& target) {
  if (!std::filesystem::is_regular_file(target)) {
    return std::nullopt;
  }

  target_ = target;
  stage_ = Stage::kernel_entry;
  last_registers_.clear();
  return CaptureAtCurrentStage();
}

std::optional<DebugSnapshot> DebuggerSession::Pause() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  return CaptureAtCurrentStage();
}

std::optional<DebugSnapshot> DebuggerSession::Continue() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  auto snapshot = RunForCurrentStage({"continue", "frame", "info locals", "info registers rip rsp"}, true);
  if (!snapshot.has_value()) {
    return std::nullopt;
  }

  stage_ = Stage::stopped;
  last_registers_.clear();
  return snapshot;
}

std::optional<DebugSnapshot> DebuggerSession::StepInto() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  std::vector<std::string> commands;
  Stage next_stage = stage_;
  switch (stage_) {
  case Stage::kernel_entry:
    commands = {"step", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::in_detect_boot_stage;
    break;
  case Stage::after_boot_stage_assign:
    commands = {"step", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::in_initialize_scheduler;
    break;
  case Stage::in_detect_boot_stage:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_boot_stage_assign;
    break;
  case Stage::in_initialize_scheduler:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_scheduler_assign;
    break;
  case Stage::after_scheduler_assign:
    commands = {"step", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_status_code_assign;
    break;
  case Stage::after_status_code_assign:
    commands = {"step", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::host_main_return;
    break;
  case Stage::host_main_return:
    commands = {"step", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::stopped;
    break;
  case Stage::stopped:
    return std::nullopt;
  }

  auto snapshot = RunForCurrentStage(commands, next_stage == Stage::stopped);
  if (!snapshot.has_value()) {
    return std::nullopt;
  }

  if (snapshot->exited || next_stage == Stage::stopped) {
    stage_ = Stage::stopped;
    last_registers_.clear();
    return snapshot;
  }

  stage_ = next_stage;
  return snapshot;
}

std::optional<DebugSnapshot> DebuggerSession::StepOver() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  std::vector<std::string> commands;
  Stage next_stage = stage_;
  switch (stage_) {
  case Stage::kernel_entry:
    commands = {"next", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_boot_stage_assign;
    break;
  case Stage::in_detect_boot_stage:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_boot_stage_assign;
    break;
  case Stage::after_boot_stage_assign:
    commands = {"next", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_scheduler_assign;
    break;
  case Stage::in_initialize_scheduler:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_scheduler_assign;
    break;
  case Stage::after_scheduler_assign:
    commands = {"next", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_status_code_assign;
    break;
  case Stage::after_status_code_assign:
    commands = {"next", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::host_main_return;
    break;
  case Stage::host_main_return:
    commands = {"next", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::stopped;
    break;
  case Stage::stopped:
    return std::nullopt;
  }

  auto snapshot = RunForCurrentStage(commands, next_stage == Stage::stopped);
  if (!snapshot.has_value()) {
    return std::nullopt;
  }

  if (snapshot->exited || next_stage == Stage::stopped) {
    stage_ = Stage::stopped;
    last_registers_.clear();
    return snapshot;
  }

  stage_ = next_stage;
  return snapshot;
}

std::optional<DebugSnapshot> DebuggerSession::StepOut() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  std::vector<std::string> commands;
  Stage next_stage = stage_;
  switch (stage_) {
  case Stage::in_detect_boot_stage:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_boot_stage_assign;
    break;
  case Stage::in_initialize_scheduler:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::after_scheduler_assign;
    break;
  case Stage::kernel_entry:
  case Stage::after_boot_stage_assign:
  case Stage::after_scheduler_assign:
  case Stage::after_status_code_assign:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::host_main_return;
    break;
  case Stage::host_main_return:
    commands = {"finish", "frame", "info locals", "info registers rip rsp"};
    next_stage = Stage::stopped;
    break;
  case Stage::stopped:
    return std::nullopt;
  }

  auto snapshot = RunForCurrentStage(commands, next_stage == Stage::stopped);
  if (!snapshot.has_value()) {
    return std::nullopt;
  }

  if (snapshot->exited || next_stage == Stage::stopped) {
    stage_ = Stage::stopped;
    last_registers_.clear();
    return snapshot;
  }

  stage_ = next_stage;
  return snapshot;
}

void DebuggerSession::Stop() {
  stage_ = Stage::stopped;
  target_.clear();
  last_registers_.clear();
}

bool DebuggerSession::HasActiveSession() const {
  return stage_ != Stage::stopped && !target_.empty();
}

const std::string& DebuggerSession::Target() const {
  return target_;
}

std::optional<DebugSnapshot> DebuggerSession::CaptureAtCurrentStage() {
  if (!HasActiveSession()) {
    return std::nullopt;
  }

  return RunForCurrentStage({"frame", "info locals", "info registers rip rsp"}, false);
}

std::optional<DebugSnapshot> DebuggerSession::RunForCurrentStage(const std::vector<std::string>& extra_commands, bool expect_exit) {
  std::vector<std::string> commands = {
      "set pagination off",
      "set confirm off",
      "break KernelMain",
      "run",
  };

  const auto replay = ReplayCommandsForStage(stage_);
  commands.insert(commands.end(), replay.begin(), replay.end());
  commands.insert(commands.end(), extra_commands.begin(), extra_commands.end());

  auto snapshot = RunGdb(target_, commands);
  if (!snapshot.has_value()) {
    return std::nullopt;
  }

  if (snapshot->exited || expect_exit) {
    snapshot->exited = snapshot->exited || expect_exit;
    return snapshot;
  }

  UpdateRegisterChanges(&*snapshot);
  return snapshot;
}

std::vector<std::string> DebuggerSession::ReplayCommandsForStage(Stage stage) const {
  switch (stage) {
  case Stage::kernel_entry:
    return {};
  case Stage::in_detect_boot_stage:
    return {"step"};
  case Stage::after_boot_stage_assign:
    return {"next"};
  case Stage::in_initialize_scheduler:
    return {"next", "step"};
  case Stage::after_scheduler_assign:
    return {"next", "next"};
  case Stage::after_status_code_assign:
    return {"next", "next", "next"};
  case Stage::host_main_return:
    return {"finish"};
  case Stage::stopped:
    return {};
  }

  return {};
}

void DebuggerSession::UpdateRegisterChanges(DebugSnapshot* snapshot) {
  for (auto& current : snapshot->registers) {
    const auto previous = std::find_if(last_registers_.begin(), last_registers_.end(), [&](const DebugRegister& entry) {
      return entry.name == current.name;
    });
    current.changed = previous == last_registers_.end() || previous->value != current.value;
  }

  last_registers_ = snapshot->registers;
}

} // namespace citadel::debug