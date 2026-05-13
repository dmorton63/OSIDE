________________________________________
📄 PAGE 1 — TITLE PAGE + FULLY EXPANDED TABLE OF CONTENTS
(You can paste this directly into Word as Page 1. Page 2 will begin Section 1.)
________________________________________
THE OS IDE — MASTER SYSTEMS SPECIFICATION
Basic · Community · Professional Editions
Version 1.0 
Author: David
Date: May 2026
________________________________________
TABLE OF CONTENTS (Fully Expanded)
________________________________________
1. Component Identification
1.1 Debugger Engine
•	1.1.1 Responsibilities
•	1.1.2 Subcomponents
•	1.1.3 Debugger State Model
•	1.1.4 Breakpoint Model
•	1.1.5 Stepping Model
•	1.1.6 Variable & Register Model
•	1.1.7 Memory Model
•	1.1.8 Performance Requirements
•	1.1.9 Error Handling
•	1.1.10 Extensibility
1.2 Build System
•	1.2.1 Responsibilities
•	1.2.2 Subcomponents
•	1.2.3 Build Configurations
•	1.2.4 Build Pipeline
•	1.2.5 Diagnostics Model
•	1.2.6 Artifact Model
•	1.2.7 Performance Requirements
•	1.2.8 Error Handling
•	1.2.9 Extensibility
1.3 Project System
•	1.3.1 Responsibilities
•	1.3.2 Subcomponents
•	1.3.3 Project Structure Requirements
•	1.3.4 Workspace State Model
•	1.3.5 Communication with Other Subsystems
•	1.3.6 Performance Requirements
•	1.3.7 Error Handling
•	1.3.8 Extensibility
1.4 Editor Engine
•	1.4.1 Responsibilities
•	1.4.2 Subcomponents
•	1.4.3 Editing Features
•	1.4.4 State Model
•	1.4.5 Integration Points
•	1.4.6 Performance Requirements
•	1.4.7 Error Handling
•	1.4.8 Extensibility
1.5 UI Framework
•	1.5.1 Responsibilities
•	1.5.2 Subcomponents
•	1.5.3 Panel Definitions
•	1.5.4 Layout Modes
•	1.5.5 Integration Points
•	1.5.6 Performance Requirements
•	1.5.7 Error Handling
•	1.5.8 Extensibility
1.6 Communication Layer
•	1.6.1 Responsibilities
•	1.6.2 Architecture Overview
•	1.6.3 Message Format
•	1.6.4 Command Types
•	1.6.5 Event Types
•	1.6.6 Schema Validation
•	1.6.7 Connection Management
•	1.6.8 Performance Requirements
•	1.6.9 Error Handling
•	1.6.10 Extensibility
________________________________________
2. Visual Layout (UI Blueprint)
•	2.1 Layout Philosophy
•	2.2 Primary Layout Regions
•	2.3 Default Layouts
•	2.4 Panel Behavior
•	2.5 Debugging Visual Behavior
•	2.6 Output Panel Behavior
•	2.7 Accessibility & Usability
•	2.8 Performance Requirements
•	2.9 Extensibility
________________________________________
3. Standards & Technologies
•	3.1 Debugging Standards 
o	3.1.1 MI Protocol
o	3.1.2 DWARF Standard
o	3.1.3 ELF Binary Format
•	3.2 Build & Toolchain Standards 
o	3.2.1 Compiler Standards
o	3.2.2 Linker Standards
o	3.2.3 Build Configuration Format
•	3.3 Frontend Standards
•	3.4 Backend Standards
•	3.5 Communication Standards
•	3.6 Coding Standards
•	3.7 File & Directory Standards
•	3.8 UI/UX Standards
•	3.9 Extensibility Standards
________________________________________
4. Namespaces & Internal Architecture
•	4.1 Architectural Overview
•	4.2 Frontend Namespaces
•	4.3 Backend Namespaces
•	4.4 Directory Structure
•	4.5 Architectural Rules
•	4.6 Extensibility
________________________________________
5. Deployment Model
•	5.1 Deployment Options Considered
•	5.2 Final Deployment Architecture
•	5.3 Process Model
•	5.4 Packaging & Distribution
•	5.5 Runtime Environment
•	5.6 Security Model
•	5.7 Update Model
•	5.8 Extensibility & Future Deployment Options
•	5.9 Recommended Development Path
________________________________________
6. Future Extensions
•	6.1 Kernel Timeline Viewer
•	6.2 Heap & Memory Visualizer
•	6.3 Interrupt Monitor
•	6.4 Module Dependency Graph
•	6.5 Time Travel Debugging
•	6.6 Static Analysis Tools
•	6.7 Symbol Database & Code Indexer
•	6.8 Plugin System
•	6.9 Remote Debugging & Build Servers
•	6.10 Multi Backend Debugger Support
•	6.11 AI Assisted Development
________________________________________
________________________________________
📄 PAGE 2 — SECTION 1: COMPONENT IDENTIFICATION
1. Component Identification
This section defines the major subsystems of The OS IDE. Each subsystem is described in terms of responsibilities, internal structure, state models, performance requirements, and extensibility. Together, these components form the core architecture of the IDE.
For Version 1, the product scope is intentionally constrained to a Linux-only IDE shell with a build frontend and a debug frontend for the canonical OS IDE Project format defined in Section 1.3. Boot orchestration, emulator launch orchestration, and arbitrary project layout support are explicitly out of scope for Version 1 and may be added in future releases.
________________________________________
1.1 Debugger Engine
1.1.1 Responsibilities
The Debugger Engine is responsible for:
•	Managing the debugging session lifecycle
•	Communicating with GDB/LLDB via the MI protocol
•	Handling breakpoints, stepping, and thread control
•	Extracting variables, registers, and memory
•	Mapping program counters to source lines
•	Emitting debugger events to the frontend
•	Maintaining consistent debugger state
•	Attaching to externally launched debug targets in the Version 1 workflow
________________________________________
1.1.2 Subcomponents
Debugger Session Manager
•	Starts/stops debugger subprocess
•	Manages MI protocol handshake
•	Handles session state transitions
Breakpoint Manager
•	Adds/removes breakpoints
•	Tracks enabled/disabled/conditional breakpoints
•	Syncs breakpoints with frontend
Stepping Controller
•	Implements step into/over/out
•	Handles continue/pause
•	Manages thread focus
Thread & Frame Manager
•	Tracks active threads
•	Tracks call stack frames
•	Provides frame → source mapping
Variable & Register Inspector
•	Evaluates expressions
•	Retrieves locals, args, globals
•	Reads/writes registers
Memory Inspector
•	Reads memory regions
•	Streams memory chunks
•	Supports pointer following
Symbol & Line Mapper
•	Uses DWARF to map PC → file:line
•	Resolves function names
•	Supports inline frames
________________________________________
1.1.3 Debugger State Model
Global Debugger State
•	Session status (running, paused, stopped)
•	Active thread
•	Active frame
•	Breakpoint list
•	Loaded modules
•	Current PC location
Per Thread State
•	Thread ID
•	Thread name (if available)
•	Current frame
•	Execution status
Per Frame State
•	File path
•	Line number
•	Function name
•	Locals and arguments
________________________________________
1.1.4 Breakpoint Model
Each breakpoint includes:
•	ID
•	File path
•	Line number
•	Condition (optional)
•	Enabled/disabled state
•	Hit count (future)
________________________________________
1.1.5 Stepping Model
Supported stepping operations:
•	Step Into
•	Step Over
•	Step Out
•	Continue
•	Pause
Stepping must:
•	Update PC location
•	Emit debug.stepComplete event
•	Refresh variables, registers, and call stack
________________________________________
1.1.6 Variable & Register Model
Variables
•	Name
•	Type
•	Value
•	Children (for structs, arrays)
•	Memory address (if available)
Registers
•	Name
•	Value
•	Category (GPR, FPU, SIMD)
•	Highlight if changed
________________________________________
1.1.7 Memory Model
Memory reads return:
•	Address
•	Byte array
•	ASCII representation
•	Pointer interpretations (optional)
Memory is streamed in chunks for large regions.
________________________________________
1.1.8 Performance Requirements
•	Step latency < 50ms
•	Variable refresh < 100ms
•	Memory reads chunked to avoid blocking
•	Must handle 100+ debugger events/sec
________________________________________
1.1.9 Error Handling
The Debugger Engine must handle:
•	MI protocol errors
•	Invalid breakpoints
•	Missing symbols
•	Corrupted DWARF
•	Process crashes
•	Timeouts
Errors are emitted as structured events.
________________________________________
1.1.10 Extensibility
Future capabilities:
•	Time travel debugging
•	Hardware debugging (JTAG)
•	QEMU/Bochs integration
•	Custom kernel debugger backend
________________________________________
1.2 Build System
1.2.1 Responsibilities
The Build System is responsible for:
•	Orchestrating compiler and linker invocations
•	Managing build configurations
•	Parsing compiler diagnostics
•	Tracking build artifacts
•	Emitting build progress events
•	Supporting incremental builds
________________________________________
1.2.2 Subcomponents
Build Configuration Manager
•	Loads build settings
•	Manages Debug/Release profiles
•	Tracks toolchain paths
Compiler Driver
•	Invokes Clang/GCC
•	Passes include paths and flags
•	Captures stdout/stderr
Linker Driver
•	Invokes ld.lld or GNU ld
•	Uses project linker script
•	Produces kernel image or module
Diagnostics Parser
•	Parses compiler output
•	Extracts file:line diagnostics
•	Categorizes errors/warnings
Artifact Manager
•	Tracks object files
•	Tracks final binaries
•	Cleans build directory
________________________________________
1.2.3 Build Configurations
Supported configurations:
•	Debug
•	Release
•	Custom profiles (future)
Each configuration defines:
•	Optimization level
•	Debug symbols
•	Warning level
•	Toolchain paths
________________________________________
1.2.4 Build Pipeline
1.	Load project metadata
2.	Resolve include paths
3.	Compile source files
4.	Parse diagnostics
5.	Link artifacts
6.	Emit build results
Version 1 stops at validated build artifacts and diagnostics. Boot image launch, emulator control, and target orchestration remain external to the IDE and are not part of the core build pipeline.
________________________________________
1.2.5 Diagnostics Model
Each diagnostic includes:
•	File path
•	Line number
•	Column (optional)
•	Severity
•	Message
•	Associated code snippet (future)
________________________________________
1.2.6 Artifact Model
Artifacts include:
•	Object files
•	Kernel image
•	Modules
•	Map files
•	Linker logs
________________________________________
1.2.7 Performance Requirements
•	Incremental builds preferred
•	Full build < 5 seconds for small projects
•	Diagnostics streamed in real time
________________________________________
1.2.8 Error Handling
Handles:
•	Missing toolchain
•	Invalid flags
•	Linker script errors
•	Missing include paths
•	Compiler crashes
________________________________________
1.2.9 Extensibility
Future features:
•	Build caching
•	Distributed builds
•	Build graph visualization
•	Custom build steps
________________________________________
1.3 Project System
1.3.1 Responsibilities
The Project System must:
•	Load project metadata
•	Maintain workspace file tree
•	Track modules
•	Resolve include paths
•	Provide project level settings
•	Notify IDE of file changes
•	Validate that the workspace conforms to the canonical OS IDE Project layout used in Version 1
________________________________________
1.3.2 Subcomponents
Workspace Manager
•	Loads project directory
•	Tracks open files
•	Manages tabs
Project Metadata Loader
•	Reads project.json
•	Validates fields
•	Provides toolchain settings
File Tree Manager
•	Scans directories
•	Detects changes
•	Filters build artifacts
Module Manager
•	Tracks module directories
•	Provides module metadata
•	Supports dependencies
Include Path Resolver
•	Resolves headers
•	Detects missing includes
•	Caches results
Template Engine
•	Provides starter project templates
File Watcher
•	Monitors filesystem
•	Triggers rebuilds
________________________________________
1.3.3 Project Structure Requirements
Version 1 supports one canonical project type only: the OS IDE Project. Arbitrary project layouts are not supported in Version 1.
Required Directories
•	/src
•	/include
•	/modules
•	/boot
•	/build
•	/scripts
Optional Directories
•	/tests
•	/docs
•	/tools
Required Files
•	project.json
•	linker.ld
The canonical layout is enforced by the Project System and templates generated by the IDE must follow this structure exactly.
________________________________________
1.3.4 Workspace State Model
Global Workspace State
•	Project name
•	Toolchain
•	Include paths
•	Modules
•	Open files
•	Build configuration
Per File State
•	File path
•	Dirty/clean
•	Diagnostics
Per Module State
•	Module name
•	Source files
•	Build flags
________________________________________
1.3.5 Communication with Other Subsystems
•	Provides metadata to Build System
•	Provides file paths to Debugger
•	Receives diagnostics from Build System
•	Receives breakpoints from Debugger
________________________________________
1.3.6 Performance Requirements
•	Project load < 200ms
•	File tree updates < 50ms
•	Include resolution cached
________________________________________
1.3.7 Error Handling
Handles:
•	Missing project.json
•	Invalid metadata
•	Missing linker script
•	Circular module dependencies
•	Non-canonical project layouts
________________________________________
1.3.8 Extensibility
Future features:
•	Multi project workspaces
•	Virtual folders
•	Dependency graph
________________________________________
1.4 Editor Engine
1.4.1 Responsibilities
The Editor Engine must:
•	Open/edit/save files
•	Provide syntax highlighting
•	Display diagnostics
•	Support breakpoints
•	Integrate with debugger
•	Provide navigation tools
________________________________________
1.4.2 Subcomponents
Text Buffer Manager
•	In memory file representation
•	Undo/redo
•	Dirty tracking
Syntax Highlighter
•	Tokenizes C/C++
•	Supports themes
•	Incremental updates
Diagnostics Overlay
•	Squiggles
•	Gutter icons
•	Hover messages
Gutter & Breakpoint UI
•	Line numbers
•	Breakpoint toggles
•	Execution line marker
Navigation Engine
•	Go to definition
•	Find references
•	Go to line
Code Folding
•	Fold functions
•	Fold structs
Tab & Split Manager
•	Multiple tabs
•	Split views
Debugger Integration Layer
•	Execution line highlight
•	Inline values (future)
________________________________________
1.4.3 Editing Features
•	Insert/delete
•	Copy/paste
•	Multi cursor (future)
•	Auto indent
•	Brace matching
________________________________________
1.4.4 State Model
Per Editor State
•	Cursor position
•	Selection
•	Scroll position
•	Diagnostics
•	Breakpoints
Global Editor State
•	Open files
•	Active tab
•	Layout
________________________________________
1.4.5 Integration Points
•	With Project System
•	With Build System
•	With Debugger Engine
________________________________________
1.4.6 Performance Requirements
•	Open file < 50ms
•	Smooth 60 FPS scrolling
•	Incremental highlighting
________________________________________
1.4.7 Error Handling
Handles:
•	Missing files
•	Save errors
•	Parse failures
________________________________________
1.4.8 Extensibility
Future features:
•	LSP integration
•	Refactoring tools
•	Inline type hints
________________________________________
1.5 UI Framework
1.5.1 Responsibilities
The UI Framework must:
•	Render panels
•	Manage docking layout
•	Provide themes
•	Handle shortcuts
•	Provide command palette
•	Manage toolbars and status bars
________________________________________
1.5.2 Subcomponents
Docking Layout Engine
•	Dock/undock
•	Tab panels
•	Save/restore layouts
Theme Engine
•	Light/dark themes
•	Custom themes
Toolbar & Status Bar Manager
•	Build/debug controls
•	Cursor position
•	Build status
Shortcut System
•	JSON keybindings
•	Conflict detection
Command Palette
•	Fuzzy search
•	Execute commands
Notification System
•	Toasts
•	Alerts
Context Menu Manager
•	Editor menus
•	File tree menus
Rendering Layer
•	GPU acceleration
•	Incremental updates
________________________________________
1.5.3 Panel Definitions
•	Editor
•	Project Tree
•	Variables
•	Call Stack
•	Registers
•	Memory Viewer
•	Console
•	Build Output
•	Debugger Log
________________________________________
1.5.4 Layout Modes
•	Editing Mode
•	Debugging Mode
•	Module Mode
•	Minimal Mode
________________________________________
1.5.5 Integration Points
•	Editor Engine
•	Debugger Engine
•	Build System
•	Project System
________________________________________
1.5.6 Performance Requirements
•	Layout changes < 10ms
•	Smooth resizing
•	No UI blocking
________________________________________
1.5.7 Error Handling
Handles:
•	Missing panels
•	Corrupted layout files
•	Theme errors
________________________________________
1.5.8 Extensibility
Future features:
•	Plugin panels
•	Multi monitor support
•	UI scripting
________________________________________
1.6 Communication Layer
1.6.1 Responsibilities
The Communication Layer must:
•	Maintain WebSocket connection
•	Serialize/deserialize messages
•	Validate schemas
•	Route commands/events
•	Handle reconnection
•	Provide logging
________________________________________
1.6.2 Architecture Overview
•	WebSocket Transport
•	Message Router
•	Schema Validator
•	Event Bus
•	Logging Layer
________________________________________
1.6.3 Message Format
Envelope:
{
  "type": "debug.stepComplete",
  "requestId": "abc123",
  "payload": { ... }
}
________________________________________
1.6.4 Command Types
•	Debug commands
•	Build commands
•	Project commands
________________________________________
1.6.5 Event Types
•	Debugger events
•	Build events
•	Project events
________________________________________
1.6.6 Schema Validation
•	Zod schemas
•	Strict typing
•	Reject malformed messages
________________________________________
1.6.7 Connection Management
•	Auto reconnect
•	Heartbeats
•	State resync
________________________________________
1.6.8 Performance Requirements
•	100+ messages/sec
•	<10ms latency
________________________________________
1.6.9 Error Handling
Handles:
•	Invalid messages
•	Unknown types
•	Timeouts
•	Backend crashes
________________________________________
1.6.10 Extensibility
Future features:
•	Binary messages
•	Compression
•	Multiplexed channels
________________________________________
________________________________________
📄 PAGE 3 — SECTION 2: VISUAL LAYOUT (UI BLUEPRINT)
2. Visual Layout (UI Blueprint)
This section defines the spatial organization, visual hierarchy, and interaction patterns of The OS IDE. The layout is designed to maximize developer productivity, maintain clarity during complex debugging sessions, and provide a consistent, intuitive user experience across all editions (Basic, Community, Professional).
________________________________________
2.1 Layout Philosophy
The visual layout is guided by three core principles:
A. Center the Code
The Editor is the primary workspace and occupies the central region of the IDE.
B. Keep Debugging Context Visible
Critical debugging information (variables, call stack, registers, memory) must remain visible without requiring tab switching.
C. Minimize Mode Switching
The layout adapts between editing and debugging modes, but context is preserved to avoid cognitive disruption.
________________________________________
2.2 Primary Layout Regions
The IDE is divided into five major regions:
1. Center Region — Editor
•	Multi tab code editor
•	Split view support
•	Execution line highlight
•	Breakpoint gutter
2. Left Region — Project Tree
•	File explorer
•	Module grouping
•	Search/filter
•	Right click actions
3. Right Region — Debug Panels
Panels may be docked or tabbed:
•	Variables
•	Call Stack
•	Registers
•	Memory Viewer
•	Modules
4. Bottom Region — Output Panels
Tabbed panels:
•	Console
•	Build Output
•	Debugger Log
•	Terminal (optional)
5. Top Region — Toolbar
•	Build/debug controls
•	Layout switcher
•	Status indicators
________________________________________
2.3 Default Layouts
The IDE provides several built in layouts optimized for different workflows.
2.3.1 Editing Layout (Default)
•	Large central editor
•	File tree on the left
•	Console at the bottom
•	Debug panels collapsed
2.3.2 Debugging Layout
•	Editor centered
•	Variables + Call Stack on the right
•	Registers + Memory in right side tabs
•	Console + Debugger Log at the bottom
•	File tree on the left
2.3.3 Module Development Layout
•	Module list on the left
•	Editor centered
•	Memory/Register panels on the right
•	Build Output at the bottom
2.3.4 Minimal Layout
•	Editor full screen
•	Panels auto hide
•	Command palette for navigation
________________________________________
2.4 Panel Behavior
Docking
Panels can be docked:
•	Left
•	Right
•	Top
•	Bottom
•	Center (tabbed)
Floating
Panels may be detached into floating windows.
Tabbing
Multiple panels can share a region as tabs.
Resizing
All regions include draggable splitters.
Auto Hide
Panels can collapse into sidebars.
Persistence
Layouts are saved:
•	Per project
•	Per user
•	Per mode (editing/debugging)
________________________________________
2.5 Debugging Visual Behavior
Execution Line Highlight
•	Bright highlight on current line
•	Arrow marker in gutter
•	Smooth scroll to center the line
Breakpoint Indicators
•	Red dot for active
•	Hollow dot for disabled
•	Conditional icon overlay
Inline Debug Data (Future)
•	Inline variable values
•	Hover tooltips with type + value
Call Stack Navigation
•	Clicking a frame jumps to file:line
•	Editor shows frame context
Variable Tree
•	Expandable
•	Lazy loaded
•	Highlights changed values
Register View
•	Changed registers highlighted
•	Grouped by category (GPR, FPU, SIMD)
Memory Viewer
•	Hex + ASCII
•	Follow pointer
•	Jump to address
________________________________________
2.6 Output Panel Behavior
Console
•	Runtime output
•	Debugger console input
•	ANSI color support
Build Output
•	Compiler diagnostics
•	Click to jump to file:line
•	Filter by severity
Debugger Log
•	Raw MI output (optional)
•	Debugger events
•	Useful for advanced debugging
________________________________________
2.7 Accessibility & Usability
The IDE must support:
•	High contrast mode
•	Adjustable font sizes
•	Keyboard only navigation
•	Screen reader support (future)
•	Colorblind safe themes
________________________________________
2.8 Performance Requirements
•	Layout changes < 10ms
•	Panel open/close < 20ms
•	Smooth 60 FPS scrolling
•	No UI blocking during builds or debugging
•	Incremental rendering for large panels
________________________________________
2.9 Extensibility
Future layout features include:
•	Multi monitor support
•	Detachable windows
•	Custom user defined layouts
•	Plugin panels
•	Layout presets per project type
•	Timeline/trace panels
________________________________________
________________________________________
📄 PAGE 4 — SECTION 3: STANDARDS & TECHNOLOGIES
3. Standards & Technologies
This section defines the technical standards, protocols, formats, and libraries used across The OS IDE. These standards ensure interoperability, maintainability, and predictable behavior across all subsystems. They apply to all editions (Basic, Community, Professional) unless otherwise noted.
________________________________________
3.1 Debugging Standards
3.1.1 MI Protocol (Machine Interface)
The IDE uses the GDB/LLDB MI protocol as the primary debugging interface.
Requirements:
•	MI2 or MI3 syntax
•	Tokenized commands
•	Structured async notifications
•	Deterministic parsing
•	Non blocking I/O
MI is used for:
•	Breakpoints
•	Stepping
•	Thread control
•	Variable/register inspection
•	Memory reads/writes
________________________________________
3.1.2 DWARF Standard
The IDE supports:
•	DWARF 4 (minimum)
•	DWARF 5 (preferred)
DWARF is required for:
•	Symbol resolution
•	Variable location
•	Type information
•	Line mapping
•	Call stack reconstruction
________________________________________
3.1.3 ELF Binary Format
The IDE supports:
•	32 bit and 64 bit ELF
•	Relocatable objects (.o)
•	Shared objects (.so) for modules
•	Kernel images with custom sections
ELF is required for:
•	DWARF extraction
•	Module loading
•	Symbol table parsing
________________________________________
3.2 Build & Toolchain Standards
3.2.1 Compiler Standards
Supported compilers:
•	Clang/LLVM (preferred)
•	GCC (secondary)
Required flags:
•	-g (DWARF symbols)
•	-O0 (debug builds)
•	-ffreestanding (kernel code)
•	-fno-exceptions (optional)
•	-fno-rtti (optional)
________________________________________
3.2.2 Linker Standards
Supported linkers:
•	ld.lld
•	GNU ld
Linker scripts must follow:
•	GNU ld script syntax
•	Custom section definitions for kernel and modules
________________________________________
3.2.3 Build Configuration Format
Project metadata uses:
•	JSON (preferred)
•	YAML (optional)
________________________________________
3.3 Frontend Standards
3.3.1 UI Framework
The frontend uses:
•	React (primary UI framework)
•	TypeScript (strict mode)
•	Zod (schema validation)
•	Monaco Editor or CodeMirror 6 (editor engine)
________________________________________
3.3.2 Styling & Themes
•	CSS variables for theming
•	Tailwind or CSS modules
•	JSON theme files
•	High contrast theme support
________________________________________
3.3.3 Rendering
•	Virtual DOM
•	Incremental rendering
•	GPU acceleration where available
________________________________________
3.4 Backend Standards
3.4.1 Language & Runtime
Backend is written in:
•	C++20/23
•	Standard library + optional Boost
•	CMake build system
________________________________________
3.4.2 Process Management
•	POSIX process APIs
•	PTY for debugger console
•	Non blocking I/O
•	Subprocess management for compiler/linker
These requirements apply to the Linux-only Version 1 runtime.
________________________________________
3.4.3 File System
•	POSIX file APIs
•	UTF 8 encoding
•	Cross platform path handling
________________________________________
3.5 Communication Standards
3.5.1 Transport
•	WebSocket (primary transport)
•	JSON messages
•	UTF 8 encoding
________________________________________
3.5.2 Message Format
All messages follow a strict envelope:
{
  "type": "debug.stepComplete",
  "requestId": "abc123",
  "payload": { ... }
}
________________________________________
3.5.3 Error Handling
•	Structured error messages
•	Error codes
•	Human readable descriptions
________________________________________
3.6 Coding Standards
3.6.1 C++ Coding Style
•	LLVM coding style (preferred)
•	CamelCase for types
•	snake_case for variables/functions
•	Namespaces required for all modules
________________________________________
3.6.2 TypeScript Coding Style
•	ESLint + Prettier
•	Strict null checks
•	No implicit any
•	PascalCase for components
•	camelCase for functions/variables
________________________________________
3.7 File & Directory Standards
3.7.1 Project Metadata
•	project.json required
•	Only the canonical OS IDE Project layout is supported in Version 1
•	Must include: 
o	name
o	type
o	toolchain
o	include paths
o	modules
o	linker script
________________________________________
3.7.2 Source File Encoding
•	UTF 8 only
•	LF line endings
________________________________________
3.7.3 Build Artifacts
•	Stored in /build
•	Never mixed with source files
________________________________________
3.8 UI/UX Standards
3.8.1 Keyboard Shortcuts
•	VS Code style defaults
•	JSON based keybinding config
________________________________________
3.8.2 Accessibility
•	High contrast themes
•	Adjustable font sizes
•	Keyboard navigation
________________________________________
3.8.3 Responsiveness
•	60 FPS target
•	No blocking UI operations
________________________________________
3.9 Extensibility Standards
Future proofing requirements:
•	Plugin API must use the same schema system
•	Panels must be modular and self contained
•	Themes must be JSON based
•	Layouts must be serializable
•	Debugger backends must be swappable
________________________________________
________________________________________
📄 PAGE 5 — SECTION 4: NAMESPACES & INTERNAL ARCHITECTURE
4. Namespaces & Internal Architecture
This section defines the internal structure of The OS IDE codebase. It establishes namespace conventions, module boundaries, directory layout, and architectural rules that ensure clarity, maintainability, and scalability across both the frontend and backend.
The architecture is intentionally modular, with strict separation between UI, logic, and system level operations.
________________________________________
4.1 Architectural Overview
The IDE consists of two major layers:
A. Frontend (TypeScript/React)
Responsible for:
•	UI rendering
•	Editor engine
•	Debug panels
•	Project tree
•	Output panels
•	Communication Layer (client side)
B. Backend (C++20/23)
Responsible for:
•	Debugger Engine
•	Build System
•	Project System
•	DWARF/ELF parsing
•	Communication Layer (server side)
Communication between layers occurs exclusively through the WebSocket protocol defined in Section 1.6.
________________________________________
4.2 Frontend Namespaces
Frontend namespaces follow the pattern:
ide.<subsystem>
Each namespace is self contained and exposes a stable API to the rest of the frontend.
________________________________________
4.2.1 ide.editor
Responsible for:
•	Text buffers
•	Syntax highlighting
•	Diagnostics overlay
•	Breakpoints
•	Navigation
Submodules:
•	ide.editor.buffer
•	ide.editor.syntax
•	ide.editor.diagnostics
•	ide.editor.navigation
________________________________________
4.2.2 ide.debugger
Responsible for:
•	Debugger UI panels
•	Variable tree
•	Call stack
•	Registers
•	Memory viewer
Submodules:
•	ide.debugger.variables
•	ide.debugger.callstack
•	ide.debugger.registers
•	ide.debugger.memory
________________________________________
4.2.3 ide.workspace
Responsible for:
•	Project tree
•	Open files
•	Workspace metadata
•	Module awareness
Submodules:
•	ide.workspace.tree
•	ide.workspace.modules
•	ide.workspace.state
________________________________________
4.2.4 ide.ui
Responsible for:
•	Docking layout
•	Themes
•	Toolbar
•	Status bar
•	Command palette
Submodules:
•	ide.ui.layout
•	ide.ui.theme
•	ide.ui.shortcuts
•	ide.ui.commands
________________________________________
4.2.5 ide.protocol
Responsible for:
•	WebSocket client
•	Message schemas
•	Event routing
Submodules:
•	ide.protocol.transport
•	ide.protocol.schemas
•	ide.protocol.router
________________________________________
4.3 Backend Namespaces (C++)
Backend namespaces follow the pattern:
citadel::<subsystem>
(“citadel” is a placeholder name and may be renamed later.)
________________________________________
4.3.1 citadel::debugger
Responsible for:
•	MI protocol driver
•	Breakpoint manager
•	Stepping controller
•	Thread/process manager
•	Variable evaluator
•	Register/memory inspector
Submodules:
•	citadel::debugger::mi
•	citadel::debugger::breakpoints
•	citadel::debugger::stepping
•	citadel::debugger::threads
•	citadel::debugger::variables
•	citadel::debugger::registers
•	citadel::debugger::memory
________________________________________
4.3.2 citadel::dwarf
Responsible for:
•	DWARF parsing
•	Symbol resolution
•	Type information
•	PC → file:line mapping
Submodules:
•	citadel::dwarf::parser
•	citadel::dwarf::lineinfo
•	citadel::dwarf::types
•	citadel::dwarf::symbols
________________________________________
4.3.3 citadel::workspace
Responsible for:
•	Project metadata
•	File tree
•	Module definitions
•	Include resolution
Submodules:
•	citadel::workspace::metadata
•	citadel::workspace::modules
•	citadel::workspace::files
________________________________________
4.3.4 citadel::compiler
Responsible for:
•	Compiler driver
•	Linker driver
•	Diagnostic parser
•	Artifact manager
Submodules:
•	citadel::compiler::driver
•	citadel::compiler::linker
•	citadel::compiler::diagnostics
•	citadel::compiler::artifacts
________________________________________
4.3.5 citadel::protocol
Responsible for:
•	WebSocket server
•	Message routing
•	Schema validation
•	Event broadcasting
Submodules:
•	citadel::protocol::transport
•	citadel::protocol::router
•	citadel::protocol::schemas
________________________________________
4.3.6 citadel::util
Shared utilities:
•	Logging
•	Threading
•	File I/O
•	String utilities
•	JSON parsing
Submodules:
•	citadel::util::log
•	citadel::util::fs
•	citadel::util::json
________________________________________
4.4 Directory Structure
Top Level Repository Layout
/oside
  /frontend
  /backend
  /protocol
  /templates
  /samples
  /docs
  /scripts
  /tools
  .gitignore
  LICENSE
  README.md
The top-level repository must contain:
•	The IDE frontend implemented in React/TypeScript
•	The IDE backend daemon implemented in C++20/23
•	Shared protocol schemas and examples
•	The canonical OS IDE Project template used by Version 1
•	A sample OS project that builds successfully and can be debugged through the Version 1 workflow
•	Project documentation, including the master specification, architecture notes, and roadmap material
•	Development scripts for environment setup, build, run, and formatting tasks
•	Optional helper tools that remain internal to the repository
Frontend Directory Layout
/frontend
  /public
  /src
    /editor
    /debugger
    /workspace
    /ui
    /protocol
    /components
    /themes
  package.json
  tsconfig.json
Frontend Source Layout
/frontend/src
  /app
  /editor
    /buffer
    /syntax
    /diagnostics
    /navigation
    /components
  /debugger
    /variables
    /callstack
    /registers
    /memory
    /breakpoints
    /session
  /workspace
    /tree
    /modules
    /state
    /project
  /ui
    /layout
    /theme
    /shortcuts
    /commands
    /shell
  /protocol
    /transport
    /router
    /client
    /hooks
  /components
    /common
    /layout
  /themes
  main.tsx
  App.tsx
Frontend Bootstrap Files
/frontend/src/main.tsx
•	Mounts the React application and initializes the frontend runtime
/frontend/src/App.tsx
•	Composes the top-level application providers and shell entry point
/frontend/src/app/AppShell.tsx
•	Defines the primary workbench shell used in Version 1
/frontend/src/app/AppProviders.tsx
•	Registers protocol, workspace, theme, and command providers
/frontend/src/protocol/client/WebSocketClient.ts
•	Implements the frontend protocol transport against the shared contract
/frontend/src/protocol/router/MessageRouter.ts
•	Dispatches validated inbound messages to frontend subsystems
/frontend/src/ui/shell/Workbench.tsx
•	Defines the initial editor, project tree, and output panel composition
Backend Directory Layout
/backend
  /include
  /src
    /debugger
    /dwarf
    /workspace
    /compiler
    /protocol
    /util
  CMakeLists.txt
  /third_party
Backend Source Layout
/backend/src
  /main
  /debugger
    /mi
    /breakpoints
    /stepping
    /threads
    /variables
    /registers
    /memory
    /session
  /dwarf
    /parser
    /lineinfo
    /types
    /symbols
  /workspace
    /metadata
    /modules
    /files
    /watcher
  /compiler
    /driver
    /linker
    /diagnostics
    /artifacts
    /toolchain
  /protocol
    /transport
    /router
    /server
    /handlers
  /util
    /log
    /fs
    /json
    /process
    /threading
Backend Bootstrap Files
/backend/src/main/main.cpp
•	Application entry point for the backend daemon
/backend/src/main/Application.cpp
•	Bootstraps configuration, protocol server, and subsystem registration
/backend/include/citadel/Application.hpp
•	Declares the backend application lifecycle and startup surface
/backend/src/protocol/server/WebSocketServer.cpp
•	Hosts the Version 1 local protocol transport
/backend/include/citadel/protocol/WebSocketServer.hpp
•	Declares the backend WebSocket transport interface
/backend/src/protocol/router/MessageRouter.cpp
•	Routes validated requests into debugger, build, and project handlers
/backend/src/protocol/handlers/RegisterHandlers.cpp
•	Registers the initial Version 1 command handlers
Protocol Layout
/protocol
  /schemas
  /examples
  README.md
The top-level protocol directory defines the shared contract between frontend and backend. It is the canonical source of message shapes, schema versions, and protocol examples. The /frontend/src/protocol and /backend/src/protocol directories contain transport and routing implementations for their respective layers and must not redefine the shared contract.
Protocol Schema Layout
/protocol/schemas
  /common
  /debug
  /build
  /project
  /events
  /commands
  index.ts
Protocol Schema Files
/protocol/schemas/common/envelope.ts
•	Defines the shared message envelope, requestId, type, and payload shape
/protocol/schemas/common/error.ts
•	Defines structured protocol error payloads and error codes
/protocol/schemas/common/version.ts
•	Defines protocolVersion and compatibility metadata
/protocol/schemas/common/identifiers.ts
•	Defines shared IDs for sessions, threads, frames, files, and modules
/protocol/schemas/commands/debug.ts
•	Defines debug.start, debug.stop, debug.pause, debug.continue, debug.stepInto, debug.stepOver, debug.stepOut, debug.setBreakpoint, debug.removeBreakpoint, debug.readMemory, and debug.evaluateExpression
/protocol/schemas/commands/build.ts
•	Defines build.start, build.stop, and build.clean
/protocol/schemas/commands/project.ts
•	Defines project.openFile, project.saveFile, and project.loadMetadata
/protocol/schemas/events/debug.ts
•	Defines debug.sessionStarted, debug.sessionEnded, debug.paused, debug.resumed, debug.stepComplete, debug.breakpointHit, debug.variablesUpdated, debug.callStackUpdated, debug.registersUpdated, and debug.memoryChunk
/protocol/schemas/events/build.ts
•	Defines build.output, build.diagnostic, and build.complete
/protocol/schemas/events/project.ts
•	Defines project.fileChanged and project.metadataLoaded
/protocol/schemas/debug/types.ts
•	Defines breakpoint, debugger session, thread, frame, variable, register, and memory data models
/protocol/schemas/build/types.ts
•	Defines build configuration, diagnostic, artifact, and build result models
/protocol/schemas/project/types.ts
•	Defines project metadata, workspace state, file state, and module state models
/protocol/schemas/index.ts
•	Exports the Version 1 protocol contract as the single import surface for schema consumers
Template Layout
/templates
  /os-project
    /src
    /include
    /modules
    /boot
    linker.ld
    project.json
Sample Layout
/samples
  /tinyos
    /src
    /include
    /boot
    /modules
    linker.ld
    project.json
Documentation Layout
/docs
  /master-spec
  /architecture
  /roadmap
  README.md
Scripts Layout
/scripts
  build.sh
  run.sh
  setup-dev.sh
  format.sh
Tools Layout
/tools
  /elf-dump
________________________________________
4.5 Architectural Rules
Rule 1 — No Cross Layer Leakage
Frontend never touches backend internals.
Backend never touches frontend internals.
Rule 2 — All Cross Layer Communication Goes Through Protocol Layer
No frontend subsystem may bypass the protocol layer when communicating with the backend, and no backend subsystem may expose cross-layer APIs outside the protocol layer.
Rule 3 — Subsystems Are Independent
•	Debugger Engine does not depend on Build System
•	Editor Engine does not depend on Debugger Engine
•	UI Framework does not depend on Project System
Rule 4 — Shared Types Must Live in Schema Layer
All shared message types must be defined in:
•	ide.protocol.schemas
•	citadel::protocol::schemas
Rule 5 — No Circular Dependencies
Enforced at compile time.
________________________________________
4.6 Extensibility
Future expansions must follow namespace rules:
•	Plugins live under ide.plugins.*
•	Backend extensions live under citadel::extensions::*
•	New panels must register with ide.ui.layout
•	New debugger backends must implement citadel::debugger::Backend interface
________________________________________
________________________________________
📄 PAGE 6 — SECTION 5: DEPLOYMENT MODEL
5. Deployment Model
This section defines how The OS IDE is packaged, delivered, and executed. It establishes the runtime architecture, process model, distribution strategy, and security considerations for all editions (Basic, Community, Professional). For Version 1, the deployment model is intentionally limited to a Linux-hosted IDE shell with integrated build and debug frontends. Boot orchestration remains external in Version 1.
________________________________________
5.1 Deployment Options Considered
Three deployment models were evaluated:
A. Standalone Native Application
•	C++ UI (Qt, wxWidgets, custom)
•	Maximum performance
•	Highest development cost
B. Hybrid Web Frontend + Native Backend
→ Selected Model
•	React/TypeScript frontend
•	Native C++ backend
•	WebSocket communication
•	Best balance of performance and development speed
C. Fully Web Based IDE
•	Browser only
•	Limited access to native debugging tools
•	Not suitable for kernel development
The chosen model (B) provides:
•	Fast UI iteration
•	Native performance for debugging and parsing
•	Clean separation of concerns
•	A clear path to future native UI migration
________________________________________
5.2 Final Deployment Architecture
The IDE consists of two primary executables:
1. Frontend Application
•	Runs as a local desktop app (Electron, Tauri, or native WebView)
•	Renders UI using React
•	Hosts Monaco/CodeMirror editor
•	Connects to backend via WebSocket
•	Owns the IDE shell, build frontend, and debug frontend UX in Version 1
2. Backend Daemon
•	Native C++ executable
•	Runs Debugger Engine
•	Runs Build System
•	Runs Project System
•	Performs DWARF/ELF parsing
•	Exposes WebSocket API
Communication occurs over:
•	ws://localhost:<port>
•	JSON messages
•	Strict schema validation
Target boot and emulator launch are initiated outside the IDE in Version 1, with the IDE attaching to the resulting debug target when needed.
________________________________________
5.3 Process Model
Frontend Process
Responsible for:
•	UI rendering
•	Editor engine
•	Panels and layout
•	Protocol client
•	Local file access (via backend)
Backend Process
Responsible for:
•	Debugger Engine (MI driver)
•	Build System (compiler/linker orchestration)
•	DWARF/ELF parsing
•	Project metadata loading
•	File system operations
•	Logging and diagnostics
Optional Child Processes
•	GDB/LLDB subprocess
•	Compiler subprocesses
•	Linker subprocess
•	PTY session for debugger console
Boot loaders, emulators, and external target launchers are not owned by the IDE process model in Version 1.
________________________________________
5.4 Packaging & Distribution
Frontend Packaging
Supported options:
•	Electron — simple, heavier
•	Tauri — lightweight, Rust shell
•	Native WebView — C++ wrapper
Recommended:
•	Prototype: Browser + local backend
•	Final product: Tauri
Backend Packaging
•	Single C++ executable
•	Bundled with IDE installer
•	Includes DWARF/ELF parsers
•	Includes MI protocol driver
•	Includes build orchestrator
Installer
•	Bundles frontend + backend
•	Optionally installs toolchain dependencies
•	Configures environment variables
________________________________________
5.5 Runtime Environment
Supported Platforms
•	Linux only in Version 1
•	Windows deferred to Version 2
•	macOS deferred until a later version
Backend Requirements
•	POSIX APIs
•	PTY support
•	File system access
•	Process spawning
Frontend Requirements
•	WebView or browser
•	GPU acceleration
•	Local WebSocket support
________________________________________
5.6 Security Model
Local Only Communication
•	Backend listens only on localhost
•	No remote debugging unless explicitly enabled
Sandboxing
•	Frontend cannot access filesystem directly
•	All file operations routed through backend
Permissions
•	Backend validates all file paths
•	No arbitrary command execution from frontend
________________________________________
5.7 Update Model
Frontend Updates
•	Delivered as packaged assets
•	Auto update via version manifest
Backend Updates
•	Delivered as binary patches
•	Must maintain protocol compatibility
Protocol Versioning
•	Messages include protocolVersion
•	Backward compatibility required for minor versions
________________________________________
5.8 Extensibility & Future Deployment Options
The deployment model must support:
•	Plugin system (frontend + backend)
•	Remote debugging
•	Remote build servers
•	Multi backend debugger support
•	Native C++ UI rewrite (future)
________________________________________
5.9 Recommended Development Path
Phase 1 — Web Prototype
•	React frontend
•	Linux-only Node or C++ backend
•	Rapid iteration
Phase 2 — Hybrid Desktop App
•	Tauri or Electron
•	Native backend
•	Local WebSocket
Phase 3 — Windows Support (Version 2)
•	Windows process abstraction
•	Windows terminal and debugger transport support
•	Protocol-compatible frontend and backend port
Phase 4 — Full Native IDE (Optional)
•	C++ UI framework
•	Zero browser dependencies
•	Maximum performance
________________________________________
________________________________________
📄 PAGE 7 — SECTION 6: FUTURE EXTENSIONS
6. Future Extensions
This section defines advanced features planned for future versions of The OS IDE. These extensions are not required for the initial release but must be considered in the architecture to ensure compatibility and smooth integration later.
The goal is to create a roadmap of high impact features that enhance OS development, debugging, visualization, and analysis across all editions (Basic, Community, Professional), with some features reserved for higher tiers.
________________________________________
6.1 Kernel Timeline Viewer
A visual timeline showing kernel events over time.
6.1.1 Capabilities
•	Thread scheduling timeline
•	Interrupts and ISRs
•	Context switches
•	Module load/unload events
•	System calls (if instrumented)
•	Memory allocation events
6.1.2 UI Features
•	Zoomable timeline
•	Hover for event details
•	Color coded event types
•	Filter by thread/module
6.1.3 Backend Requirements
•	Tracepoint collection
•	Event buffering
•	Timestamp synchronization
________________________________________
6.2 Heap & Memory Visualizer
A graphical view of memory usage.
6.2.1 Capabilities
•	Heap allocation map
•	Free/used block visualization
•	Fragmentation analysis
•	Per module memory usage
•	Live updates during debugging
6.2.2 UI Features
•	Heatmap view
•	Tree map view
•	Allocation history
•	Pointer follow through
6.2.3 Backend Requirements
•	Integration with kernel memory allocator
•	Custom debug hooks
•	Memory snapshot API
________________________________________
6.3 Interrupt Monitor
A real time view of hardware and software interrupts.
6.3.1 Capabilities
•	IRQ frequency
•	ISR execution time
•	Nested interrupts
•	Per CPU interrupt load
6.3.2 UI Features
•	Live charts
•	Per interrupt breakdown
•	ISR source mapping
•	Highlight abnormal spikes
6.3.3 Backend Requirements
•	Kernel instrumentation
•	Interrupt tracepoints
•	Per CPU counters
________________________________________
6.4 Module Dependency Graph
A visual graph of module relationships.
6.4.1 Capabilities
•	Show module imports/exports
•	Symbol dependency mapping
•	Circular dependency detection
•	Versioning and metadata display
6.4.2 UI Features
•	Force directed graph
•	Click to open module
•	Hover to show exported symbols
•	Filter by dependency type
6.4.3 Backend Requirements
•	ELF symbol extraction
•	Module metadata parser
•	Dependency resolver
________________________________________
6.5 Time Travel Debugging (Future)
Record and replay execution.
6.5.1 Capabilities
•	Reverse step
•	Reverse continue
•	Snapshot/restore state
•	Deterministic replay
6.5.2 UI Features
•	Timeline scrubber
•	Snapshot markers
•	Reverse stepping buttons
6.5.3 Backend Requirements
•	Execution recorder
•	Memory snapshotting
•	Instruction log
•	Deterministic scheduling
________________________________________
6.6 Static Analysis Tools
Integrated static analysis for C/C++.
6.6.1 Capabilities
•	Linting
•	Dead code detection
•	Uninitialized variable detection
•	Race condition detection
•	Security checks
6.6.2 UI Features
•	Inline warnings
•	Analysis report panel
•	Quick fixes (future)
6.6.3 Backend Requirements
•	Clang static analyzer integration
•	Custom rule engine
________________________________________
6.7 Symbol Database & Code Indexer
A full project index for fast navigation.
6.7.1 Capabilities
•	Global symbol search
•	Cross reference database
•	Fast “go to definition”
•	Fast “find references”
6.7.2 UI Features
•	Symbol search bar
•	Outline view
•	Cross reference panel
6.7.3 Backend Requirements
•	Incremental indexing
•	AST parsing
•	Symbol graph storage
________________________________________
6.8 Plugin System
Allow third party extensions.
6.8.1 Capabilities
•	Custom panels
•	Custom commands
•	Custom themes
•	Custom debugger backends
•	Custom build tasks
6.8.2 Plugin API
•	WebSocket based
•	Schema validated
•	Sandboxed
6.8.3 Security
•	Permission model
•	Plugin signing
•	Resource limits
________________________________________
6.9 Remote Debugging & Build Servers
Support for distributed workflows.
6.9.1 Capabilities
•	Debug remote kernel over network
•	Build on remote machine
•	Sync artifacts
•	Remote file browsing
6.9.2 UI Features
•	Connection manager
•	Remote host panel
•	Latency indicators
6.9.3 Backend Requirements
•	Secure RPC
•	SSH integration
•	Remote file system API
________________________________________
6.10 Multi Backend Debugger Support
Support for additional debuggers beyond GDB/LLDB.
6.10.1 Potential Backends
•	Custom kernel debugger
•	QEMU built in debugger
•	Bochs debugger
•	JTAG hardware debugger
6.10.2 Requirements
•	Unified debugger interface
•	Backend adapter layer
•	Capability negotiation
________________________________________
6.11 AI Assisted Development (Optional Future)
AI powered enhancements for OS development.
6.11.1 Capabilities
•	Code suggestions
•	Inline documentation
•	Kernel error explanation
•	Crash dump analysis
6.11.2 UI Features
•	Inline hints
•	Side panel assistant
•	“Explain this crash” button
6.11.3 Backend Requirements
•	Local model or remote API
•	Privacy controls
________________________________________
________________________________________
📄 PAGE 8 — APPENDICES
Appendix A — Glossary of Terms
This glossary defines key terminology used throughout The OS IDE Master Systems Specification.
Breakpoint
A marker that pauses program execution at a specific file and line.
Call Stack
A list of active function frames at a given point during execution.
DWARF
A standardized debugging data format used to map machine code back to source code.
ELF
Executable and Linkable Format — the binary format used for kernel images, modules, and object files.
Frontend
The UI layer of the IDE, implemented in React/TypeScript.
Backend
The native C++ subsystem responsible for debugging, building, and project metadata.
MI Protocol
Machine Interface protocol used by GDB/LLDB for structured debugger communication.
Module
A loadable component of the OS (e.g., drivers, subsystems).
Symbol
A named entity in a binary (function, variable, type).
Tracepoint
A lightweight instrumentation hook used for timeline and event capture.
Workspace
The project environment, including files, modules, settings, and metadata.
________________________________________
Appendix B — Message Schema Index
This appendix lists the major message types exchanged between frontend and backend.
(Full schemas are defined in the Protocol Specification Document, if you choose to create one later.)
B.1 Debugger Commands
•	debug.start
•	debug.stop
•	debug.pause
•	debug.continue
•	debug.stepInto
•	debug.stepOver
•	debug.stepOut
•	debug.setBreakpoint
•	debug.removeBreakpoint
•	debug.readMemory
•	debug.evaluateExpression
B.2 Debugger Events
•	debug.sessionStarted
•	debug.sessionEnded
•	debug.paused
•	debug.resumed
•	debug.stepComplete
•	debug.breakpointHit
•	debug.variablesUpdated
•	debug.callStackUpdated
•	debug.registersUpdated
•	debug.memoryChunk
B.3 Build Commands
•	build.start
•	build.stop
•	build.clean
B.4 Build Events
•	build.output
•	build.diagnostic
•	build.complete
B.5 Project Commands
•	project.openFile
•	project.saveFile
•	project.loadMetadata
B.6 Project Events
•	project.fileChanged
•	project.metadataLoaded
________________________________________
Appendix C — Architecture Diagrams (Text Based)
These diagrams can be converted into graphical diagrams in Word, PowerPoint, or draw.io.
________________________________________
C.1 High Level Architecture
+---------------------------+
|        Frontend           |
|  (React / TypeScript)     |
+---------------------------+
            |
            | WebSocket (JSON)
            v
+---------------------------+
|         Backend           |
|      (C++20/23)           |
+---------------------------+
            |
            | Subprocesses
            v
+---------------------------+
| GDB/LLDB | Compiler | Linker |
+---------------------------+
________________________________________
C.2 Frontend Subsystem Diagram
+---------------------------+
|        ide.ui             |
+---------------------------+
|  Layout | Theme | Commands |
+---------------------------+

+---------------------------+
|      ide.editor           |
+---------------------------+
| Buffer | Syntax | Nav     |
+---------------------------+

+---------------------------+
|     ide.debugger          |
+---------------------------+
| Vars | Stack | Regs | Mem |
+---------------------------+

+---------------------------+
|     ide.workspace         |
+---------------------------+
| Tree | Modules | State    |
+---------------------------+

+---------------------------+
|     ide.protocol          |
+---------------------------+
| Transport | Router | Schemas |
+---------------------------+
________________________________________
C.3 Backend Subsystem Diagram
+--------------------------------+
|       citadel::protocol        |
+--------------------------------+
| WebSocket | Router | Schemas   |
+--------------------------------+

+--------------------------------+
|       citadel::debugger        |
+--------------------------------+
| MI | Breakpoints | Stepping    |
| Threads | Vars | Regs | Mem    |
+--------------------------------+

+--------------------------------+
|        citadel::dwarf          |
+--------------------------------+
| Parser | LineInfo | Types      |
+--------------------------------+

+--------------------------------+
|       citadel::workspace       |
+--------------------------------+
| Metadata | Modules | Files     |
+--------------------------------+

+--------------------------------+
|        citadel::compiler       |
+--------------------------------+
| Driver | Linker | Diagnostics  |
+--------------------------------+

+--------------------------------+
|         citadel::util          |
+--------------------------------+
| Log | FS | JSON | Threads      |
+--------------------------------+
________________________________________
Appendix D — Build Pipeline Diagram
+----------------------+
| 1. Load Metadata     |
+----------------------+
            |
            v
+----------------------+
| 2. Resolve Includes  |
+----------------------+
            |
            v
+----------------------+
| 3. Compile Sources   |
+----------------------+
            |
            v
+----------------------+
| 4. Parse Diagnostics |
+----------------------+
            |
            v
+----------------------+
| 5. Link Artifacts    |
+----------------------+
            |
            v
+----------------------+
| 6. Emit Results      |
+----------------------+
________________________________________
Appendix E — Debugger Event Flow Diagram
Frontend Action: Step Into
            |
            v
+---------------------------+
| ide.protocol.transport    |
+---------------------------+
            |
            v
+---------------------------+
| citadel::protocol         |
+---------------------------+
            |
            v
+---------------------------+
| citadel::debugger         |
| (MI: -exec-step)          |
+---------------------------+
            |
            v
+---------------------------+
| GDB/LLDB                  |
+---------------------------+
            |
            v
+---------------------------+
| Debugger Event (stopped)  |
+---------------------------+
            |
            v
+---------------------------+
| citadel::protocol         |
+---------------------------+
            |
            v
+---------------------------+
| ide.debugger UI updates   |
+---------------------------+
________________________________________
Appendix F — Suggested Future Documents
These are optional but recommended for a full professional suite:
•	Protocol Specification Document
•	Debugger Backend Developer Guide
•	Build System Integration Guide
•	Plugin API Reference
•	UI/UX Style Guide
•	Kernel Instrumentation Guide
________________________________________

