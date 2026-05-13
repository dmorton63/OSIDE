#pragma once

#include <optional>
#include <string>
#include <vector>

namespace citadel::debug {

struct DebugFrame {
  std::string frameId;
  std::string filePath;
  int line = 0;
  std::string functionName;
};

struct DebugVariable {
  std::string name;
  std::string type;
  std::string value;
};

struct DebugRegister {
  std::string name;
  std::string value;
  bool changed = false;
};

struct DebugSnapshot {
  bool exited = false;
  DebugFrame frame;
  std::vector<DebugVariable> variables;
  std::vector<DebugRegister> registers;
};

class DebuggerSession {
public:
  std::optional<DebugSnapshot> Start(const std::string& target);
  std::optional<DebugSnapshot> Pause();
  std::optional<DebugSnapshot> Continue();
  std::optional<DebugSnapshot> StepInto();
  std::optional<DebugSnapshot> StepOver();
  std::optional<DebugSnapshot> StepOut();
  void Stop();

  [[nodiscard]] bool HasActiveSession() const;
  [[nodiscard]] const std::string& Target() const;

private:
  enum class Stage {
    stopped,
    kernel_entry,
    in_detect_boot_stage,
    after_boot_stage_assign,
    in_initialize_scheduler,
    after_scheduler_assign,
    after_status_code_assign,
    host_main_return,
  };

  std::optional<DebugSnapshot> CaptureAtCurrentStage();
  std::optional<DebugSnapshot> RunForCurrentStage(const std::vector<std::string>& extra_commands, bool expect_exit);
  std::vector<std::string> ReplayCommandsForStage(Stage stage) const;
  void UpdateRegisterChanges(DebugSnapshot* snapshot);

  Stage stage_ = Stage::stopped;
  std::string target_;
  std::vector<DebugRegister> last_registers_;
};

} // namespace citadel::debug