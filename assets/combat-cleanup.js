// BOD3D-TEST v11.67 — remove combat placeholders without blocking controls
(function () {
  'use strict';

  if (window.__bodCombatCleanupV1166Installed) return;
  window.__bodCombatCleanupV1166Installed = true;

  const DICE_PLACEHOLDERS = new Set([
    'Dice will appear here.'
  ]);
  const LOG_PLACEHOLDERS = new Set([
    'Ready to fight!',
    'A monster blocks your path.'
  ]);

  function cleanCombatPlaceholders() {
    const dice = document.getElementById('diceTray');
    if (dice && DICE_PLACEHOLDERS.has(dice.textContent.trim())) {
      dice.textContent = '';
      dice.classList.add('combatTrayEmpty');
    } else if (dice && dice.textContent.trim() && dice.classList.contains('combatTrayEmpty')) {
      dice.classList.remove('combatTrayEmpty');
    }

    const log = document.getElementById('combatLog');
    if (log && LOG_PLACEHOLDERS.has(log.textContent.trim())) {
      log.textContent = '';
      log.classList.add('combatLogEmpty');
    } else if (log && log.textContent.trim() && log.classList.contains('combatLogEmpty')) {
      log.classList.remove('combatLogEmpty');
    }
  }

  function installStyles() {
    if (document.getElementById('bodCombatCleanupStylesV1166')) return;
    const style = document.createElement('style');
    style.id = 'bodCombatCleanupStylesV1166';
    style.textContent = `
      body.combatActive #side{
        border-right:0!important;
        box-shadow:none!important;
      }
      body.combatActive #combat,
      body.combatActive #combat .combatCard,
      body.combatActive .combatWideLayout,
      body.combatActive .combatGrid,
      body.combatActive .combatResolution,
      body.combatActive .diceTray,
      body.combatActive .combatLog{
        border-left:0!important;
        box-shadow:none!important;
      }
      body.combatActive .diceTray.combatTrayEmpty,
      body.combatActive .combatLog.combatLogEmpty{
        min-height:0!important;
        height:0!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        overflow:hidden!important;
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    cleanCombatPlaceholders();

    const combat = document.getElementById('combat');
    if (!combat) return;
    new MutationObserver(cleanCombatPlaceholders).observe(combat, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
