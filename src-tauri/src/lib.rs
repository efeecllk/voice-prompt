use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSApp, NSApplication};
#[cfg(target_os = "macos")]
use cocoa::base::YES;

#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl, runtime::Object};

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    SetWindowPos, SetForegroundWindow, ShowWindow,
    HWND_TOPMOST, SWP_NOMOVE, SWP_NOSIZE, SWP_SHOWWINDOW, SW_SHOW,
};

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

#[cfg(target_os = "windows")]
fn configure_windows_window(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;

    // Get the HWND and configure window properties
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let hwnd = HWND(hwnd.0);
            // Set window as topmost so it appears above other windows
            let _ = SetWindowPos(
                hwnd,
                HWND_TOPMOST,
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW,
            );
        }
    }
}

#[cfg(target_os = "windows")]
fn activate_windows_app(window: &tauri::WebviewWindow) {
    use windows::Win32::Foundation::HWND;

    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let hwnd = HWND(hwnd.0);
            let _ = ShowWindow(hwnd, SW_SHOW);
            let _ = SetForegroundWindow(hwnd);
        }
    }
}

fn show_window_at_position(_app: &AppHandle, window: &tauri::WebviewWindow, x: f64, y: f64) {
    // Configure platform-specific window properties
    #[cfg(target_os = "macos")]
    configure_macos_window(window);

    #[cfg(target_os = "windows")]
    configure_windows_window(window);

    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
    let _ = window.show();
    let _ = window.set_focus();

    // Platform-specific activation to bring window to front
    #[cfg(target_os = "macos")]
    {
        unsafe {
            let ns_app = NSApp();
            ns_app.activateIgnoringOtherApps_(YES);
        }
    }

    #[cfg(target_os = "windows")]
    activate_windows_app(window);
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

        #[cfg(target_os = "windows")]
        configure_windows_window(window);

        let _ = window.show();
        let _ = window.set_focus();

        #[cfg(target_os = "macos")]
        {
            unsafe {
                let ns_app = NSApp();
                ns_app.activateIgnoringOtherApps_(YES);
            }
        }

        #[cfg(target_os = "windows")]
        activate_windows_app(window);
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Create tray menu
            let quit_item = MenuItem::with_id(app, "quit", "Quit Voice Prompt", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_item])?;

            // Create tray icon - use platform-specific icon
            #[cfg(target_os = "macos")]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/macos/tray-icon@2x.png"))
                .expect("Failed to load tray icon");
            #[cfg(target_os = "windows")]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/shared/32x32.png"))
                .expect("Failed to load tray icon");
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/shared/32x32.png"))
                .expect("Failed to load tray icon");

            let mut tray_builder = TrayIconBuilder::new()
                .icon(tray_icon);

            // Only use template icon on macOS
            #[cfg(target_os = "macos")]
            {
                tray_builder = tray_builder.icon_as_template(true);
            }

            let _tray = tray_builder
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    if event.id == "quit" {
                        let confirmed = app
                            .dialog()
                            .message("Are you sure you want to quit?")
                            .title("Quit Voice Prompt")
                            .kind(MessageDialogKind::Warning)
                            .buttons(MessageDialogButtons::OkCancel)
                            .blocking_show();

                        if confirmed {
                            app.exit(0);
                        }
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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent default close behavior
                api.prevent_close();

                // Show confirmation dialog
                let window_clone = window.clone();
                let confirmed = window
                    .app_handle()
                    .dialog()
                    .message("Are you sure you want to close?")
                    .title("Close Voice Prompt")
                    .kind(MessageDialogKind::Warning)
                    .buttons(MessageDialogButtons::OkCancel)
                    .blocking_show();

                if confirmed {
                    // Hide window instead of closing (keep app running in tray)
                    let _ = window_clone.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Command to show window from frontend (used by global shortcut)
#[tauri::command]
fn show_and_focus_window(app: AppHandle, window: tauri::WebviewWindow) {
    show_window_at_cursor(&app, &window);
}
