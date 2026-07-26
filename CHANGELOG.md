# BOD3D-TEST Changelog

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
