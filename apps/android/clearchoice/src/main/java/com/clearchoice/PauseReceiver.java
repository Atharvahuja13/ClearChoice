package com.clearchoice;
import android.content.*;import android.app.*;import android.os.Build;
public class PauseReceiver extends BroadcastReceiver {
 public static final String ACTION="com.clearchoice.PAUSE_TOGGLE";
 @Override public void onReceive(Context c,Intent in){boolean value=Engine.paused(c);boolean next=!value;c.getSharedPreferences("cc",0).edit().putBoolean("paused",next).apply();Engine.log(c,next?"Overlay paused from notification.":"Overlay resumed from notification.");Intent refresh=new Intent("com.clearchoice.PAUSE_CHANGED");refresh.setPackage(c.getPackageName());c.sendBroadcast(refresh);if(Build.VERSION.SDK_INT>=26){NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(nm!=null){}}}
}
