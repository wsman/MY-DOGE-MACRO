#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Manager, State, ipc::Channel};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};
use uuid::Uuid;
use futures_util::StreamExt;

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

const DEEPSEEK_API_KEY: &str = "sk-72a6f08dac844df7b12b7e6717d96282";

// Tauri命令：获取Python配置（前端用）
#[tauri::command]
fn get_python_config(state: State<'_, AppState>) -> PythonConfig {
    state.config.lock().unwrap().clone()
}

// 获取 AI 提示词模板
#[tauri::command]
async fn get_ai_template(name: String) -> Result<String, String> {
    // 假设路径相对于工作区根目录
    // 注意：在实际部署中可能需要处理资源路径
    let path = std::path::Path::new("../../../library/ai/FinancePrompts.md");
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("无法读取模板文件: {}", e))?;
    
    // 简单解析，查找对应的章节
    let sections: Vec<&str> = content.split("## ").collect();
    for section in sections {
        if section.starts_with(&name) {
            if let Some(start) = section.find("```markdown") {
                if let Some(end) = section[start..].find("```") {
                    let template = &section[start + 11..start + end];
                    return Ok(template.trim().to_string());
                }
            }
        }
    }
    
    Err("未找到指定的模板".to_string())
}

// AI策略生成命令（支持流式）
#[tauri::command]
async fn generate_strategy(
    prompt: String,
    source: String,
    on_event: Channel<String>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    
    let (url, model, api_key) = if source == "cloud" {
        (
            "https://api.deepseek.com/chat/completions",
            "deepseek-reasoner",
            Some(DEEPSEEK_API_KEY)
        )
    } else {
        (
            "http://localhost:11434/v1/chat/completions",
            "deepseek-r1:7b",
            None
        )
    };

    let mut request = client.post(url);
    
    if let Some(key) = api_key {
        request = request.header("Authorization", format!("Bearer {}", key));
    }

    let res = request
        .json(&serde_json::json!({
            "model": model, 
            "messages": [
                {"role": "system", "content": "你是一个资深的金融分析师。"},
                {"role": "user", "content": prompt}
            ],
            "stream": true
        }))
        .send()
        .await
        .map_err(|e| format!("AI Service Connection Error: {}", e))?;

    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let text = String::from_utf8_lossy(&chunk);
        
        // 处理 OpenAI 流式格式
        for line in text.lines() {
            let line = line.trim();
            if line.is_empty() { continue; }
            if line == "data: [DONE]" { break; }
            
            if line.starts_with("data: ") {
                let json_str = &line[6..];
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(json_str) {
                    let choice = &json["choices"][0];
                    let delta = &choice["delta"];
                    
                    // Handle both content and reasoning_content (for deepseek-reasoner)
                    if let Some(content) = delta["content"].as_str() {
                        let _ = on_event.send(content.to_string());
                    } else if let Some(reasoning) = delta["reasoning_content"].as_str() {
                        // For simplicity, we can wrap reasoning in a style or just send it
                        // Here we just send it to keep the UI alive
                        let _ = on_event.send(reasoning.to_string());
                    }
                }
            }
        }
    }

    Ok(())
}

fn main() {
    // A. 动态准备配置
    // 使用固定端口，方便开发时手动启动后端
    let port = 8765;
    let token = "mydoge-token-123456".to_string();
    let api_url = format!("http://127.0.0.1:{}", port);
    
    println!("🚀 Python服务配置: 端口={}, token={}...", port, &token[..8]);
    println!("💡 提示: 请在另一个终端手动启动 Python 后端:");
    println!("   cd D:\\Users\\Administrator\\Desktop\\MY-DOGE-MACRO");
    println!("   python -m server.server --host 0.0.0.0 --port {}", port);
    
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
        .invoke_handler(tauri::generate_handler![get_python_config, generate_strategy, get_ai_template])
        .setup(move |_app| {
            // B. 开发模式：跳过 sidecar，后端需要手动启动
            // 打包生产版本时，可以取消注释以下代码来启用 sidecar
            /*
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
            */

            println!("✅ Tauri 应用启动成功！");
            println!("🌐 请确保 Python 后端正在运行...");
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
