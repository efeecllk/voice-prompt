use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition,
};

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSApp, NSApplication};

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl, runtime::Object};

// macOS NSWindow constants
#[cfg(target_os = "macos")]
const NS_WINDOW_COLLECTION_BEHAVIOR_CAN_JOIN_ALL_SPACES: u64 = 1 << 0;
#[cfg(target_os = "macos")]
const NS_WINDOW_COLLECTION_BEHAVIOR_FULL_SCREEN_AUXILIARY: u64 = 1 << 8;
#[cfg(target_os = "macos")]
const NS_WINDOW_COLLECTION_BEHAVIOR_STATIONARY: u64 = 1 << 4;
#[cfg(target_os = "macos")]
const NS_POPUP_MENU_WINDOW_LEVEL: i64 = 101;

#[cfg(target_os = "macos")]
fn configure_macos_window(window: &tauri::WebviewWindow) {
    unsafe {
        // Get NSWindow from Tauri window
        let ns_window = window.ns_window();
        if let Ok(ns_win) = ns_window {
            let ns_win = ns_win as *mut Object;

            // Set collection behavior to appear on all spaces including fullscreen
            let behavior: u64 = NS_WINDOW_COLLECTION_BEHAVIOR_CAN_JOIN_ALL_SPACES
                | NS_WINDOW_COLLECTION_BEHAVIOR_FULL_SCREEN_AUXILIARY
                | NS_WINDOW_COLLECTION_BEHAVIOR_STATIONARY;
            let _: () = msg_send![ns_win, setCollectionBehavior: behavior];

            // Set window level to popup menu level (appears over fullscreen apps)
            let _: () = msg_send![ns_win, setLevel: NS_POPUP_MENU_WINDOW_LEVEL];
        }
    }
}

fn show_window_at_position(_app: &AppHandle, window: &tauri::WebviewWindow, x: f64, y: f64) {
    // Configure macOS-specific window properties for fullscreen support
    #[cfg(target_os = "macos")]
    configure_macos_window(window);

    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
    let _ = window.show();
    let _ = window.set_focus();

    // On macOS, we need to activate the app to bring window to front
    #[cfg(target_os = "macos")]
    {
        unsafe {
            let ns_app = NSApp();
            ns_app.activateIgnoringOtherApps_(true);
        }
    }
}

fn show_window_at_cursor(app: &AppHandle, window: &tauri::WebviewWindow) {
    // Get cursor position and show window near it
    if let Ok(cursor_pos) = window.cursor_position() {
        let width = 360.0;
        let x = (cursor_pos.x - width / 2.0).max(0.0);
        let y = cursor_pos.y + 10.0;
        show_window_at_position(app, window, x, y);
    } else {
        // Fallback: configure and show at default position
        #[cfg(target_os = "macos")]
        configure_macos_window(window);

        let _ = window.show();
        let _ = window.set_focus();

        #[cfg(target_os = "macos")]
        {
            unsafe {
                let ns_app = NSApp();
                ns_app.activateIgnoringOtherApps_(true);
            }
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Create tray menu
            let quit_item = MenuItem::with_id(app, "quit", "Quit Voice Prompt", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id == "quit" {
                        app.exit(0);
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                // Position window below tray icon
                                let width = 360.0;
                                let x = (position.x - width / 2.0).max(0.0);
                                let y = position.y + 5.0;
                                show_window_at_position(&app, &window, x, y);
                            }
                        }
                    }
                })
                .build(app)?;

            // Hide from dock on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_and_focus_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Command to show window from frontend (used by global shortcut)
#[tauri::command]
fn show_and_focus_window(app: AppHandle, window: tauri::WebviewWindow) {
    show_window_at_cursor(&app, &window);
}
