package com.clearchoice;
import android.content.*;
/** Recognized retailer identities. No retailer source adapter is verified yet. */
public final class RetailApps {
 public static final String[] PACKAGES={"com.shopee.sg","com.lazada.android"};public static final String[] NAMES={"Shopee Singapore","Lazada"};
 public static boolean known(String pkg){for(String p:PACKAGES)if(p.equals(pkg))return true;return false;}
 public static String name(String pkg){for(int i=0;i<PACKAGES.length;i++)if(PACKAGES[i].equals(pkg))return NAMES[i];return pkg;}
 public static boolean installed(Context c,String pkg){try{c.getPackageManager().getPackageInfo(pkg,0);return true;}catch(android.content.pm.PackageManager.NameNotFoundException e){return false;}}
 public static boolean allowed(Context c,String pkg){return c.getSharedPreferences("cc",0).getBoolean("allow:"+pkg,false);}
 private RetailApps(){}
}
