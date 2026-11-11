import SafariServices
import os.log

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let response = NSExtensionItem()
        let defaults = UserDefaults(suiteName: "group.com.clearchoice.shared")
        let paused = defaults?.bool(forKey: "paused") ?? false
        let info = NSExtensionItem()
        info.userInfo = ["active": !paused, "message": "ClearChoice Safari module is ready. Website access remains user controlled."]
        context.completeRequest(returningItems: [info])
    }
}
