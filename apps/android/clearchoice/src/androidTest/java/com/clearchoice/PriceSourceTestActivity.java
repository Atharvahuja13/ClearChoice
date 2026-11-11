package com.clearchoice;
import android.app.*;import android.os.*;import android.widget.*;
/** Test-APK only, explicit component only, no LAUNCHER filter and no merchant branding. */
public final class PriceSourceTestActivity extends Activity {
 public void onCreate(Bundle b){super.onCreate(b);ScrollView scroll=new ScrollView(this);LinearLayout column=new LinearLayout(this);column.setOrientation(1);column.setPadding(30,100,30,30);TextView title=new TextView(this);title.setText("Internal source annotation QA");column.addView(title);Button price=new Button(this);price.setText("Subtotal SGD 10.00");price.setOnClickListener(v->price.setText("Subtotal SGD 11.00"));column.addView(price,new LinearLayout.LayoutParams(-1,110));TextView delivery=new TextView(this);delivery.setText("Delivery: Free");column.addView(delivery,new LinearLayout.LayoutParams(-1,70));for(int i=0;i<25;i++){TextView row=new TextView(this);row.setText("Internal scroll target "+i);column.addView(row,new LinearLayout.LayoutParams(-1,100));}scroll.addView(column);setContentView(scroll);}
}
