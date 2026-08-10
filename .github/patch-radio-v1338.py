from pathlib import Path
import re
p=Path('js/audio.js')
s=p.read_text()
s=s.replace("file:'./assets/radio/01-rock-track1.mp3'","file:'./assets/radio/01-welcome-to-the-dungeon.mp3'",1)
s=s.replace("title:'Rock Track 1'","title:'Welcome to the Dungeon'",1)
p.write_text(s)
h=Path('index.html')
t=h.read_text()
t=re.sub(r'data-build-version="v[0-9.]+"','data-build-version="v13.38"',t,count=1)
t=re.sub(r'js/audio\.js\?cache=[^"\']+','js/audio.js?cache=20260810-v1338',t,count=1)
h.write_text(t)
