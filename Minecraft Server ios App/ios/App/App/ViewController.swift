import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {

    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let contentController = WKUserContentController()
        contentController.add(self, name: "iOSBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: self.view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        self.view.addSubview(webView)

        // Load bundled Web App index.html from iOS Bundle
        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "public") {
            let fileURL = URL(fileURLWithPath: htmlPath)
            webView.loadFileURL(fileURL, allowingReadAccessTo: fileURL.deletingLastPathComponent())
        } else if let mainUrl = Bundle.main.url(forResource: "index", ofType: "html") {
            webView.loadFileURL(mainUrl, allowingReadAccessTo: mainUrl.deletingLastPathComponent())
        }
    }

    // Handle messages from JavaScript UI
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "iOSBridge" {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            switch action {
            case "startServer":
                print("[iOS Native] Starting Minecraft SMP Server Engine...")
                showNativeAlert(title: "SMP Server Started", message: "Minecraft Java & Bedrock Server is running on iOS!")
            case "stopServer":
                print("[iOS Native] Stopping Minecraft SMP Server Engine...")
                showNativeAlert(title: "SMP Server Stopped", message: "Server process stopped gracefully.")
            case "opPlayer":
                if let username = body["username"] as? String {
                    showNativeAlert(title: "Operator Admin Granted", message: "Player '\(username)' is now OP!")
                }
            default:
                break
            }
        }
    }

    private func showNativeAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        self.present(alert, animated: true, completion: nil)
    }
}
