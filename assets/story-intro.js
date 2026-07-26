// BOD3D-TEST v11.81 — story introduction and warning punctuation correction
(function () {
  'use strict';

  if (window.__bodStoryIntroV1179Installed) return;
  window.__bodStoryIntroV1179Installed = true;

  const paragraphs = [
    'Many a tale has been told in the Wasted Wizard Tavern of lost dungeons and the fabled Ring of Creation. Most are nonsense, spun by ale-soaked adventurers—but one night, a conversation catches your attention.',
    'A halfling hawker is trying to sell a map to a suspicious dwarf.',
    '“Away with you!” the dwarf growls. “That map’s a forgery if ever I saw one. Now leave me to my ale!”',
    'He stumbles from the table and wanders towards the stables to sleep it off.',
    'The halfling remains behind. She looks tired, hungry and desperately down on her luck.',
    '“How much for the map?” you ask.',
    'She slowly raises her eyes. “A room, a hot meal and a mug of ale—and it’s yours.”',
    '“You have that much faith in it?”',
    'Without answering, she passes you the map. The parchment looks old and its markings convincing, but the finest forgers could manage as much.',
    '“All right,” you say. “Mary! Put this halfling’s room, meal and ale on my tab.”',
    '“Settle up before you leave!” Mary calls back.',
    '“Rose,” says the halfling quietly. “My name is Rose. My husband, Firkin, entered that dungeon many years ago. He never returned. This map is all I have left.”',
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
    if (!scroll) return;

    const oneLife = Array.from(scroll.querySelectorAll('b,strong'))
      .find(element => element.textContent.trim() === 'ONE LIFE');
    if (oneLife && oneLife.nextSibling?.nodeType === Node.TEXT_NODE) {
      oneLife.nextSibling.textContent = oneLife.nextSibling.textContent
        .replace(/^\.\s*If\b/, '! If');
    }

    if (scroll.querySelector('.testerStoryHeading')) return;
    scroll.classList.add('hasStory');

    const heading = document.createElement('div');
    heading.className = 'testerStoryHeading';
    heading.textContent = 'THE STORY SO FAR…';
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
