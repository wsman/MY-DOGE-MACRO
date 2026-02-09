# Secure IPC Communication Pattern: Tauri-React Bridge

This pattern describes the secure communication bridge between a React frontend and a Python backend via Tauri, as implemented in MY-DOGE-MACRO.

## Architecture Overview

1.  **Tauri Backend (Rust)**:
    -   Stores sensitive configuration (API tokens, ports) in a managed state.
    -   Exposes a command to provide this config to the frontend.
2.  **Frontend (React)**:
    -   Invokes the Tauri command upon initialization.
    -   Uses the retrieved token/port to establish a direct Axios connection to a local Python server.
3.  **Python Backend**:
    -   Runs as a sidecar or standalone service.
    -   Validates requests using the `x-auth-token` header.

## Implementation Pattern

### 1. Rust: Config Storage and Command
```rust
#[derive(serde::Serialize)]
struct PythonConfig {
    port: u16,
    token: String,
}

struct AppState {
    config: Mutex<PythonConfig>,
}

#[tauri::command]
fn get_python_config(state: State<'_, AppState>) -> PythonConfig {
    state.config.lock().unwrap().clone()
}
```

### 2. TypeScript: Secure Handshake
```typescript
class ApiService {
  private config: PythonConfig | null = null;

  private async initialize() {
    if (window.__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      this.config = await invoke<PythonConfig>('get_python_config');
    }
    
    this.client = axios.create({
      baseURL: `http://localhost:${this.config.port}`,
      headers: {
        'x-auth-token': this.config.token,
        'X-Client': 'my-doge-tauri',
      },
    });
  }
}
```

### 3. Security Benefits
-   **Token Masking**: The API token is never hardcoded in the frontend source; it is generated/stored in the Rust layer.
-   **Dynamic Porting**: Prevents port conflicts by allowing Rust to negotiate a port and tell the frontend where to connect.
-   **Environment Awareness**: Easily switches between "Dev Mode" (mock config) and "Tauri Mode" (real secure config).
