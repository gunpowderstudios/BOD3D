// BOD3D-TEST v12.07 — Firkin story timing and ending guard
(function () {
  'use strict';

  if (window.__bodStoryIntroV1179Installed) return;
  window.__bodStoryIntroV1179Installed = true;

  const paragraphs = [
    'Many a tale has been told in the Wasted Wizard Tavern of lost dungeons and the fabled Ring of Creation. Most are nonsense, spun by ale-soaked adventurers—but one night, a conversation catches your attention.',
    'A bedraggled-looking halfling is trying to sell a map to a drunken dwarf. He eyes her suspiciously, struggling to focus on what she is saying.',
    '“Away with you!” the dwarf growls. “That map’s a forgery if ever I saw one. Now leave me to my ale, halfling!”',
    'He stumbles from the table and wanders towards the stables to sleep it off.',
    'The halfling remains behind. She looks tired, hungry and desperately down on her luck.',
    '“How much for the map?” you ask.',
    'She slowly raises her eyes. “A room, a hot meal and a mug of ale—and it’s yours.”',
    '“You have that much faith in it?”',
    '“It’s all I have,” she sighs, as though she has run out of options. With that, she passes you the map. The parchment looks old and its markings are convincing, but the finest forgers could manage as much.',
    '“All right,” you say. “Mary! Put this halfling’s room, meal and ale on my tab.”',
    '“Settle up before you leave!” Mary calls back.',
    '“Rose,” says the halfling quietly. “My name is Rose. My husband, Firkin, entered that dungeon many days ago. He never returned. This map is all I have left.”',
    'Tears gather in her eyes as she pushes it towards you.',
    '“If you find him, tell him I’m still waiting.”',
    'The next morning, you follow the map southeast from Dragon Reach. After two nights on the road, you arrive at the marked location—but there is no cave, no doorway and no sign of any dungeon.',
    'You search until dusk and are about to abandon the whole foolish adventure when a branch cracks behind you.',
    'You turn just in time to glimpse a club swinging towards your head.',
    'Lights out.',
    'You awaken on a cold stone floor. Your weapons and possessions are gone.',
    'All that remains is your backpack—and somewhere in the darkness, something is moving.'
  ];

  function appendStory(scroll) {
    if (!scroll || scroll.classList.contains('endingScroll')) return;

    if (scroll.querySelector('.testerStoryHeading')) return;
    scroll.classList.add('hasStory');

    const heading = document.createElement('div');
    heading.className = 'testerStoryHeading';
    heading.textContent = 'A SHORT STORY…';
    scroll.appendChild(heading);

    paragraphs.forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.className = 'testerStoryParagraph';
      paragraph.textContent = text;
      scroll.appendChild(paragraph);
    });
    scroll.scrollTop = 0;
  }

  function findAndAppend() {
    document.querySelectorAll('.testerWarningScroll').forEach(appendStory);
  }

  function start() {
    findAndAppend();
    new MutationObserver(findAndAppend).observe(document.body, {
      subtree: true,
      childList: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
