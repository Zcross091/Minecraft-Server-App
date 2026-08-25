package com.smp.minecraft.server

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.io.File

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

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
            }
        }

        // Expose Native Android Bridge API to JavaScript UI
        webView.addJavascriptInterface(AndroidServerBridge(this), "AndroidBridge")

        // Load bundled Web Application UI
        webView.loadUrl("file:///android_asset/index.html")
    }

    inner class AndroidServerBridge(private val context: Context) {

        @JavascriptInterface
        fun getDeviceInfo(): String {

            val totalMem = Runtime.getRuntime().totalMemory() / (1024 * 1024)
            val freeMem = Runtime.getRuntime().freeMemory() / (1024 * 1024)
            val json = JSONObject()
            json.put("platform", "Android")
            json.put("osVersion", android.os.Build.VERSION.RELEASE)
            json.put("totalMemMB", totalMem)
            json.put("freeMemMB", freeMem)
            json.put("defaultServerName", "SMP")
            json.put("defaultPath", context.filesDir.absolutePath + "/minecraft_servers/SMP")
            return json.toString()
        }

        @JavascriptInterface
        fun startServerService(serverConfigJson: String) {
            val intent = Intent(context, ServerEngineService::class.java)
            intent.putExtra("config", serverConfigJson)
            context.startService(intent)
            Toast.makeText(context, "Minecraft SMP Server Started!", Toast.LENGTH_SHORT).show()
        }

        @JavascriptInterface
        fun stopServerService() {
            val intent = Intent(context, ServerEngineService::class.java)
            context.stopService(intent)
            Toast.makeText(context, "Minecraft SMP Server Stopped.", Toast.LENGTH_SHORT).show()
        }

        @JavascriptInterface
        fun showToast(msg: String) {
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
        }
    }
}
