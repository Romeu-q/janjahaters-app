package app.janjahaters;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CallServicePlugin.class);
        super.onCreate(savedInstanceState);
        // música e voz dos amigos tocam sem precisar tocar na tela antes
        WebView web = getBridge().getWebView();
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
    }

    // Ao sair do app (tela desligada, outro app aberto) a página continua rodando:
    // a call, a música e o chat não param. O serviço "Na call" impede o Android de fechar o app.
    @Override
    public void onPause() {
        super.onPause();
        WebView web = getBridge() != null ? getBridge().getWebView() : null;
        if (web != null) {
            web.onResume();
            web.resumeTimers();
        }
    }
}
