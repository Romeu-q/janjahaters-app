package app.janjahaters;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

// Serviço em primeiro plano enquanto você está na call: o Android deixa o microfone e o som
// funcionando com a tela desligada e mostra a notificação "Na call".
public class CallService extends Service {
    static final String CHANNEL = "call";
    static final int ID = 47610;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null && intent.getStringExtra("title") != null ? intent.getStringExtra("title") : "Na call";
        String text = intent != null && intent.getStringExtra("text") != null ? intent.getStringExtra("text") : "janjahaters";

        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Call em andamento", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build();

        // Tipos do serviço: mídia sempre; microfone e câmera só com a permissão dada (senão o Android
        // recusa e o app fechava). Câmera ligada = o Android deixa a câmera funcionando em segundo plano.
        boolean cam = intent != null && intent.getBooleanExtra("camera", false);
        int type = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            type = ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK;
            if (granted(android.Manifest.permission.RECORD_AUDIO)) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            if (cam && granted(android.Manifest.permission.CAMERA)) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
        }
        int[] attempts = { type, Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0 };
        for (int t : attempts) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceCompat.startForeground(this, ID, n, t);
                else startForeground(ID, n);
                return START_NOT_STICKY;
            } catch (Exception e) {
                // tenta o próximo (só mídia); nunca deixa a exceção derrubar o app
            }
        }
        stopSelf();
        return START_NOT_STICKY;
    }

    private boolean granted(String perm) {
        return checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // fechou o app pela lista de recentes: sai da call
        stopSelf();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
