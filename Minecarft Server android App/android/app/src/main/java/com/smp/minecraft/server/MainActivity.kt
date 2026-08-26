package com.smp.minecraft.server

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false

        // Enable standard WebChromeClient for alert(), confirm(), prompt() dialogs
        webView.webChromeClient = WebChromeClient()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("file://") || url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
                    return false
                }
                // Handle external links safely via system browser
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }
        }

        // Request notification permissions on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        // Expose Native Android Bridge API to JavaScript UI
        webView.addJavascriptInterface(AndroidServerBridge(this), "AndroidBridge")

        // Load bundled Web Application UI
        webView.loadUrl("file:///android_asset/index.html")
    }

    inner class AndroidServerBridge(private val context: Context) {

        private val mainHandler = Handler(Looper.getMainLooper())

        @JavascriptInterface
        fun getLocalIpAddress(): String {
            try {
                val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
                for (intf in interfaces) {
                    val addrs = Collections.list(intf.inetAddresses)
                    for (addr in addrs) {
                        if (!addr.isLoopbackAddress && addr is Inet4Address) {
                            return addr.hostAddress ?: ""
                        }
                    }
                }
            } catch (e: Exception) {
                // Fallback
            }
            return ""
        }

        @JavascriptInterface
        fun getDeviceInfo(): String {
            val totalMem = Runtime.getRuntime().totalMemory() / (1024 * 1024)
            val freeMem = Runtime.getRuntime().freeMemory() / (1024 * 1024)
            val json = JSONObject()
            json.put("platform", "Android")
            json.put("osVersion", Build.VERSION.RELEASE)
            json.put("totalMemMB", totalMem)
            json.put("freeMemMB", freeMem)
            json.put("defaultServerName", "SMP")
            json.put("defaultPath", context.filesDir.absolutePath + "/minecraft_servers/SMP")
            return json.toString()
        }

        @JavascriptInterface
        fun startServerService(serverConfigJson: String) {
            try {
                val intent = Intent(context, ServerEngineService::class.java).apply {
                    putExtra("config", serverConfigJson)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        ContextCompat.startForegroundService(context, intent)
                    } catch (e: Exception) {
                        try {
                            context.startService(intent)
                        } catch (err: Exception) {
                            err.printStackTrace()
                        }
                    }
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            mainHandler.post {
                try {
                    Toast.makeText(context.applicationContext, "Minecraft SMP Server Started!", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun stopServerService() {
            try {
                val intent = Intent(context, ServerEngineService::class.java)
                context.stopService(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            mainHandler.post {
                try {
                    Toast.makeText(context.applicationContext, "Minecraft SMP Server Stopped.", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun showToast(msg: String) {
            mainHandler.post {
                try {
                    Toast.makeText(context.applicationContext, msg, Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun requestPlayitClaim(): String {
            try {
                val randCode = "smp-" + (100000..999999).random()
                val json = JSONObject()
                json.put("code", randCode)
                json.put("claimUrl", "https://playit.gg/claim?code=$randCode")
                json.put("tunnelDomain", "$randCode.joinmc.link")
                json.put("status", "READY")
                return json.toString()
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return "{}"
        }

        @JavascriptInterface
        fun openUrlInBrowser(url: String) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
