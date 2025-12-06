// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::State;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, Networks, System};

struct SystemState {
    system: Mutex<System>,
    networks: Mutex<Networks>,
}

#[tauri::command]
fn get_system_stats(state: State<SystemState>) -> (f32, u64, u64, u64, u64) {
    let mut sys = state.system.lock().unwrap();
    let mut nets = state.networks.lock().unwrap();
    
    sys.refresh_cpu_all();
    sys.refresh_memory();
    nets.refresh(true); // Refresh network list

    let cpu_usage = sys.global_cpu_usage();
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();

    let mut rx = 0;
    let mut tx = 0;
    for (_name, network) in nets.iter() {
        rx += network.received();
        tx += network.transmitted();
    }

    (cpu_usage, used_mem, total_mem, rx, tx)
}

#[tauri::command]
async fn fetch_rss(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let text = resp.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

fn main() {
    let mut sys = System::new_with_specifics(
        RefreshKind::nothing()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );
    let nets = Networks::new_with_refreshed_list();

    // Initial refresh
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_cpu_all();
    sys.refresh_memory();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(SystemState {
            system: Mutex::new(sys),
            networks: Mutex::new(nets),
        })
        .invoke_handler(tauri::generate_handler![get_system_stats, fetch_rss])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
