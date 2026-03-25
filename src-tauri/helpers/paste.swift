import Cocoa
import CoreGraphics

// Usage: paste <app_name> [--enter]
let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("Usage: paste <app_name> [--enter]\n", stderr)
    exit(1)
}

let appName = args[1]
let shouldEnter = args.count >= 3 && args[2] == "--enter"

// Find and activate the target app
let workspace = NSWorkspace.shared
var targetApp: NSRunningApplication? = nil
for app in workspace.runningApplications {
    if app.localizedName == appName {
        targetApp = app
        break
    }
}

guard let app = targetApp else {
    fputs("Error: App '\(appName)' not found\n", stderr)
    exit(1)
}

app.activate()

// Wait for app to become frontmost (up to 1s)
for _ in 0..<20 {
    usleep(50_000)
    if app.isActive {
        break
    }
}
usleep(100_000)

// Cmd+V paste
let keyDown = CGEvent(keyboardEventSource: nil, virtualKey: 9, keyDown: true)!
keyDown.flags = .maskCommand
keyDown.post(tap: .cghidEventTap)
let keyUp = CGEvent(keyboardEventSource: nil, virtualKey: 9, keyDown: false)!
keyUp.flags = .maskCommand
keyUp.post(tap: .cghidEventTap)

// Optional Enter
if shouldEnter {
    usleep(100_000)
    let enterDown = CGEvent(keyboardEventSource: nil, virtualKey: 0x24, keyDown: true)!
    enterDown.post(tap: .cghidEventTap)
    let enterUp = CGEvent(keyboardEventSource: nil, virtualKey: 0x24, keyDown: false)!
    enterUp.post(tap: .cghidEventTap)
}
