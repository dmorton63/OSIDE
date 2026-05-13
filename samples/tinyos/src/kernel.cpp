#include "kernel.hpp"

namespace {

int DetectBootStage() {
  return 1;
}

bool InitializeScheduler(int bootStage) {
  return bootStage > 1;
}

} // namespace

int KernelMain() {
  int bootStage = DetectBootStage();
  bool schedulerReady = InitializeScheduler(bootStage);
  int statusCode = schedulerReady ? 0 : bootStage;
  return statusCode;
}