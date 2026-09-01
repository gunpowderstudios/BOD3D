// BOD3D v12.60 — refreshed rotatable EXIT corridor artwork
window.ASSET_PATHS={
 "Start":"assets/tiles/start.png","Exit":"assets/tiles/exit.png?v=12.60","Straight":"assets/tiles/straight.png","Corner":"assets/tiles/corner.png","T-Junction":"assets/tiles/tjunction.png","Crossroad":"assets/tiles/crossroad.png","Spike Trap":"assets/tiles/spiketrap.png","Healing Pool":"assets/tiles/healingpool.png","Hidden Monster":"assets/ui/hiddenmonster.png","Ring":"assets/ui/ring.png","Firkin":"assets/companions/firkin.png",
 "Sirrus the Fighter":"assets/heroes/sirrus.png","Tamara the Fighter":"assets/heroes/tamara.png","Duric the Dwarf":"assets/heroes/duric.png","Marria the Dwarf":"assets/heroes/marria.png","Rill the Healer":"assets/heroes/rill.png","Tarak the Healer":"assets/heroes/tarak.png","Alendra the Elf":"assets/heroes/alendra.png","Galhorn the Elf":"assets/heroes/galhorn.png",
 "Goblin":"assets/monsters/goblin.png","Zombie":"assets/monsters/zombie.png","Mummy":"assets/monsters/mummy.png","Monk":"assets/monsters/monk.png","Mud Monster":"assets/monsters/mudmonster.png","Werewolf":"assets/monsters/werewolf.png","Troll":"assets/monsters/troll.png","Minotaur":"assets/monsters/minotaur.png","Skeleton":"assets/monsters/skeleton.png","Giant Snake":"assets/monsters/giantsnake.png","Reacher":"assets/monsters/reacher.png","Mirror Monster":"assets/monsters/mirrormonster.png","Dragon":"assets/monsters/dragon.png"
};

// Item wording overrides applied once the core item list has loaded.
(function(){
 let tries=0;
 const timer=setInterval(()=>{
  tries++;
  try{
   const skull=ITEM_MASTER.find(item=>item.name==="Sorcerer's Skull");
   if(skull){
    skull.desc='1 use: Deal 1 die of damage to the monster on your tile.';
    clearInterval(timer);
   }
  }catch(error){}
  if(tries>200)clearInterval(timer);
 },25);
})();
