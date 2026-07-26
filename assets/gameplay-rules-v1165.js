// BOD3D-TEST v11.84 — 20-tile rules and immediate Ring HUD refresh
(function () {
  'use strict';

  function install() {
    if (window.__bodGameplayRulesV1165Installed) return true;
    if (
      typeof drawItem !== 'function' ||
      typeof placeExitAndRing !== 'function' ||
      typeof collectRingIfSafe !== 'function' ||
      typeof rangedKill !== 'function' ||
      typeof killMonster !== 'function'
    ) return false;

    window.__bodGameplayRulesV1165Installed = true;

    const LOCKED_ITEMS = new Set(['Ice Staff', 'Large Steel Axe']);

    function laidTileCount() {
      if (!state?.tiles) return 0;
      return Object.values(state.tiles).filter(tile =>
        tile && tile.kind !== 'start' && tile.kind !== 'exit'
      ).length;
    }

    const originalDrawItem = drawItem;
    drawItem = function () {
      if (laidTileCount() >= 20) {
        return originalDrawItem.apply(this, arguments);
      }
      if (!state?.itemDeck?.length) return null;

      // Preserve the locked cards in the deck. Draw the next eligible card only.
      for (let index = state.itemDeck.length - 1; index >= 0; index--) {
        const candidate = state.itemDeck[index];
        if (candidate && !LOCKED_ITEMS.has(candidate.name)) {
          const item = state.itemDeck.splice(index, 1)[0];
          return item ? { ...item } : null;
        }
      }
      return null;
    };

    function ringAlreadyAssigned() {
      return Boolean(
        state && (
          state.player?.hasRing ||
          state.ringCarrierAssigned ||
          Object.values(state.tiles || {}).some(tile =>
            tile?.hasRing || tile?.monster?.carriesRing
          )
        )
      );
    }

    function qualifyingGuardians() {
      return Object.entries(state?.tiles || {}).filter(([, tile]) => {
        const monster = tile?.monster;
        return monster &&
          monster.health > 0 &&
          !monster.isDragon &&
          Number(monster.maxHealth) >= 10;
      });
    }

    function assignRingGuardian() {
      if (!state || laidTileCount() < 20 || ringAlreadyAssigned()) return false;
      const candidates = qualifyingGuardians();
      if (!candidates.length) return false;

      const [tileKey, tile] = candidates[Math.floor(Math.random() * candidates.length)];
      tile.monster.carriesRing = true;
      state.ringCarrierAssigned = true;
      state.ringActivated = true;
      state.ringKey = tileKey;
      state.ringNumber = null;
      state.ringRoll = null;
      if (typeof log === 'function') {
        log('A powerful monster somewhere in the dungeon now carries the Ring of Creation.', 'loot');
      }
      return true;
    }

    // The Exit still appears normally, but it no longer rolls or places the Ring.
    placeExitAndRing = function (x, y, from) {
      state.exitPlaced = true;
      let exitKey = null;
      let placed = false;

      for (const dir of dirOrder) {
        const delta = DIRS[dir];
        const exitX = x + delta.dx;
        const exitY = y + delta.dy;
        if (from.opens[dir] && !getTile(exitX, exitY)) {
          exitKey = key(exitX, exitY);
          state.tiles[exitKey] = {
            kind: 'exit',
            opens: { ...TILE_BASE.exit },
            rot: 0,
            visited: false,
            monster: {
              name: 'Red Dragon',
              dice: 4,
              mod: 0,
              maxHealth: 20,
              health: 20,
              glyph: '🐉',
              revealed: true,
              isDragon: true
            }
          };
          placed = true;
          break;
        }
      }

      if (!placed) {
        for (const dir of dirOrder) {
          const delta = DIRS[dir];
          const exitX = x + delta.dx;
          const exitY = y + delta.dy;
          if (!getTile(exitX, exitY)) {
            exitKey = key(exitX, exitY);
            state.tiles[exitKey] = {
              kind: 'exit',
              opens: { ...TILE_BASE.exit },
              rot: 0,
              visited: false,
              monster: {
                name: 'Red Dragon',
                dice: 4,
                mod: 0,
                maxHealth: 20,
                health: 20,
                glyph: '🐉',
                revealed: true,
                isDragon: true
              }
            };
            break;
          }
        }
      }

      playSound('dragon');
      playTileEffect(exitKey, 'dragon', 1400);
      log('The final dungeon tile is laid. The Exit appears and the Red Dragon guards it.', 'loot');
      assignRingGuardian();
    };

    collectRingIfSafe = function (tileKey) {
      if (
        !state.ringActivated ||
        state.player.hasRing ||
        state.ringKey !== tileKey ||
        key(state.player.x, state.player.y) !== tileKey
      ) return false;

      const tile = state.tiles[tileKey];
      if (
        !tile ||
        !tile.hasRing ||
        tile.monsterPending ||
        (tile.monster && tile.monster.health > 0)
      ) return false;

      tile.hasRing = false;
      state.player.hasRing = true;
      render();
      playSound('ring');
      playTileEffect(tileKey, 'ring', 1200);
      log('You found the Ring of Creation — now get out!', 'loot');
      showModal(
        'THE RING OF CREATION',
        'You found the Ring of Creation — now get out!',
        [{ text: 'Get Out!', cls: 'green', fn: closeModal }]
      );
      return true;
    };

    const originalRangedKill = rangedKill;
    rangedKill = function (tile, tileKey, monster) {
      const carriesRing = Boolean(monster?.carriesRing);
      if (carriesRing) {
        // Prevent the original ranged-kill routine awarding normal loot or
        // collecting the Ring remotely. The Ring remains on the guardian tile.
        tile.hasRing = true;
        state.ringActivated = true;
        state.ringCarrierAssigned = true;
        state.ringKey = tileKey;
        monster.isDragon = true;
      }

      const result = originalRangedKill.apply(this, arguments);

      if (carriesRing) {
        monster.isDragon = false;
        log(monster.name + ' drops the Ring of Creation!', 'loot');
        render();
      }
      return result;
    };

    killMonster = function () {
      const monster = combat.tile.monster;
      const tile = combat.tile;
      const tileKey = combat.sourceKey || key(state.player.x, state.player.y);
      const carriesRing = Boolean(monster.carriesRing);

      playSound('monsterDie');
      playTileEffect(tileKey, 'monsterDeath', 1000);
      log('Defeated ' + monster.name + '.', 'combat');
      state.player.killed.push(monster.name);
      state.monsterDiscard.push(monster);
      recordMonsterCorpse(tile, tileKey, monster);
      tile.monster = null;

      if (carriesRing) {
        tile.hasRing = true;
        state.ringActivated = true;
        state.ringCarrierAssigned = true;
        state.ringKey = tileKey;
        log(monster.name + ' drops the Ring of Creation!', 'loot');
      }

      if (monster.isDragon && state.player.hasRing) {
        win();
        return;
      }

      // The Ring replaces the guardian's ordinary item reward.
      const rewardCount = (!monster.isDragon && !carriesRing)
        ? (monster.maxHealth >= 10 ? 2 : (monster.maxHealth >= 6 ? 1 : 0))
        : 0;

      if (!monster.isDragon && !carriesRing && !rewardCount) {
        log(monster.name + ' had ' + monster.maxHealth + ' starting Health: no item reward.', 'system');
      }
      if (rewardCount) {
        log(
          monster.name + ' had ' + monster.maxHealth + ' starting Health: draw ' +
          rewardCount + ' item' + (rewardCount === 1 ? '' : 's') + '.',
          'loot'
        );
      }

      closeCombat();
      render();

      if (carriesRing) {
        setTimeout(() => collectRingIfSafe(tileKey), 80);
      } else if (rewardCount) {
        setTimeout(() => {
          if (typeof queueMonsterRewards === 'function') {
            queueMonsterRewards(rewardCount);
          } else {
            for (let index = 0; index < rewardCount; index++) awardItem();
          }
        }, 120);
      }
    };

    // Assign as soon as tile 20 exists and a qualifying living guardian is present.
    assignRingGuardian();
    setInterval(assignRingGuardian, 250);
    return true;
  }

  function start() {
    if (install()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (install() || ++attempts > 240) clearInterval(timer);
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
