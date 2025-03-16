package xyz.qingfengyueying.modelchat;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Make status bar transparent and ensure content doesn't overlap with system UI
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            
            // Set the content to appear behind the status bar
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
    }
}
