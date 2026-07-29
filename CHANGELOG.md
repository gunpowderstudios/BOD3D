# BOD3D-TEST Changelog

## v12.19

- Fixed the home-screen “Enter the Dungeon” button so its text turns black against the pale cream hover background.
- Scoped the change to that button only; its normal appearance and all other buttons remain unchanged.

## v12.18

- Replay the current monster's assigned individual sound whenever melee combat opens, including cloak failures and ranged-charge fights.
- Fall back to the generic monster sound when no individual sound file or browser override is available.

## v12.17

- Made the Exit a real final tile at the bottom of the dungeon deck: 40-50 ordinary tiles are laid first, then the player legally connects the Exit and its Dragon.
- Removed the extra post-deck Exit placement and its unsafe fallback, which could place the Dragon behind a wall.
- Preserved the full M2-M12 marker set and both item locations by reserving the final Exit before markers are assigned.

## v12.16

- Fixed ACME Insurance resurrection camera tracking: returning to Start now cancels the stale combat-exit camera tween and automatically centres the hero on the Start tile.

## v12.15

- Restored Flying Daggers to range 1-4 while retaining connected-path targeting around corners.
- Restored Fireball to range 1-5.
- Added a visible die roll when using the Invisibility Cloak; rolls of 1-2 start a no-escape fight.
- Small and Large Chest results now wait until the visible die animation has played before being applied and announced.

## v12.14

- Fixed dual-wield combat so bonuses from both equipped one-handed melee weapons are added to the displayed score and actual attack roll.
- Two-handed melee weapons still count only once even though they occupy both hand slots.
- Sirrus and Tamara with a Morning Star and Small Axe now fight at 2d6+5.

## v12.13

- Added Developer Console buttons to preview both real end-game scrolls: Firkin rescued and Firkin lost.
- Ending previews do not end or modify the active test game.

## v12.12

- Enlarged the Sound Manager explanatory text and red/green status messages from 12px to 16px.
- Enlarged the sound file paths from 10px to 14px for easier reading.

## v12.11

- Renamed the opening-scroll button from “Enter at your own risk” to “Begin your quest…” so it matches the story’s premise that the hero awakens inside the dungeon.

## v12.10

- Fixed the intro ambience switching prematurely from `distant-monsters.mp3` to `dungeon-sounds.mp3`.
- The Android/page-lifecycle audio controller now recognises the actual `#charSelect` screen used by the game.
- Focus, pageshow and tab-return events now restore the correct track for the visible screen.

## v12.09

- Restored ACME Insurance under the single-life rules: it is consumed automatically on defeat and grants one resurrection.
- The hero returns to Start with full Health and AP.
- All equipped and backpack items drop on the exact death tile; the Ring also drops there if carried.
- Companions are not treated as dropped items.
- Removed the old Dragon-death rule that transferred items to the Healing Pool.
- Updated the ACME Insurance item description and removed its obsolete legacy inventory hook.

## v12.08

- Fixed Firkin’s guardian assignment so the whimpering message can no longer refer to an older revealed monster elsewhere in the dungeon.
- Firkin now attaches only to the specific 10+ Health monster in the current combat encounter.
- The Red Dragon and Ring guardian remain excluded; running away leaves Firkin attached to that monster.
- Changed the notification to: “You hear whimpering nearby…!”

## v12.07

- Added Firkin as a hidden rescue companion after 15 tiles and 6 monster kills, with a 25% chance on each newly revealed 8+ Health monster and a guaranteed next suitable guardian from tile 25.
- Prevented Firkin from sharing a guardian with the Ring or Red Dragon.
- Added melee, ranged and trap rescue handling; a distant Firkin waits on the guardian’s tile until reached.
- Firkin adds +3 to every attack roll and stacks with the Loyal Bear’s extra combat die.
- Added Firkin to the companion panel, Asset Manager and 2D/3D token rendering at `assets/companions/firkin.png`.
- Changed Firkin’s disappearance in the introduction from many years to many days.
- Added scroll-based rescued-Firkin and missing-Firkin victory endings using the approved stories.

## v12.06

- Replaced the body of “A SHORT STORY…” with the revised tavern and dungeon introduction.
- Corrected dialogue punctuation, hyphenation, capitalisation and sentence structure while preserving the existing title.

## v12.05

- Removed the stray punctuation before “If your hero falls…” and placed the exclamation mark correctly inside “ONE LIFE!”.
- Added the Ring guardian tip and retained the Red Dragon warning in red text on the opening scroll.

## v12.04

- Removed the separate white “3D” text beneath the opening-screen logo because the updated logo graphic now includes it.
- Kept the visible version number beneath the logo and left the logo artwork itself unchanged.

## v12.03

- Moved the character-selection logo down on mobile so it no longer clashes with the upper-left BUY BOD tag or upper-right mute control.
- Preserved the existing logo size and desktop placement.

## v12.02

- Changed Dragonlance from three extra damage dice after a hit to +1 normal combat die against the Red Dragon only.
- Dragonlance now behaves like the Bear's dice bonus, but never applies against ordinary monsters.
- Updated the item description to match the corrected rule.

## v12.01

- Moved the solid-blue BUY BOD button flush to the upper-left corner on desktop and mobile.
- Restyled it as a neat fabric/jeans-style tag with a squared attached corner, subtle inset edge and compact raised shadow.
- Shifted the mobile Centre circle to the right so it remains clear of the tag without moving Map, mute, menu or fullscreen controls.

## v12.00

- Restyled BUY BOD as a smaller solid-blue button with bold white text.
- Matched the bordered, raised and pressed appearance of the compact red mobile action buttons without changing its link or position.

## v11.99

- Added a persistent blue BUY BOD tab on the right edge of desktop and mobile screens.
- The button opens `https://www.gunpowderstudios.co.uk/` in a new tab with safe external-link attributes.
- Positioned it away from the left-side Ring/hearts and the centred movement and ranged controls.

## v11.98

- Ranged-action buttons now appear only when the relevant item is equipped and at least one legal monster target is within its permitted range.
- Applied the automatic-button rule to Bow, Elven Bow, Ice Staff, and equipped Fireball or Flying Daggers; backpack-only spells remain available through Items.
- Preserved weapon and backpack switching during melee combat so a player can change to a hand weapon after a monster charges.
- Randomised each dungeon to contain a hidden total of 40–50 ordinary tiles before the Dragon's Exit appears, while retaining three Spike Traps, the Healing Pool, M2–M12, two item locations, and the 20-tile Ring guardian rule.

## v11.97

- Restored the player's AP after a ranged encounter fully resolves, allowing permanent ranged weapons such as the Bow and Elven Bow to be used again against later monsters.
- A ranged kill or trap kill restores AP immediately; a surviving monster's charge restores it only after the resulting melee encounter closes.
- Moved desktop ranged-action buttons into a bounded low-left column so they no longer overlap the centred NSEW D-pad.

## v11.96

- Restored the complete-dungeon fit when entering 2D Map mode on mobile.
- Kept one-finger panning and two-finger pinch zoom enabled in the reference-only map.
- Matched the pinch-zoom minimum scale to the full-map fit so large dungeons no longer jump back to a cropped 0.45 scale.
- Double-tapping the 2D map or rotating/resizing the screen now refits the entire dungeon.

## v11.95

- Added a small floating Ring of Creation image at the upper-left of the board after the player physically collects the Ring.
- The indicator uses the current Ring asset mapping, does not intercept controls, and hides when the Ring is not carried or the player returns to character selection.
- Preserved the user's updated “A SHORT STORY…” heading and story text unchanged.

## v11.94

- Made the five-second Map/3D mobile Developer Tools hold reliable by using native touch start/end handling and allowing normal finger drift during the hold.
- Confirmed and restored the v11.65 Ring rule: after at least 20 ordinary dungeon tiles, a random living non-Dragon monster with 10+ starting Health carries the Ring.
- The Ring replaces that guardian's normal item reward and remains on its tile after a ranged kill until the hero reaches it.
- Complete developer dungeons containing monsters now explicitly run the same Ring guardian assignment. Tiles-only dungeons cannot assign the Ring until an eligible monster exists.

## v11.93

- Fixed complete dungeons generated by Developer Tools so they use the normal end-of-dungeon routine.
- Developer-built dungeons now include the Exit guarded by the Red Dragon and perform the normal two-dice Ring location roll across M2–M12.
- Preserved M2–M12 locations in the tiles-only complete-dungeon test so the Ring can still be placed correctly.

## v11.92

- Moved the five-second mobile Developer Console gesture from the version number to the always-visible Map/3D button during gameplay.
- A normal tap still switches views; a completed long press opens Developer Tools without also switching the view.

## v11.91

- Added a TEST-only mobile shortcut: press and hold the visible version number continuously for five seconds to open the existing Developer Console.
- Preserved the current desktop Developer Console, dice rolls, calibration, tuning controls, and keyboard shortcut unchanged.

## v11.90

- Fixed the D-pad and combat controls remaining disabled after returning from the reference-only 2D map to 3D.
- Control availability now refreshes whenever the board view changes or the 3D view is reset.

## v11.89

- Replaced the Magic Boots' obsolete +1 AP effect with improved protection against Old Spikey: the trap springs only on a roll of 1 while the boots are equipped, instead of 1–2.
- Increased the shuffled dungeon from one Spike Trap tile to three.
- Removed all remaining Magic Boots AP adjustments from equipment, inventory, save migration, and tester paths.

## v11.88

- Changed the equipped Torch to grant +1 Combat.
- Removed the Torch's obsolete AP-free second tile effect.
- Made 2D/map mode reference-only: map pan and zoom remain available, but movement, tile laying, and combat actions require returning to 3D.

## v11.87

- Removed unresolved Git conflict markers from `assets/assets.js`.
- Restored the canonical PNG mappings for Sirrus, Tamara, Mud Monster, Giant Snake and Mirror Monster in the Asset Manager.
- Removed obsolete duplicate runtime patches from the asset-path file; current dedicated patches remain unchanged.
- Updated the `assets.js` cache tag so browsers load the repaired mapping table.

## v11.86

- Made permanent blood pools and droplets left by defeated monsters slightly redder.
- Changed only the two blood-material colours; shape, size, opacity and behaviour are unchanged.

## v11.85

- Replaced the large mobile ranged control with a compact red combat-style button low-left beside the D-pad.
- Expanded the combat Items drawer to show equipped gear and backpack equipment.
- Allowed free weapon, shield, armour and attire swapping between combat rolls with no AP cost.
- Kept equipment changes locked while dice are rolling and retained backpack-capacity checks.

## v11.84

- Refreshed the character card immediately when the Ring of Creation is collected.
- The Ring indicator now changes to YES as soon as the guardian’s Ring is awarded.
- Kept the existing 20-tile guardian and item-lock rules unchanged.

## v11.83

- Moved the mobile Bow, Ice Staff and cancel-ranged controls completely above the D-pad.
- Added a consistent gap and reduced the action height while keeping a touch-safe 48px target.
- Kept desktop controls unchanged.

## v11.82

- Restored red Quest Log text for combat messages, including attacks and damage.
- Kept system, loot and healing messages unchanged.

## v11.81

- Changed “You have ONE LIFE. If your hero falls…” to “You have ONE LIFE! If your hero falls…”
- Removed the unwanted full stop before “If”.

## v11.80

- Made all mobile warning and story body text bold.
- Increased the space above the warning heading from 12px to 24px.
- Kept the existing heading size, body size and parchment height.

## v11.79

- Added “THE STORY SO FAR…” after the existing Good luck warning copy.
- Added the Wasted Wizard Tavern, Rose, Firkin and dungeon-map introduction.
- Matched the mobile story heading to 22px and body copy to 18px.
- Made the longer parchment content scroll from the top while keeping the Enter button accessible.

## v11.78

- Added a little padding above the mobile warning heading.
- Removed the duplicate line break after the red Dragon warning.
- Kept the v11.77 heading, body size and parchment height.

## v11.77

- Reduced the mobile warning heading to 22px.
- Increased the mobile warning body text to 18px.
- Reduced the mobile parchment height from 76dvh to 68dvh to remove excess space above and below the copy.
- Retained internal scrolling for unusually short screens.

## v11.76

- Allowed mobile table gestures through transparent combat and stats areas.
- Kept Fight, Run Away, Items and Lethal Blow controls fully tappable.
- Kept the Items drawer interactive.
- Preserved the Fight-button camera reframe and hidden mobile combat compass.

## v11.75

- Restored drag, rotate and pinch-zoom gestures during mobile combat.
- Kept the compass hidden during mobile combat.
- Preserved the established Fight-button camera reframe.
- Kept gameplay interactions with monsters, tiles and items locked during combat.

## v11.74

- Hid the compass during combat on mobile.
- Blocked mobile combat drag, pinch, zoom and 3D model taps on the underlying dungeon.
- Restored normal map interaction automatically when combat closes.
- Kept desktop combat-camera behaviour unchanged.

## v11.73

- Rebuilt mobile combat actions as a compact two-row tray.
- Placed Fight and Run Away side by side.
- Placed Items and the circular Lethal Blow control on the second row.
- Reduced mobile action height while retaining touch-safe 52px targets.
- Kept desktop combat unchanged.

## v11.72

- Added the live vertical Health-heart column to mobile.
- Positioned mobile hearts midway down the left edge, clear of the top controls, compass, movement pad and sliding drawer.
- Kept the existing desktop heart column unchanged.
- No gameplay or combat changes.

## v11.71

- Restored the desktop vertical health-heart column above the compass.
- Hearts update automatically when the hero gains or loses Health.
- Kept the extra heart column hidden on mobile, where Health remains in the compact status/drawer.
- No gameplay or combat changes.

## v11.70

- Removed the unused Zoom − and Zoom + buttons on desktop and mobile.
- Kept the Centre control and compass unchanged.
- Shifted the mobile top-bar/Map control left to reserve clear space for Mute and Full Screen.
- No gameplay, combat, drawer or audio-behaviour changes.

## v11.69

- Centralised the active patch version and cache-busting value in `assets/reward-fix.js`.
- Added a visible startup warning when an essential patch script or stylesheet fails to load.
- Removed the stale loader reference to the missing `assets/quest-log-colours.js` file.
- Added this changelog.
- No gameplay or combat changes.

## v11.68

- Restored a permanently visible Mute button on desktop and mobile.
- Removed the thick grey border from the right edge of the character panel.

## v11.67

- Fixed the combat cleanup observer so Fight and Run Away remain responsive.

## v11.66

- Removed the initial “Dice will appear here.”, “Ready to fight!” and “A monster blocks your path.” placeholders.
- Removed the unwanted combat/sidebar divider.

## v11.65

- Prevented the Ice Staff and Large Steel Axe from being drawn before 20 dungeon tiles are laid.
- Moved the Ring of Creation to a living non-Dragon monster with 10 or more starting Health after tile 20.
- Made the Ring replace that guardian’s normal item reward.
- Kept a remotely dropped Ring on its tile until the hero reaches it.

## v11.64

- Added Android page/app lifecycle handling for loading-screen and dungeon ambience.
- Made the Mute setting control both ambience tracks and persist across reloads.

## v11.63

- Enlarged the responsive warning parchment writing area.

## v11.62

- Kept the warning heading visible on desktop.

## v11.61

- Rebuilt the warning parchment layout responsively.

## v11.60

- Limited selectable heroes to Sirrus and Tamara.
