mod recorder;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition,
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

// The window stays hidden while the global shortcut records, and WebKit suspends the
// page process of hidden views after a few seconds: the shortcut's JS handler and the
// transcription requests would not run until the window was shown again. These are
// private WKPreferences switches, so check they exist before calling them.
#[cfg(target_os = "macos")]
fn keep_webview_awake(webview: *mut std::ffi::c_void) {
    use objc::runtime::{BOOL, NO};

    unsafe {
        let webview = webview as *mut Object;
        let config: *mut Object = msg_send![webview, configuration];
        let prefs: *mut Object = msg_send![config, preferences];

        let suppression = sel!(_setPageVisibilityBasedProcessSuppressionEnabled:);
        let responds: BOOL = msg_send![prefs, respondsToSelector: suppression];
        if responds == YES {
            let _: () = msg_send![prefs, _setPageVisibilityBasedProcessSuppressionEnabled: NO];
        }

        let throttling = sel!(_setHiddenPageDOMTimerThrottlingEnabled:);
        let responds: BOOL = msg_send![prefs, respondsToSelector: throttling];
        if responds == YES {
            let _: () = msg_send![prefs, _setHiddenPageDOMTimerThrottlingEnabled: NO];
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

#[cfg(target_os = "linux")]
fn configure_linux_window(window: &tauri::WebviewWindow) {
    let _ = window.set_always_on_top(true);
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

fn show_window(window: &tauri::WebviewWindow, position: Option<(f64, f64)>) {
    // Configure platform-specific window properties
    #[cfg(target_os = "macos")]
    configure_macos_window(window);

    #[cfg(target_os = "windows")]
    configure_windows_window(window);

    #[cfg(target_os = "linux")]
    configure_linux_window(window);

    if let Some((x, y)) = position {
        let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
    }
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

fn show_window_at_cursor(window: &tauri::WebviewWindow) {
    // Show window near the cursor, or wherever it last was if the cursor is unavailable
    let width = 360.0;
    let position = window
        .cursor_position()
        .ok()
        .map(|cursor| ((cursor.x - width / 2.0).max(0.0), cursor.y + 10.0));
    show_window(window, position);
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(recorder::Recording::default())
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
                                show_window(&window, Some((x, y)));
                            }
                        }
                    }
                })
                .build(app)?;

            // Hide from dock on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Keep the hidden window's page running
            #[cfg(target_os = "macos")]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.with_webview(|webview| keep_webview_awake(webview.inner()));
            }

            // On Linux, keep the app visible in taskbar as a fallback
            // since not all DEs support tray icons (e.g. GNOME without extensions)
            #[cfg(target_os = "linux")]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_skip_taskbar(false);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_and_focus_window, hide_window, check_accessibility, detect_terminals, send_to_terminal, recorder::start_recording, recorder::stop_recording])
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
fn show_and_focus_window(window: tauri::WebviewWindow) {
    show_window_at_cursor(&window);
}

// Command to hide window before sending to terminal
#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) {
    let _ = window.hide();
}

// Send-to-terminal posts synthetic keystrokes, which macOS silently drops unless the app
// has Accessibility permission. With `prompt`, macOS shows its permission dialog and adds
// the app to the Accessibility list, so the user only has to flip the switch.
#[tauri::command]
fn check_accessibility(prompt: bool) -> bool {
    #[cfg(target_os = "macos")]
    {
        use core_foundation::base::TCFType;
        use core_foundation::boolean::CFBoolean;
        use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
        use core_foundation::string::{CFString, CFStringRef};

        #[link(name = "ApplicationServices", kind = "framework")]
        extern "C" {
            static kAXTrustedCheckOptionPrompt: CFStringRef;
            fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> u8;
        }

        unsafe {
            let key = CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt);
            let options = CFDictionary::from_CFType_pairs(&[(key, CFBoolean::from(prompt))]);
            AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef()) != 0
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = prompt;
        true
    }
}

#[derive(serde::Serialize)]
struct TerminalInfo {
    id: String,
    name: String,
    running: bool,
}

// (id, process name for pgrep, display name == macOS app name)
#[cfg(target_os = "macos")]
const TERMINALS: &[(&str, &str, &str)] = &[
    ("ghostty", "ghostty", "Ghostty"),
    ("warp", "Warp", "Warp"),
    ("terminal", "Terminal", "Terminal"),
    ("iterm2", "iTerm2", "iTerm2"),
];

#[cfg(target_os = "linux")]
const TERMINALS: &[(&str, &str, &str)] = &[
    ("alacritty", "alacritty", "Alacritty"),
    ("kitty", "kitty", "Kitty"),
    ("gnome-terminal", "gnome-terminal-server", "GNOME Terminal"),
    ("konsole", "konsole", "Konsole"),
    ("wezterm", "wezterm-gui", "WezTerm"),
    ("xterm", "xterm", "XTerm"),
    ("foot", "foot", "Foot"),
    ("tilix", "tilix", "Tilix"),
];

#[cfg(target_os = "windows")]
const TERMINALS: &[(&str, &str, &str)] = &[];

#[tauri::command]
fn detect_terminals() -> Vec<TerminalInfo> {
    #[cfg(target_os = "macos")]
    let pgrep_flags: &[&str] = &["-ix"];
    #[cfg(not(target_os = "macos"))]
    let pgrep_flags: &[&str] = &["-x"];

    TERMINALS
        .iter()
        .map(|(id, process, name)| {
            let mut args: Vec<&str> = pgrep_flags.to_vec();
            args.push(process);
            let running = std::process::Command::new("pgrep")
                .args(&args)
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false);

            TerminalInfo {
                id: id.to_string(),
                name: name.to_string(),
                running,
            }
        })
        .collect()
}

#[cfg(target_os = "macos")]
fn activate_target_app(app_name: &str) -> Result<(), String> {
    use objc::runtime::{Class, Object, BOOL, YES};

    unsafe {
        let ns_workspace_class = Class::get("NSWorkspace")
            .ok_or_else(|| "Failed to get NSWorkspace class".to_string())?;
        let shared_workspace: *mut Object = msg_send![ns_workspace_class, sharedWorkspace];
        if shared_workspace.is_null() {
            return Err("Failed to get shared NSWorkspace".to_string());
        }

        let running_apps: *mut Object = msg_send![shared_workspace, runningApplications];
        if running_apps.is_null() {
            return Err("Failed to get running applications".to_string());
        }

        let count: usize = msg_send![running_apps, count];

        for i in 0..count {
            let app: *mut Object = msg_send![running_apps, objectAtIndex: i];
            if app.is_null() {
                continue;
            }

            let localized_name: *mut Object = msg_send![app, localizedName];
            if localized_name.is_null() {
                continue;
            }

            let utf8_ptr: *const std::os::raw::c_char = msg_send![localized_name, UTF8String];
            if utf8_ptr.is_null() {
                continue;
            }
            let name = std::ffi::CStr::from_ptr(utf8_ptr)
                .to_str()
                .unwrap_or("");

            if name == app_name {
                // NSApplicationActivateIgnoringOtherApps = 1 << 1 = 2
                let options: usize = 1 << 1;
                let _: BOOL = msg_send![app, activateWithOptions: options];

                // Wait for the app to become frontmost (up to 2s)
                for attempt in 0..40 {
                    std::thread::sleep(std::time::Duration::from_millis(50));
                    let is_active: BOOL = msg_send![app, isActive];
                    if is_active == YES {
                        break;
                    }
                }

                // Extra settle time for the app to be ready for input
                std::thread::sleep(std::time::Duration::from_millis(100));
                return Ok(());
            }
        }

        Err(format!("Application '{}' not found among running apps", app_name))
    }
}

#[cfg(target_os = "macos")]
fn post_key_event(
    virtual_key: core_graphics::event::CGKeyCode,
    key_down: bool,
    flags: core_graphics::event::CGEventFlags,
) -> Result<(), String> {
    use core_graphics::event::{CGEvent, CGEventTapLocation};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
        .map_err(|()| "Failed to create CGEventSource".to_string())?;

    let event = CGEvent::new_keyboard_event(source, virtual_key, key_down)
        .map_err(|()| format!("Failed to create keyboard event (key={:#x}, down={})", virtual_key, key_down))?;

    event.set_flags(flags);
    event.post(CGEventTapLocation::HID);
    Ok(())
}

#[tauri::command]
fn send_to_terminal(terminal: String, auto_submit: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use core_graphics::event::{CGEventFlags, KeyCode};

        const KEY_V: u16 = 0x09;

        let (_, _, app_name) = TERMINALS
            .iter()
            .find(|(id, _, _)| *id == terminal)
            .ok_or_else(|| format!("Unknown terminal '{}'", terminal))?;
        activate_target_app(app_name)?;

        post_key_event(KEY_V, true, CGEventFlags::CGEventFlagCommand)?;
        post_key_event(KEY_V, false, CGEventFlags::CGEventFlagCommand)?;

        if auto_submit {
            std::thread::sleep(std::time::Duration::from_millis(100));
            post_key_event(KeyCode::RETURN, true, CGEventFlags::CGEventFlagNull)?;
            post_key_event(KeyCode::RETURN, false, CGEventFlags::CGEventFlagNull)?;
        }

        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        let session_type = std::env::var("XDG_SESSION_TYPE").unwrap_or_default();

        if session_type == "wayland" {
            // On Wayland, use wtype for key simulation
            let has_wtype = std::process::Command::new("which")
                .arg("wtype")
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);

            if !has_wtype {
                return Err("Send to terminal on Wayland requires 'wtype'. Install it with: sudo apt install wtype".to_string());
            }

            // Small delay to let the user's terminal regain focus after our window hides
            std::thread::sleep(std::time::Duration::from_millis(300));

            // Simulate Ctrl+V paste via wtype
            std::process::Command::new("wtype")
                .args(["-M", "ctrl", "-P", "v", "-p", "v", "-m", "ctrl"])
                .output()
                .map_err(|e| format!("Failed to simulate paste: {}", e))?;

            if auto_submit {
                std::thread::sleep(std::time::Duration::from_millis(100));
                std::process::Command::new("wtype")
                    .args(["-P", "Return", "-p", "Return"])
                    .output()
                    .map_err(|e| format!("Failed to simulate Enter: {}", e))?;
            }
        } else {
            // On X11, use xdotool for window activation and key simulation
            let has_xdotool = std::process::Command::new("which")
                .arg("xdotool")
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false);

            if !has_xdotool {
                return Err("Send to terminal requires 'xdotool'. Install it with: sudo apt install xdotool".to_string());
            }

            // Activate the terminal window (window class matching is case-insensitive)
            let activate = std::process::Command::new("xdotool")
                .args(["search", "--class", &terminal, "windowactivate"])
                .output()
                .map_err(|e| format!("Failed to run xdotool: {}", e))?;

            if !activate.status.success() {
                return Err(format!("Could not find window for '{}'. Is it running?", terminal));
            }

            std::thread::sleep(std::time::Duration::from_millis(200));

            // Simulate Ctrl+V paste
            std::process::Command::new("xdotool")
                .args(["key", "ctrl+v"])
                .output()
                .map_err(|e| format!("Failed to simulate paste: {}", e))?;

            if auto_submit {
                std::thread::sleep(std::time::Duration::from_millis(100));
                std::process::Command::new("xdotool")
                    .args(["key", "Return"])
                    .output()
                    .map_err(|e| format!("Failed to simulate Enter: {}", e))?;
            }
        }

        Ok(())
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        Err("send_to_terminal is not supported on this platform".to_string())
    }
}
