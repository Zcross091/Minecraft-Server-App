package com.smp.minecraft.server

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ServerEngineService : Service() {

    private val CHANNEL_ID = "SMP_MINECRAFT_SERVICE_CHANNEL"
    private val NOTIFICATION_ID = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForegroundSafely()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForegroundSafely()
        return START_STICKY
    }

    private fun startForegroundSafely() {
        try {
            val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SMP Crossplay Server")
                .setContentText("Minecraft Java & Bedrock Server is running in background...")
                .setSmallIcon(android.R.drawable.stat_sys_upload)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val serviceChannel = NotificationChannel(
                    CHANNEL_ID,
                    "SMP Server Background Engine",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Keeps the Minecraft Crossplay server active in the background"
                }
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                manager?.createNotificationChannel(serviceChannel)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
