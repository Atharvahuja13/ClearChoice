#!/usr/bin/env python3
import subprocess,os,time,json
from pathlib import Path
adb=str(Path.home()/'Library/Android/sdk/platform-tools/adb');base=Path(__file__).resolve().parent;started=time.time();runs=0;failure=None
with (base/'stress.log').open('w',buffering=1) as log:
 while time.time()-started<1800:
  subprocess.run([adb,'shell','pm','clear','com.demoshop'],capture_output=True,timeout=15)
  r=subprocess.run([adb,'shell','am','instrument','-w','com.demoshop.test/com.clearchoice.FlowInstrumentation'],capture_output=True,text=True,timeout=90)
  runs+=1;log.write(f'RUN {runs} elapsed={time.time()-started:.1f}s\n{r.stdout}\n{r.stderr}\n')
  if r.returncode or 'INSTRUMENTATION_CODE: 0' not in r.stdout or 'PASS core' not in r.stdout:failure='Instrumented flow failed';break
 result={'startedEpoch':started,'endedEpoch':time.time(),'elapsedSeconds':time.time()-started,'runs':runs,'failure':failure,'targetSeconds':1800}
 (base/'stress-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
