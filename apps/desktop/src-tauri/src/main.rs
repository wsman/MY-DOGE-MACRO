#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};
use uuid::Uuid;

// 1. 定义配置结构体
#[derive(Debug, Clone, serde::Serialize)]
struct PythonConfig {
    port: u16,
    token: String,
    api_url: String,
}

// 2. 定义全局状态
struct AppState {
    config: Mutex<PythonConfig>,
}

// Tauri命令：获取Python配置（前端用）
#[tauri::command]
fn get_python_config(state: State<'_, AppState>) -> PythonConfig {
    state.config.lock().unwrap().clone()
}

fn main() {
    // A. 动态准备配置
    let port = portpicker::pick_unused_port().expect("No free ports available");
    let token = Uuid::new_v4().to_string();
    let api_url = format!("http://127.0.0.1:{}", port);
    
    println!("🚀 Python服务配置: 端口={}, token={}...", port, &token[..8]);
    
    // 初始化状态
    let app_state = AppState {
        config: Mutex::new(PythonConfig {
            port,
            token: token.clone(),
            api_url: api_url.clone(),
        }),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(app_state) // 注入状态
        .invoke_handler(tauri::generate_handler![get_python_config])
        .setup(move |app| {
            // B. 启动 Sidecar (Python打包的EXE服务)
            let (mut rx, child) = app.shell()
                .sidecar("backend_api")
                .expect("Failed to create sidecar command")
                .args([
                    "--port", &port.to_string(),
                    "--token", &token,
                    "--parent-pid", &std::process::id().to_string()
                ])
                .spawn()
                .expect("Failed to spawn sidecar");
            
            println!("✅ Python sidecar 已启动，PID: {:?}", child.pid());

            // C. 异步日志转发（便于调试）
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let output = String::from_utf8_lossy(&line);
                            println!("[PYTHON]: {}", output.trim());
                        }
                        CommandEvent::Stderr(line) => {
                            let output = String::from_utf8_lossy(&line);
                            eprintln!("[PYTHON ERR]: {}", output.trim());
                        }
                        CommandEvent::Terminated(exit_status) => {
                            println!("[PYTHON]: 进程已终止，退出状态: {:?}", exit_status);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
