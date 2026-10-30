package app.janjahaters;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

// window.desk.callActive(true/false) no app chama isto (mobile/bridge.js)
@CapacitorPlugin(name = "CallService", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class CallServicePlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        // Android 13+: pede para mostrar a notificação "Na call" (sem ela o serviço roda escondido)
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "afterPermission");
            return;
        }
        launch(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void afterPermission(PluginCall call) {
        launch(call);
    }

    private void launch(PluginCall call) {
        Intent i = new Intent(getContext(), CallService.class);
        i.putExtra("title", call.getString("title", "Na call"));
        i.putExtra("text", call.getString("text", "janjahaters"));
        try {
            ContextCompat.startForegroundService(getContext(), i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), CallService.class));
        call.resolve();
    }
}
