// BOD3D-TEST v11.94 — restored 20-tile Ring guardian and developer assignment
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
          !monster.guardsFirkin &&
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

    function firkinAlreadyPlacedOrRescued() {
      return Boolean(
        state && (
          state.player?.companionFirkin ||
          state.firkinRescued ||
          state.firkinGuardianAssigned ||
          Object.values(state.tiles || {}).some(tile =>
            tile?.hasFirkin || tile?.monster?.guardsFirkin
          )
        )
      );
    }

    function currentFirkinCandidate() {
      if (!combat?.tile?.monster) return null;

      const tile = combat.tile;
      const monster = tile.monster;
      const tileEntry = Object.entries(state?.tiles || {})
        .find(([, candidateTile]) => candidateTile === tile);
      const tileKey = tileEntry?.[0] || key(state.player.x, state.player.y);

      if (
        monster.health <= 0 ||
        !monster.revealed ||
        monster.isDragon ||
        monster.carriesRing ||
        monster.guardsFirkin ||
        monster.firkinChecked ||
        Number(monster.maxHealth) < 10
      ) return null;

      return [tileKey, tile];
    }

    function assignFirkinGuardian() {
      if (
        !state ||
        firkinAlreadyPlacedOrRescued() ||
        laidTileCount() < 15 ||
        Number(state.player?.killed?.length || 0) < 6
      ) return false;

      const candidate = currentFirkinCandidate();
      if (!candidate) return false;

      const [tileKey, tile] = candidate;
      const guaranteed = laidTileCount() >= 25;
      tile.monster.firkinChecked = true;
      if (!guaranteed && Math.random() >= 0.25) return false;

      tile.monster.guardsFirkin = true;
      state.firkinGuardianAssigned = true;
      state.firkinGuardianKey = tileKey;
      log('You hear whimpering nearby…!', 'loot');
      if (typeof toast === 'function') toast('You hear whimpering nearby…!');
      return true;
    }

    function placeFirkinOnTile(tile, tileKey, monsterName) {
      if (!tile || state.player?.companionFirkin) return false;
      tile.hasFirkin = true;
      state.firkinGuardianAssigned = true;
      state.firkinGuardianKey = tileKey;
      log('The defeated ' + monsterName + ' was guarding someone!', 'loot');
      return true;
    }

    function collectFirkinIfSafe(tileKey, afterWelcome) {
      if (!state || state.player?.companionFirkin || !tileKey) return false;
      if (key(state.player.x, state.player.y) !== tileKey) return false;
      const tile = state.tiles?.[tileKey];
      if (
        !tile ||
        !tile.hasFirkin ||
        tile.monsterPending ||
        (tile.monster && tile.monster.health > 0)
      ) return false;

      tile.hasFirkin = false;
      state.player.companionFirkin = {
        name: 'Firkin',
        icon: 'F',
        desc: '+3 to every melee attack roll. Can fight alongside the Loyal Bear.'
      };
      state.firkinRescued = true;
      state.firkinGuardianAssigned = true;
      log('You rescued Firkin. Return him to Rose—if you escape alive.', 'loot');
      render();

      showModal(
        'FIRKIN RESCUED',
        '',
        [{
          text: 'Welcome, Firkin',
          cls: 'green',
          fn: () => {
            closeModal();
            if (typeof afterWelcome === 'function') {
              setTimeout(afterWelcome, 0);
            }
          }
        }]
      );
      const body = document.getElementById('modalBody');
      if (body) {
        body.innerHTML =
          '<div style="font-size:84px;line-height:1;margin-bottom:12px">' +
          iconHTML('Firkin', 'F') +
          '</div><b>A bedraggled halfling crawls from his hiding place.</b>' +
          '<br><br>It’s Firkin—Rose’s long-lost husband!' +
          '<br><br><b>Companion:</b> +3 to every melee attack roll. Firkin can fight alongside the Loyal Bear.';
      }
      return true;
    }

    window.collectFirkinIfSafe = collectFirkinIfSafe;
    window.BODAssignFirkinGuardian = assignFirkinGuardian;
    window.BODAssignRingGuardian=assignRingGuardian;

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
      const guardsFirkin = Boolean(monster?.guardsFirkin);
      if (carriesRing) {
        // Prevent the original ranged-kill routine awarding normal loot or
        // collecting the Ring remotely. The Ring remains on the guardian tile.
        tile.hasRing = true;
        state.ringActivated = true;
        state.ringCarrierAssigned = true;
        state.ringKey = tileKey;
        monster.isDragon = true;
      }
      if (guardsFirkin) placeFirkinOnTile(tile, tileKey, monster.name);

      const result = originalRangedKill.apply(this, arguments);

      if (carriesRing) {
        monster.isDragon = false;
        log(monster.name + ' drops the Ring of Creation!', 'loot');
      }
      if (guardsFirkin) {
        log('Firkin is waiting on the fallen monster’s tile. Reach him to complete the rescue.', 'loot');
      }
      if (carriesRing || guardsFirkin) render();
      return result;
    };

    if (typeof dropMonsterRewardsOnTile === 'function') {
      const originalDropMonsterRewardsOnTile = dropMonsterRewardsOnTile;
      dropMonsterRewardsOnTile = function (monster, tile, tileKey) {
        if (monster?.guardsFirkin) {
          placeFirkinOnTile(tile, tileKey, monster.name);
          log('Firkin is waiting on the trap tile. Reach him to complete the rescue.', 'loot');
        }
        return originalDropMonsterRewardsOnTile.apply(this, arguments);
      };
    }

    killMonster = function () {
      const monster = combat.tile.monster;
      const tile = combat.tile;
      const tileKey = combat.sourceKey || key(state.player.x, state.player.y);
      const carriesRing = Boolean(monster.carriesRing);
      const guardsFirkin = Boolean(monster.guardsFirkin);
      const defeatedDragon = Boolean(
        monster.isDragon || monster.name === 'Red Dragon'
      );

      playSound('monsterDie');
      playTileEffect(tileKey, 'monsterDeath', 1000);
      log('Defeated ' + monster.name + '.', 'combat');
      state.player.killed.push(monster.name);
      state.monsterDiscard.push(monster);
      recordMonsterCorpse(tile, tileKey, monster);
      tile.monster = null;

      if (guardsFirkin) {
        placeFirkinOnTile(tile, tileKey, monster.name);
      }

      if (carriesRing) {
        tile.hasRing = true;
        state.ringActivated = true;
        state.ringCarrierAssigned = true;
        state.ringKey = tileKey;
        log(monster.name + ' drops the Ring of Creation!', 'loot');
      }

      if (defeatedDragon) {
        closeCombat();
        render();

        if (state.player.hasRing) {
          setTimeout(() => win(), 80);
        } else {
          const message =
            'The Red Dragon is defeated—but your quest is not over. ' +
            'Find the Ring of Creation and return to the Exit!';
          log(message, 'loot');
          setTimeout(() => {
            showModal(
              'YOUR QUEST IS NOT OVER',
              message,
              [{ text: 'Find the Ring', cls: 'green', fn: closeModal }]
            );
          }, 80);
        }
        return;
      }

      // The Ring replaces the guardian's ordinary item reward.
      const rewardCount = (!defeatedDragon && !carriesRing)
        ? (monster.maxHealth >= 10 ? 2 : (monster.maxHealth >= 6 ? 1 : 0))
        : 0;

      if (!defeatedDragon && !carriesRing && !rewardCount) {
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

      const awardRewards = () => {
        if (!rewardCount) return;
        if (typeof queueMonsterRewards === 'function') {
          queueMonsterRewards(rewardCount);
        } else {
          for (let index = 0; index < rewardCount; index++) awardItem();
        }
      };

      if (guardsFirkin) {
        setTimeout(() => {
          const collected = collectFirkinIfSafe(
            tileKey,
            rewardCount ? awardRewards : null
          );
          if (!collected && rewardCount) awardRewards();
        }, 80);
      }
      if (carriesRing) {
        setTimeout(() => collectRingIfSafe(tileKey), guardsFirkin ? 180 : 80);
      } else if (rewardCount && !guardsFirkin) {
        setTimeout(awardRewards, 120);
      }
    };

    // Assign as soon as tile 20 exists and a qualifying living guardian is present.
    assignRingGuardian();
    assignFirkinGuardian();
    setInterval(() => {
      assignRingGuardian();
      assignFirkinGuardian();
    }, 250);
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
