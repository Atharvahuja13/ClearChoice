package com.clearchoice;
import android.view.accessibility.AccessibilityNodeInfo;
/** Inspect flags only. No entered text is read to decide whether a window is safe. */
public final class InputSafety {
 public static boolean containsInput(AccessibilityNodeInfo n){return scan(n,0);}
 static boolean scan(AccessibilityNodeInfo n,int depth){if(n==null)return false;if(depth>40)return true;if(n.isPassword()||n.isEditable())return true;for(int i=0;i<n.getChildCount();i++)if(scan(n.getChild(i),depth+1))return true;return false;}
 private InputSafety(){}
}
