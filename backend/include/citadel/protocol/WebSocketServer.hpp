#pragma once

#include <atomic>
#include <deque>
#include <functional>
#include <mutex>
#include <string>
#include <string_view>
#include <thread>

namespace citadel::protocol {

class WebSocketServer {
public:
  using MessageHandler = std::function<void(std::string_view)>;

  void Start(const std::string& bind_address);
  void Stop();
  void PublishMessage(const std::string& message);
  void SetMessageHandler(MessageHandler handler);
  [[nodiscard]] bool IsRunning() const;

private:
  bool PerformHandshake(int client_fd);
  void RunLoop();
  void FlushPendingMessages();
  bool ReceiveClientMessage(std::string* message);
  static bool SendControlFrame(int client_fd, std::uint8_t opcode, std::string_view payload = {});
  static bool SendTextFrame(int client_fd, const std::string& payload);

  std::atomic<bool> running_ = false;
  int server_fd_ = -1;
  int client_fd_ = -1;
  std::thread loop_thread_;
  std::mutex queue_mutex_;
  std::deque<std::string> pending_messages_;
  MessageHandler message_handler_;
};

} // namespace citadel::protocol
