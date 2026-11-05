package app.janjahaters;

import android.os.Build;
import android.os.Bundle;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CallServicePlugin.class);
        super.onCreate(savedInstanceState);
        // música e voz dos amigos tocam sem precisar tocar na tela antes
        WebView web = getBridge().getWebView();
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        // O Android mata o processo da página para liberar memória quando o app está em segundo plano.
        // Sem tratar isso o sistema fecha o app inteiro: aqui a página fica com prioridade alta e,
        // se mesmo assim for morta, o app reabre a tela sozinho em vez de fechar.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                runOnUiThread(MainActivity.this::recreate);
                return true;
            }
        });
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
