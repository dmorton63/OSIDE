cmake_minimum_required(VERSION 3.20)
project(oside_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(oside-backend
  src/main/main.cpp
  src/main/Application.cpp
  src/compiler/BuildDriver.cpp
  src/debug/DebuggerSession.cpp
  src/protocol/server/WebSocketServer.cpp
  src/protocol/router/MessageRouter.cpp
  src/protocol/handlers/RegisterHandlers.cpp
  src/workspace/ProjectMetadataLoader.cpp
)

target_include_directories(oside-backend PRIVATE include)
