#include <citadel/protocol/WebSocketServer.hpp>

#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <unistd.h>

#include <array>
#include <chrono>
#include <cstdint>
#include <cstring>
#include <cctype>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

namespace citadel::protocol {
namespace {

constexpr std::uint32_t kSha1InitialA = 0x67452301;
constexpr std::uint32_t kSha1InitialB = 0xEFCDAB89;
constexpr std::uint32_t kSha1InitialC = 0x98BADCFE;
constexpr std::uint32_t kSha1InitialD = 0x10325476;
constexpr std::uint32_t kSha1InitialE = 0xC3D2E1F0;

std::uint32_t RotateLeft(std::uint32_t value, std::uint32_t count) {
  return (value << count) | (value >> (32U - count));
}

std::array<std::uint8_t, 20> Sha1Digest(const std::string& input) {
  std::vector<std::uint8_t> bytes(input.begin(), input.end());
  const std::uint64_t bit_length = static_cast<std::uint64_t>(bytes.size()) * 8ULL;

  bytes.push_back(0x80U);
  while ((bytes.size() % 64U) != 56U) {
    bytes.push_back(0x00U);
  }

  for (int shift = 56; shift >= 0; shift -= 8) {
    bytes.push_back(static_cast<std::uint8_t>((bit_length >> shift) & 0xFFULL));
  }

  std::uint32_t hash_a = kSha1InitialA;
  std::uint32_t hash_b = kSha1InitialB;
  std::uint32_t hash_c = kSha1InitialC;
  std::uint32_t hash_d = kSha1InitialD;
  std::uint32_t hash_e = kSha1InitialE;

  for (std::size_t offset = 0; offset < bytes.size(); offset += 64U) {
    std::array<std::uint32_t, 80> words{};

    for (std::size_t word_index = 0; word_index < 16U; ++word_index) {
      const std::size_t base = offset + (word_index * 4U);
      words[word_index] = (static_cast<std::uint32_t>(bytes[base]) << 24U) |
                          (static_cast<std::uint32_t>(bytes[base + 1U]) << 16U) |
                          (static_cast<std::uint32_t>(bytes[base + 2U]) << 8U) |
                          static_cast<std::uint32_t>(bytes[base + 3U]);
    }

    for (std::size_t word_index = 16U; word_index < 80U; ++word_index) {
      words[word_index] = RotateLeft(words[word_index - 3U] ^ words[word_index - 8U] ^ words[word_index - 14U] ^ words[word_index - 16U], 1U);
    }

    std::uint32_t chunk_a = hash_a;
    std::uint32_t chunk_b = hash_b;
    std::uint32_t chunk_c = hash_c;
    std::uint32_t chunk_d = hash_d;
    std::uint32_t chunk_e = hash_e;

    for (std::size_t iteration = 0; iteration < 80U; ++iteration) {
      std::uint32_t function = 0;
      std::uint32_t constant = 0;

      if (iteration < 20U) {
        function = (chunk_b & chunk_c) | ((~chunk_b) & chunk_d);
        constant = 0x5A827999;
      } else if (iteration < 40U) {
        function = chunk_b ^ chunk_c ^ chunk_d;
        constant = 0x6ED9EBA1;
      } else if (iteration < 60U) {
        function = (chunk_b & chunk_c) | (chunk_b & chunk_d) | (chunk_c & chunk_d);
        constant = 0x8F1BBCDC;
      } else {
        function = chunk_b ^ chunk_c ^ chunk_d;
        constant = 0xCA62C1D6;
      }

      const std::uint32_t temp = RotateLeft(chunk_a, 5U) + function + chunk_e + constant + words[iteration];
      chunk_e = chunk_d;
      chunk_d = chunk_c;
      chunk_c = RotateLeft(chunk_b, 30U);
      chunk_b = chunk_a;
      chunk_a = temp;
    }

    hash_a += chunk_a;
    hash_b += chunk_b;
    hash_c += chunk_c;
    hash_d += chunk_d;
    hash_e += chunk_e;
  }

  std::array<std::uint8_t, 20> digest{};
  const std::array<std::uint32_t, 5> hash_parts = {hash_a, hash_b, hash_c, hash_d, hash_e};
  for (std::size_t index = 0; index < hash_parts.size(); ++index) {
    digest[index * 4U] = static_cast<std::uint8_t>((hash_parts[index] >> 24U) & 0xFFU);
    digest[(index * 4U) + 1U] = static_cast<std::uint8_t>((hash_parts[index] >> 16U) & 0xFFU);
    digest[(index * 4U) + 2U] = static_cast<std::uint8_t>((hash_parts[index] >> 8U) & 0xFFU);
    digest[(index * 4U) + 3U] = static_cast<std::uint8_t>(hash_parts[index] & 0xFFU);
  }

  return digest;
}

std::string Base64Encode(const std::uint8_t* data, std::size_t size) {
  static constexpr char kAlphabet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  std::string result;
  result.reserve(((size + 2U) / 3U) * 4U);

  for (std::size_t offset = 0; offset < size; offset += 3U) {
    const std::size_t remaining = size - offset;
    const std::uint32_t first = data[offset];
    const std::uint32_t second = remaining > 1U ? data[offset + 1U] : 0U;
    const std::uint32_t third = remaining > 2U ? data[offset + 2U] : 0U;
    const std::uint32_t triple = (first << 16U) | (second << 8U) | third;

    result.push_back(kAlphabet[(triple >> 18U) & 0x3FU]);
    result.push_back(kAlphabet[(triple >> 12U) & 0x3FU]);
    result.push_back(remaining > 1U ? kAlphabet[(triple >> 6U) & 0x3FU] : '=');
    result.push_back(remaining > 2U ? kAlphabet[triple & 0x3FU] : '=');
  }

  return result;
}

std::string ComputeWebSocketAccept(std::string_view key) {
  const std::string combined = std::string(key) + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  const auto digest = Sha1Digest(combined);
  return Base64Encode(digest.data(), digest.size());
}

std::string ExtractWebSocketKey(const std::string& request) {
  constexpr std::string_view header = "Sec-WebSocket-Key:";
  std::string lowercase_request = request;
  for (char& ch : lowercase_request) {
    ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
  }

  const auto start = lowercase_request.find("sec-websocket-key:");
  if (start == std::string::npos) {
    return {};
  }

  auto value_start = start + header.size();
  while (value_start < request.size() && request[value_start] == ' ') {
    ++value_start;
  }

  auto value_end = request.find("\r\n", value_start);
  if (value_end == std::string::npos) {
    return {};
  }

  return request.substr(value_start, value_end - value_start);
}

bool IsWebSocketUpgradeRequest(const std::string& request) {
  std::string lowercase_request = request;
  for (char& ch : lowercase_request) {
    ch = static_cast<char>(std::tolower(static_cast<unsigned char>(ch)));
  }

  return lowercase_request.find("upgrade: websocket") != std::string::npos &&
         lowercase_request.find("connection: upgrade") != std::string::npos;
}

bool SendAll(int fd, const std::uint8_t* buffer, std::size_t size) {
  std::size_t sent = 0;
  while (sent < size) {
    const auto written = ::send(fd, buffer + sent, size - sent, 0);
    if (written <= 0) {
      return false;
    }
    sent += static_cast<std::size_t>(written);
  }

  return true;
}

bool SendHttpResponse(int fd, std::string_view status_line, std::string_view body, std::string_view content_type = "text/plain; charset=utf-8") {
  std::ostringstream response;
  response << status_line << "\r\n"
           << "Content-Type: " << content_type << "\r\n"
           << "Content-Length: " << body.size() << "\r\n"
           << "Connection: close\r\n"
           << "\r\n"
           << body;

  const auto text = response.str();
  return SendAll(fd, reinterpret_cast<const std::uint8_t*>(text.data()), text.size());
}

bool ReceiveHttpRequest(int fd, std::string* out_request) {
  out_request->clear();
  std::array<char, 2048> buffer{};
  constexpr int kHandshakeTimeoutMs = 1000;
  int waited_ms = 0;

  while (out_request->find("\r\n\r\n") == std::string::npos) {
    fd_set read_fds;
    FD_ZERO(&read_fds);
    FD_SET(fd, &read_fds);

    timeval timeout{};
    timeout.tv_sec = 0;
    timeout.tv_usec = 100000;

    const int ready = ::select(fd + 1, &read_fds, nullptr, nullptr, &timeout);
    if (ready < 0) {
      return false;
    }

    if (ready == 0) {
      waited_ms += 100;
      if (waited_ms >= kHandshakeTimeoutMs) {
        return false;
      }
      continue;
    }

    const auto received = ::recv(fd, buffer.data(), buffer.size(), 0);
    if (received <= 0) {
      return false;
    }

    out_request->append(buffer.data(), static_cast<std::size_t>(received));
    if (out_request->size() > 16384U) {
      return false;
    }
  }

  return true;
}

bool ReceiveAll(int fd, std::uint8_t* buffer, std::size_t size) {
  std::size_t received_total = 0;
  while (received_total < size) {
    const auto received = ::recv(fd, buffer + received_total, size - received_total, 0);
    if (received <= 0) {
      return false;
    }

    received_total += static_cast<std::size_t>(received);
  }

  return true;
}

} // namespace

void WebSocketServer::Start(const std::string&) {
  if (running_.exchange(true)) {
    return;
  }

  server_fd_ = ::socket(AF_INET, SOCK_STREAM, 0);
  if (server_fd_ < 0) {
    running_ = false;
    return;
  }

  int reuse = 1;
  setsockopt(server_fd_, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));

  sockaddr_in address{};
  address.sin_family = AF_INET;
  address.sin_port = htons(9001);
  inet_pton(AF_INET, "127.0.0.1", &address.sin_addr);

  if (::bind(server_fd_, reinterpret_cast<sockaddr*>(&address), sizeof(address)) < 0) {
    ::close(server_fd_);
    server_fd_ = -1;
    running_ = false;
    return;
  }

  if (::listen(server_fd_, 4) < 0) {
    ::close(server_fd_);
    server_fd_ = -1;
    running_ = false;
    return;
  }

  loop_thread_ = std::thread([this]() { RunLoop(); });
}

void WebSocketServer::Stop() {
  if (!running_.exchange(false)) {
    return;
  }

  if (loop_thread_.joinable()) {
    loop_thread_.join();
  }

  if (client_fd_ >= 0) {
    ::close(client_fd_);
    client_fd_ = -1;
  }

  if (server_fd_ >= 0) {
    ::close(server_fd_);
    server_fd_ = -1;
  }
}

void WebSocketServer::PublishMessage(const std::string& message) {
  std::scoped_lock lock(queue_mutex_);
  pending_messages_.push_back(message);
}

void WebSocketServer::SetMessageHandler(MessageHandler handler) {
  message_handler_ = std::move(handler);
}

bool WebSocketServer::IsRunning() const {
  return running_.load();
}

bool WebSocketServer::PerformHandshake(int client_fd) {
  std::string request;
  if (!ReceiveHttpRequest(client_fd, &request)) {
    return false;
  }

  if (!IsWebSocketUpgradeRequest(request)) {
    SendHttpResponse(
        client_fd,
        "HTTP/1.1 200 OK",
        "oside backend is listening on this port for WebSocket clients.\nUse ws://127.0.0.1:9001/ or the frontend proxy at /ws.\n");
    return false;
  }

  const auto key = ExtractWebSocketKey(request);
  if (key.empty()) {
    SendHttpResponse(client_fd, "HTTP/1.1 426 Upgrade Required", "missing Sec-WebSocket-Key header\n");
    return false;
  }

  const auto accept = ComputeWebSocketAccept(key);
  std::ostringstream response;
  response << "HTTP/1.1 101 Switching Protocols\r\n"
           << "Upgrade: websocket\r\n"
           << "Connection: Upgrade\r\n"
           << "Sec-WebSocket-Accept: " << accept << "\r\n\r\n";
  const auto text = response.str();
  return SendAll(client_fd, reinterpret_cast<const std::uint8_t*>(text.data()), text.size());
}

void WebSocketServer::RunLoop() {
  while (running_) {
    fd_set read_fds;
    FD_ZERO(&read_fds);
    FD_SET(server_fd_, &read_fds);
    int max_fd = server_fd_;
    if (client_fd_ >= 0) {
      FD_SET(client_fd_, &read_fds);
      max_fd = std::max(max_fd, client_fd_);
    }

    timeval timeout{};
    timeout.tv_sec = 0;
    timeout.tv_usec = 20000;
    const int ready = ::select(max_fd + 1, &read_fds, nullptr, nullptr, &timeout);
    if (ready > 0 && FD_ISSET(server_fd_, &read_fds)) {
      const int accepted = ::accept(server_fd_, nullptr, nullptr);
      if (accepted >= 0) {
        if (PerformHandshake(accepted)) {
          if (client_fd_ >= 0) {
            ::close(client_fd_);
          }
          client_fd_ = accepted;
        } else {
          ::close(accepted);
        }
      }
    }

    if (client_fd_ >= 0 && ready > 0 && FD_ISSET(client_fd_, &read_fds)) {
      std::string message;
      if (!ReceiveClientMessage(&message)) {
        ::close(client_fd_);
        client_fd_ = -1;
        continue;
      }

      if (!message.empty() && message_handler_) {
        message_handler_(message);
      }
    }

    FlushPendingMessages();
    std::this_thread::sleep_for(std::chrono::milliseconds(20));
  }
}

void WebSocketServer::FlushPendingMessages() {
  std::deque<std::string> local_queue;
  {
    std::scoped_lock lock(queue_mutex_);
    local_queue.swap(pending_messages_);
  }

  for (const auto& message : local_queue) {
    if (client_fd_ < 0) {
      break;
    }

    if (!SendTextFrame(client_fd_, message)) {
      ::close(client_fd_);
      client_fd_ = -1;
      break;
    }
  }
}

bool WebSocketServer::SendTextFrame(int client_fd, const std::string& payload) {
  return SendControlFrame(client_fd, 0x1U, payload);
}

bool WebSocketServer::SendControlFrame(int client_fd, std::uint8_t opcode, std::string_view payload) {
  std::vector<std::uint8_t> frame;
  frame.push_back(static_cast<std::uint8_t>(0x80U | (opcode & 0x0FU)));

  if (payload.size() <= 125U) {
    frame.push_back(static_cast<std::uint8_t>(payload.size()));
  } else if (payload.size() <= 65535U) {
    frame.push_back(126U);
    frame.push_back(static_cast<std::uint8_t>((payload.size() >> 8U) & 0xFFU));
    frame.push_back(static_cast<std::uint8_t>(payload.size() & 0xFFU));
  } else {
    return false;
  }

  frame.insert(frame.end(), payload.begin(), payload.end());
  return SendAll(client_fd, frame.data(), frame.size());
}

bool WebSocketServer::ReceiveClientMessage(std::string* message) {
  std::array<std::uint8_t, 2> header{};
  if (!ReceiveAll(client_fd_, header.data(), header.size())) {
    return false;
  }

  const std::uint8_t opcode = header[0] & 0x0FU;
  const bool masked = (header[1] & 0x80U) != 0U;
  std::uint64_t payload_length = header[1] & 0x7FU;
  if (payload_length == 126U) {
    std::array<std::uint8_t, 2> extended{};
    if (!ReceiveAll(client_fd_, extended.data(), extended.size())) {
      return false;
    }
    payload_length = (static_cast<std::uint64_t>(extended[0]) << 8U) | static_cast<std::uint64_t>(extended[1]);
  } else if (payload_length == 127U) {
    return false;
  }

  std::array<std::uint8_t, 4> mask{};
  if (masked && !ReceiveAll(client_fd_, mask.data(), mask.size())) {
    return false;
  }

  std::vector<std::uint8_t> payload(payload_length);
  if (payload_length > 0U && !ReceiveAll(client_fd_, payload.data(), payload.size())) {
    return false;
  }

  if (masked) {
    for (std::size_t index = 0; index < payload.size(); ++index) {
      payload[index] ^= mask[index % mask.size()];
    }
  }

  if (opcode == 0x8U) {
    SendControlFrame(client_fd_, 0x8U, std::string_view(reinterpret_cast<const char*>(payload.data()), payload.size()));
    return false;
  }

  if (opcode == 0x9U) {
    SendControlFrame(client_fd_, 0xAU, std::string_view(reinterpret_cast<const char*>(payload.data()), payload.size()));
    message->clear();
    return true;
  }

  if (opcode != 0x1U) {
    message->clear();
    return true;
  }

  message->assign(payload.begin(), payload.end());
  return true;
}

} // namespace citadel::protocol
