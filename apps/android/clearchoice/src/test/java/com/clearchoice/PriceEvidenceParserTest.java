package com.clearchoice;
import java.util.*;
public final class PriceEvidenceParserTest {
 static int passed;static PriceEvidenceParser.Result parse(String... s){List<PriceEvidenceParser.Line> lines=new ArrayList<>();for(int i=0;i<s.length;i++)lines.add(new PriceEvidenceParser.Line("n"+i,s[i],10,10+i*30,180,35+i*30));return PriceEvidenceParser.parse(lines);}static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);passed++;}
 public static void main(String[] args){PriceEvidenceParser.Result r=parse("Subtotal SGD 10.00");check(r!=null&&!r.complete&&r.detail.contains("Delivery not available"),"Unknown delivery must stay incomplete");
 check(parse("Subtotal SGD 10.00","Delivery USD 3.00")==null,"Mixed currencies rejected");
 check(parse("Product price SGD 10.00","Other card SGD 9.00")==null,"Unrelated product prices rejected");
 r=parse("Subtotal SGD 10.00","Delivery SGD 3.00","Total SGD 13.00 including delivery and all mandatory fees");check(r!=null&&r.complete&&r.amount.toPlainString().equals("13.00"),"Inclusive total used once without adding shipping again");
 check(parse("Item price SGD 10.00","Qty: 2","Delivery SGD 3.00")==null,"Unit price cannot represent multiple quantity");
 r=parse("Subtotal SGD 10.00","Delivery: Free over SGD 50.00");check(r!=null&&!r.complete&&r.amount.toPlainString().equals("10.00")&&r.detail.contains("Delivery not available"),"Conditional free delivery not assumed eligible");
 r=parse("Subtotal SGD 10.00","Delivery SGD 3.00","Taxes and all mandatory fees included");check(r!=null&&r.complete&&r.amount.toPlainString().equals("13.00"),"Only explicitly accounted components yield total");
 r=parse("Subtotal SGD 10.00","Delivery SGD 3.00","Mandatory fees: calculated later");check(r!=null&&!r.complete&&r.amount.toPlainString().equals("13.00"),"Unknown mandatory fee never becomes final");
 check(parse("Item price SGD 10.00 - 20.00")==null,"Price ranges rejected");
 check(parse("Item price SGD 10.00","Select variant")==null,"Unselected variant rejected");
 PriceEvidenceParser.Current current=new PriceEvidenceParser.Current();current.update("a",r);check(current.get("a")==r&&current.get("b")==null&&current.get("a")==null,"Stale revision clears annotation and cannot resurrect");
 check(parse("Subtotal SGD 10.00","Delivery SGD 3.00","Mandatory fee SGD 1.00","Service fee SGD 1.00")==null,"Aggregate and component fee overlap rejected");
 check(parse("Item price SGD 10.00","Quantity: 999999999999999999999999999999999999")==null,"Overflow quantity rejected without exception");
 r=parse("Subtotal SGD 10.00","Delivery SGD 3.00","Taxes and all mandatory fees included","Service fee calculated at checkout");check(r!=null&&!r.complete,"Unresolved fee overrides inclusion sentinel");
 check(parse("Total SGD 13.00 including delivery and all mandatory fees","Delivery calculated at checkout")==null,"Contradicting unknown delivery rejects inclusive total");
 check(parse("Total SGD 13.00 including delivery and all mandatory fees","Delivery: Free over SGD 50.00")==null,"Conditional delivery rejects inclusive total");
 check(parse("Total SGD 13.00 including delivery and all mandatory fees","Service fee calculated at checkout")==null,"Unknown fee rejects inclusive total");
 System.out.println(passed+" price evidence tests passed");}
}
