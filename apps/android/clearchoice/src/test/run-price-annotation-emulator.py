import os,subprocess,time
adb=os.path.expanduser('~/Library/Android/sdk/platform-tools/adb');env=dict(os.environ,ADB_MDNS='0')
def run(*a):return subprocess.run([adb,'-s','emulator-5554',*a],env=env,check=True,stdout=subprocess.PIPE,text=True)
try:
 run('install','-r','apps/android/ClearChoice-debug.apk');run('install','-r','apps/android/clearchoice/PriceAnnotation-test.apk')
 with open('docs/qa/price-annotation-instrumentation.log','w') as out:
  proc=subprocess.Popen([adb,'-s','emulator-5554','shell','am','instrument','-w','com.clearchoice.test/com.clearchoice.PriceAnnotationInstrumentation'],env=env,stdout=out,stderr=subprocess.STDOUT)
  time.sleep(2);run('shell','settings','delete','secure','enabled_accessibility_services');run('shell','settings','put','secure','enabled_accessibility_services','com.clearchoice/com.clearchoice.ClearChoiceService');run('shell','settings','put','secure','accessibility_enabled','1');proc.wait(timeout=60)
finally:
 run('shell','settings','delete','secure','enabled_accessibility_services');run('shell','settings','put','secure','accessibility_enabled','0')
with open('docs/qa/price-annotation-instrumentation.log') as result:
 report=result.read()
print(report)
if 'INSTRUMENTATION_CODE: 0' not in report:
 raise SystemExit('Price annotation instrumentation failed; see raw report above.')
