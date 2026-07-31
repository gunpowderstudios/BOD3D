// BOD3D-TEST v12.52 — guaranteed Ring and Firkin guardians
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

    function ringAlreadyAssigned() {
      return Boolean(
        state && (
          state.player?.hasRing ||
          state.ringCarrierAssigned ||
          (state.monsterDeck || []).some(monster => monster?.carriesRing) ||
          Object.values(state.tiles || {}).some(tile =>
            tile?.hasRing || tile?.monster?.carriesRing
          )
        )
      );
    }

    const MONSTERS_DRAWN_PER_DUNGEON = 11;

    function randomFrom(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function guardianBandBounds(laterInDungeon) {
      const deck = state?.monsterDeck || [];
      const drawCount = Math.min(MONSTERS_DRAWN_PER_DUNGEON, deck.length);
      const start = deck.length - drawCount;
      const split = start + Math.ceil(drawCount / 2);
      // Monsters are popped from the end: the lower half of this final
      // draw pool appears later in the dungeon.
      return laterInDungeon
        ? { start, end: split }
        : { start: split, end: deck.length };
    }

    function guardianCandidates(laterInDungeon, predicate) {
      const deck = state?.monsterDeck || [];
      const bounds = guardianBandBounds(laterInDungeon);
      let candidates = deck.slice(bounds.start, bounds.end).filter(predicate);
      if (candidates.length) return candidates;

      // Guarantee a suitable guardian will be drawn by swapping one from
      // outside the required band into an unassigned position inside it.
      const sourceIndex = deck.findIndex((monster, index) =>
        (index < bounds.start || index >= bounds.end) && predicate(monster)
      );
      const targetIndexes = [];
      for (let index = bounds.start; index < bounds.end; index += 1) {
        const monster = deck[index];
        if (monster && !monster.carriesRing && !monster.guardsFirkin) {
          targetIndexes.push(index);
        }
      }
      if (sourceIndex >= 0 && targetIndexes.length) {
        const targetIndex = randomFrom(targetIndexes);
        [deck[sourceIndex], deck[targetIndex]] = [deck[targetIndex], deck[sourceIndex]];
        candidates = deck.slice(bounds.start, bounds.end).filter(predicate);
      }
      return candidates;
    }

    function assignRingGuardian() {
      if (!state || ringAlreadyAssigned()) return false;
      const candidates = guardianCandidates(false, monster =>
        monster &&
        !monster.isDragon &&
        !monster.carriesRing &&
        !monster.guardsFirkin &&
        Number(monster.maxHealth) >= 10
      );
      if (!candidates.length) return false;

      const monster = randomFrom(candidates);
      monster.carriesRing = true;
      state.ringCarrierAssigned = true;
      state.ringActivated = true;
      state.ringKey = null;
      state.ringNumber = null;
      state.ringRoll = null;
      if (typeof log === 'function') {
        log('A powerful monster somewhere in the dungeon carries the Ring of Creation.', 'loot');
      }
      return true;
    }

    function firkinAlreadyPlacedOrRescued() {
      return Boolean(
        state && (
          state.player?.companionFirkin ||
          state.firkinRescued ||
          state.firkinGuardianAssigned ||
          (state.monsterDeck || []).some(monster => monster?.guardsFirkin) ||
          Object.values(state.tiles || {}).some(tile =>
            tile?.hasFirkin || tile?.monster?.guardsFirkin
          )
        )
      );
    }

    function announceFirkinGuardian() {
      const monster = combat?.tile?.monster;
      if (
        !monster ||
        !monster.revealed ||
        !monster.guardsFirkin ||
        monster.firkinAnnounced
      ) return false;

      monster.firkinAnnounced = true;
      log('You hear whimpering nearby…!', 'loot');
      if (typeof toast === 'function') toast('You hear whimpering nearby…!');
      return true;
    }

    function assignFirkinGuardian() {
      if (!state) return false;

      if (!firkinAlreadyPlacedOrRescued()) {
        // Firkin is guarded by a different 10+ Health monster in the
        // later half of the monsters guaranteed to appear in this dungeon.
        const candidates = guardianCandidates(true, monster =>
          monster &&
          !monster.isDragon &&
          !monster.carriesRing &&
          !monster.guardsFirkin &&
          Number(monster.maxHealth) >= 10
        );
        if (!candidates.length) return false;

        const monster = randomFrom(candidates);
        monster.guardsFirkin = true;
        state.firkinGuardianAssigned = true;
        state.firkinGuardianKey = null;
      }

      return announceFirkinGuardian();
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
      const chooseOneReward = !carriesRing && !monster?.isDragon &&
        Number(monster?.maxHealth) >= 10;
      if (carriesRing) {
        // Prevent the original ranged-kill routine awarding normal loot or
        // collecting the Ring remotely. The Ring remains on the guardian tile.
        tile.hasRing = true;
        state.ringActivated = true;
        state.ringCarrierAssigned = true;
        state.ringKey = tileKey;
      }
      // The original ranged routine awards two separate items to 10+ Health
      // monsters. Suppress that reward so the choice rule can handle it.
      if (carriesRing || chooseOneReward) monster.isDragon = true;
      if (guardsFirkin) placeFirkinOnTile(tile, tileKey, monster.name);

      const result = originalRangedKill.apply(this, arguments);

      if (carriesRing || chooseOneReward) monster.isDragon = false;
      if (carriesRing) {
        log(monster.name + ' drops the Ring of Creation!', 'loot');
      }
      if (chooseOneReward) {
        log(monster.name + ' had ' + monster.maxHealth +
          ' starting Health: draw 2 items and choose 1.', 'loot');
        setTimeout(() => {
          if (typeof queueMonsterRewards === 'function') queueMonsterRewards(2);
        }, 120);
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
          (rewardCount === 2 ? '2 items and choose 1.' : '1 item.'),
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

    // Secretly assign both guardians from the shuffled monster deck.
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
