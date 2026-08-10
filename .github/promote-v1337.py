from pathlib import Path
import re, urllib.request
Path('js/scene3d.js').write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/gunpowderstudios/BOD3D-TEST/main/js/scene3d.js').read())
h=Path('index.html')
t=h.read_text()
t=re.sub(r'data-build-version="v[0-9.]+"','data-build-version="v13.37"',t,count=1)
t=re.sub(r'js/scene3d\.js\?cache=[^"\']+','js/scene3d.js?cache=20260810-v1337',t,count=1)
h.write_text(t)
