from pathlib import Path
import re
p=Path('js/game.js')
s=p.read_text()
old="function drawItem(){const it=state.itemDeck.pop();if(!it)return null;return {...it};}"
new="""const LATE_ITEM_TILE_THRESHOLD=20;
const LATE_DRAW_ITEMS=new Set(['Ice Staff','Large Steel Axe']);
function laidDungeonTileCount(){
 return Object.values(state?.tiles||{}).filter(tile=>tile&&tile.kind!=='start').length;
}
function drawItem(){
 if(!state?.itemDeck?.length)return null;
 let index=state.itemDeck.length-1;
 if(laidDungeonTileCount()<LATE_ITEM_TILE_THRESHOLD){
  while(index>=0&&LATE_DRAW_ITEMS.has(state.itemDeck[index]?.name))index--;
  if(index<0)return null;
 }
 const [it]=state.itemDeck.splice(index,1);
 return it?{...it}:null;
}"""
if old not in s:
    raise SystemExit('drawItem source not found')
p.write_text(s.replace(old,new,1))
h=Path('index.html')
t=h.read_text()
t=re.sub(r'data-build-version="v[0-9.]+"','data-build-version="v13.33"',t,count=1)
h.write_text(t)
