// "one more run.": a tiny deckbuilder. Three floors, three energy a turn,
// five cards a hand, and a card to add to your deck after each fight.
//
// The rules live in `TinyRun` (no DOM), so they can be tested on their own.
// The UI below renders the state and animates the events the rules return.

const TinyRun = (() => {
    const MAX_ENERGY = 3;
    const HAND_SIZE = 5;
    const START_HP = 40;
    const REST_HEAL = 10;

    // Each card's `play` gets helpers that record events for the UI.
    const CARDS = {
        ship: { name: 'Ship It', cost: 1, type: 'attack', text: 'Deal 6 damage.', play: fx => fx.hit(6) },
        hours: { name: 'Office Hours', cost: 1, type: 'skill', text: 'Gain 5 block.', play: fx => fx.block(5) },
        espresso: { name: 'Espresso Shot', cost: 0, type: 'skill', text: 'Gain 1 energy. Draw 1 card.', play: fx => { fx.energy(1); fx.draw(1); } },
        highlight: { name: 'Highlight', cost: 1, type: 'skill', text: 'Mark the enemy: it takes 50% more damage for 2 turns.', play: fx => fx.mark(2) },
        finesse: { name: 'Double Finesse', cost: 1, type: 'attack', text: 'Deal 4 damage twice.', play: fx => { fx.hit(4); fx.hit(4); } },
        splash: { name: 'Splash', cost: 2, type: 'attack', text: 'Deal 14 damage. From way downtown.', play: fx => fx.hit(14) },
        haul: { name: 'Thrift Haul', cost: 1, type: 'skill', text: 'Gain 4 block. Draw 1 card.', play: fx => { fx.block(4); fx.draw(1); } },
        cute: { name: 'Cute Aggression', cost: 1, type: 'power', text: 'Gain 2 strength: every hit deals 2 more.', play: fx => fx.strength(2) },
        success: { name: 'Customer Success', cost: 1, type: 'skill', text: 'Gain 9 block. They\'re happy, you\'re safe.', play: fx => fx.block(9) },
        latte: { name: 'Oat Latte', cost: 1, type: 'skill', text: 'Heal 5 HP. Draw 1 card.', play: fx => { fx.heal(5); fx.draw(1); } },
        prototype: { name: 'Quick Prototype', cost: 0, type: 'attack', text: 'Deal 3 damage. Draw 1 card.', play: fx => { fx.hit(3); fx.draw(1); } },
    };

    const STARTER = ['ship', 'ship', 'ship', 'ship', 'hours', 'hours', 'hours', 'hours', 'espresso', 'highlight'];
    const REWARDS = ['finesse', 'splash', 'haul', 'cute', 'success', 'latte', 'prototype', 'espresso', 'highlight'];

    // Enemies cycle through their intents in order.
    const ENEMIES = [
        {
            name: 'the inbox', flavour: 'unread: 99+', hp: 32,
            intents: [{ attack: 8 }, { attack: 5, times: 2 }, { block: 6, attack: 6 }],
        },
        {
            name: 'a surprise meeting', flavour: 'this could have been an email', hp: 46,
            intents: [{ attack: 10 }, { buff: 2, block: 8 }, { attack: 6, times: 2 }, { attack: 14 }],
        },
        {
            name: 'the production bug', flavour: 'works on my machine', hp: 70, boss: true,
            intents: [{ attack: 11 }, { buff: 3, block: 10 }, { attack: 7, times: 2 }, { block: 12, attack: 8 }, { attack: 18 }],
        },
    ];

    const shuffle = (list) => {
        const copy = [...list];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    let uid = 0;

    const createRun = () => ({ floor: 0, hp: START_HP, maxHp: START_HP, deck: [...STARTER], turns: 0 });

    const intentOf = (enemy) => enemy.def.intents[enemy.intent % enemy.def.intents.length];

    const startFight = (run) => {
        const def = ENEMIES[run.floor];
        const fight = {
            enemy: { def, hp: def.hp, maxHp: def.hp, block: 0, strength: 0, marked: 0, intent: 0 },
            player: { block: 0, strength: 0 },
            draw: shuffle(run.deck.map(id => ({ uid: ++uid, id }))),
            discard: [],
            hand: [],
            energy: MAX_ENERGY,
            over: null,
        };
        drawCards(fight, HAND_SIZE);
        return fight;
    };

    function drawCards(fight, n) {
        const drawn = [];
        for (let i = 0; i < n; i++) {
            if (fight.draw.length === 0) {
                if (fight.discard.length === 0) break;
                fight.draw = shuffle(fight.discard);
                fight.discard = [];
            }
            const card = fight.draw.pop();
            fight.hand.push(card);
            drawn.push(card);
        }
        return drawn;
    }

    // Damage after strength and "marked", then through block.
    const dealDamage = (target, base, strength, marked) => {
        let amount = base + strength;
        if (marked > 0) amount = Math.floor(amount * 1.5);
        const blocked = Math.min(target.block, amount);
        target.block -= blocked;
        const taken = amount - blocked;
        target.hp = Math.max(0, target.hp - taken);
        return { amount, blocked, taken };
    };

    const canPlay = (fight, card) => !fight.over && CARDS[card.id].cost <= fight.energy;

    const playCard = (run, fight, cardUid) => {
        const index = fight.hand.findIndex(c => c.uid === cardUid);
        if (index === -1) return [];
        const card = fight.hand[index];
        if (!canPlay(fight, card)) return [];

        const def = CARDS[card.id];
        const events = [{ kind: 'play', card }];
        fight.energy -= def.cost;
        fight.hand.splice(index, 1);
        fight.discard.push(card);

        def.play({
            hit: (n) => {
                if (fight.enemy.hp <= 0) return;
                const result = dealDamage(fight.enemy, n, fight.player.strength, fight.enemy.marked);
                events.push({ kind: 'hit', target: 'enemy', ...result });
            },
            block: (n) => { fight.player.block += n; events.push({ kind: 'block', target: 'player', amount: n }); },
            energy: (n) => { fight.energy += n; events.push({ kind: 'energy', amount: n }); },
            draw: (n) => events.push({ kind: 'draw', cards: drawCards(fight, n) }),
            mark: (n) => { fight.enemy.marked += n; events.push({ kind: 'mark', amount: n }); },
            strength: (n) => { fight.player.strength += n; events.push({ kind: 'strength', target: 'player', amount: n }); },
            heal: (n) => {
                const healed = Math.min(n, run.maxHp - run.hp);
                run.hp += healed;
                events.push({ kind: 'heal', amount: healed });
            },
        });

        if (fight.enemy.hp <= 0) {
            fight.over = 'won';
            events.push({ kind: 'won' });
        }
        return events;
    };

    const endTurn = (run, fight) => {
        if (fight.over) return [];
        const events = [];
        run.turns++;

        fight.discard.push(...fight.hand);
        fight.hand = [];

        // Enemy turn: its old block falls away, then it acts.
        const enemy = fight.enemy;
        enemy.block = 0;
        const intent = intentOf(enemy);
        if (intent.buff) {
            enemy.strength += intent.buff;
            events.push({ kind: 'strength', target: 'enemy', amount: intent.buff });
        }
        if (intent.block) {
            enemy.block += intent.block;
            events.push({ kind: 'block', target: 'enemy', amount: intent.block });
        }
        if (intent.attack) {
            // The run holds the player's HP; borrow it for the damage maths.
            const target = { hp: run.hp, block: fight.player.block };
            for (let i = 0; i < (intent.times || 1); i++) {
                const result = dealDamage(target, intent.attack, enemy.strength, 0);
                events.push({ kind: 'hit', target: 'player', ...result });
            }
            run.hp = target.hp;
            fight.player.block = target.block;
        }
        if (enemy.marked > 0) enemy.marked--;
        enemy.intent++;

        if (run.hp <= 0) {
            fight.over = 'lost';
            events.push({ kind: 'lost' });
            return events;
        }

        // Your turn: your block falls away, energy refills, draw a new hand.
        fight.player.block = 0;
        fight.energy = MAX_ENERGY;
        events.push({ kind: 'newHand', cards: drawCards(fight, HAND_SIZE) });
        return events;
    };

    const rewardChoices = () => shuffle(REWARDS).slice(0, 3);

    // Between floors: add the chosen card (if any), rest, and climb.
    const advance = (run, cardId) => {
        if (cardId && CARDS[cardId]) run.deck.push(cardId);
        run.floor++;
        run.hp = Math.min(run.maxHp, run.hp + REST_HEAL);
    };

    const describeIntent = (enemy) => {
        const intent = intentOf(enemy);
        const parts = [];
        if (intent.attack) {
            const each = intent.attack + enemy.strength;
            parts.push(intent.times ? `attack for ${each} × ${intent.times}` : `attack for ${each}`);
        }
        if (intent.block) parts.push(`block ${intent.block}`);
        if (intent.buff) parts.push(`power up (+${intent.buff} strength)`);
        return parts.join(' and ');
    };

    return {
        CARDS, ENEMIES, MAX_ENERGY, REST_HEAL,
        createRun, startFight, playCard, endTurn, canPlay, rewardChoices, advance, describeIntent,
    };
})();

if (typeof window !== 'undefined') window.TinyRun = TinyRun;

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('game');
    if (!root) return;

    const { CARDS, ENEMIES, MAX_ENERGY, REST_HEAL } = TinyRun;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, reduceMotion ? 0 : ms));

    let run = null;
    let fight = null;
    let busy = false;

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };

    const button = (label, onClick, className = 'text-button') => {
        const b = el('button', className);
        b.type = 'button';
        b.append(el('span', '', label));
        b.addEventListener('click', onClick);
        return b;
    };

    const cardFace = (id) => {
        const def = CARDS[id];
        const face = el('span', `card card--${def.type}`);
        face.append(
            el('span', 'card__cost', String(def.cost)),
            el('span', 'card__name', def.name),
            el('span', 'card__text', def.text),
            el('span', 'card__type', def.type),
        );
        return face;
    };

    // ---------- screens ----------

    const screen = (...children) => {
        root.replaceChildren();
        const wrap = el('div', 'game__screen');
        wrap.append(...children);
        root.append(wrap);
        return wrap;
    };

    const showTitle = () => {
        const ladder = el('ol', 'game__ladder');
        ENEMIES.forEach((e, i) => {
            const li = el('li');
            li.append(el('span', 'game__ladder-floor', `floor ${i + 1}`), el('span', 'game__ladder-name', e.name));
            ladder.append(li);
        });
        screen(
            el('p', 'game__kicker', 'the climb'),
            ladder,
            el('p', 'game__note', `Play cards with energy (${MAX_ENERGY} a turn), watch what the enemy intends to do, and pick a new card after every win.`),
            button('start a run', startRun, 'text-button game__cta'),
        );
    };

    const showReward = () => {
        const choices = TinyRun.rewardChoices();
        const row = el('div', 'game__rewards');
        choices.forEach((id, i) => {
            const pick = el('button', 'card-button');
            pick.type = 'button';
            pick.style.setProperty('--n', String(i));
            pick.append(cardFace(id));
            pick.setAttribute('aria-label', `Add ${CARDS[id].name} to your deck: ${CARDS[id].text}`);
            pick.addEventListener('click', () => nextFloor(id));
            row.append(pick);
        });
        screen(
            el('p', 'game__kicker', `floor ${run.floor + 1} cleared`),
            el('h3', 'game__headline', `${ENEMIES[run.floor].name}, handled.`),
            el('p', 'game__note', `Pick a card to add to your deck. You'll also rest and heal ${REST_HEAL} HP.`),
            row,
            button('skip the card', () => nextFloor(null)),
        );
    };

    const showEnd = (won) => {
        const headline = won ? 'you made it to the top.' : `${ENEMIES[run.floor].name} got you.`;
        const note = won
            ? `Three floors in ${run.turns} turns, with ${run.hp} HP to spare and a ${run.deck.length}-card deck. Not bad at all.`
            : `Floor ${run.floor + 1}, turn ${run.turns}. That's roguelikes: the next run is the one.`;
        screen(
            el('p', 'game__kicker', won ? 'run complete' : 'run over'),
            el('h3', `game__headline${won ? ' game__headline--won' : ''}`, headline),
            el('p', 'game__note', note),
            button('one more run', startRun, 'text-button game__cta'),
        );
    };

    // ---------- fight ----------

    let refs = {};

    const fighterPanel = (side) => {
        const panel = el('div', `fighter fighter--${side}`);
        const head = el('div', 'fighter__head');
        const name = el('span', 'fighter__name');
        const tag = el('span', 'fighter__tag');
        head.append(name, tag);
        const flavour = el('p', 'fighter__flavour');
        const bar = el('div', 'hpbar');
        const fill = el('div', 'hpbar__fill');
        const hpText = el('span', 'hpbar__text');
        bar.append(fill, hpText);
        const status = el('div', 'fighter__status');
        const floats = el('div', 'fighter__floats');
        floats.setAttribute('aria-hidden', 'true');
        panel.append(head, flavour, bar, status, floats);
        return { panel, name, tag, flavour, fill, hpText, status, floats };
    };

    const buildFight = () => {
        root.replaceChildren();
        const arena = el('div', 'game__arena');
        const enemy = fighterPanel('enemy');
        const player = fighterPanel('player');
        const intent = el('p', 'intent');
        enemy.panel.append(intent);
        arena.append(enemy.panel, player.panel);

        const bar = el('div', 'game__bar');
        const energy = el('div', 'energy');
        const piles = el('span', 'game__piles');
        const end = button('end turn', onEndTurn, 'text-button game__end');
        bar.append(energy, piles, end);

        const hand = el('div', 'game__hand');
        hand.setAttribute('role', 'group');
        hand.setAttribute('aria-label', 'Your hand');

        const logLine = el('p', 'game__log');
        logLine.setAttribute('aria-live', 'polite');

        root.append(arena, bar, hand, logLine);
        refs = { enemy, player, intent, energy, piles, end, hand, log: logLine };

        enemy.name.textContent = fight.enemy.def.name;
        enemy.tag.textContent = fight.enemy.def.boss ? `floor ${run.floor + 1} · boss` : `floor ${run.floor + 1} of ${ENEMIES.length}`;
        enemy.flavour.textContent = fight.enemy.def.flavour;
        player.name.textContent = 'you';
        player.tag.textContent = `${run.deck.length} cards in deck`;
        player.flavour.textContent = 'armed with coffee and good intentions';

        renderStatus();
        addCards(fight.hand);
        log(`${fight.enemy.def.name} appears. Your move.`);
    };

    const badge = (text) => el('span', 'badge', text);

    const renderStatus = () => {
        const { enemy, player } = refs;
        const e = fight.enemy;

        enemy.fill.style.transform = `scaleX(${e.hp / e.maxHp})`;
        enemy.hpText.textContent = `${e.hp} / ${e.maxHp}`;
        enemy.status.replaceChildren(
            ...(e.block ? [badge(`block ${e.block}`)] : []),
            ...(e.strength ? [badge(`+${e.strength} strength`)] : []),
            ...(e.marked ? [badge(`marked ${e.marked}`)] : []),
        );

        player.fill.style.transform = `scaleX(${run.hp / run.maxHp})`;
        player.hpText.textContent = `${run.hp} / ${run.maxHp}`;
        player.status.replaceChildren(
            ...(fight.player.block ? [badge(`block ${fight.player.block}`)] : []),
            ...(fight.player.strength ? [badge(`+${fight.player.strength} strength`)] : []),
        );

        refs.intent.replaceChildren(el('span', '', 'intends to '), el('strong', '', TinyRun.describeIntent(e)));

        refs.energy.replaceChildren();
        const pips = Math.max(MAX_ENERGY, fight.energy);
        for (let i = 0; i < pips; i++) refs.energy.append(el('span', `energy__pip${i < fight.energy ? ' is-full' : ''}`));
        refs.energy.append(el('span', 'energy__label', `${fight.energy} energy`));

        refs.piles.textContent = `draw ${fight.draw.length} · discard ${fight.discard.length}`;

        refs.hand.querySelectorAll('.card-button').forEach(b => {
            const card = fight.hand.find(c => c.uid === Number(b.dataset.uid));
            b.disabled = busy || !card || !TinyRun.canPlay(fight, card);
        });
        refs.end.disabled = busy;
    };

    const addCards = (cards) => {
        cards.forEach((card, i) => {
            const b = el('button', 'card-button');
            b.type = 'button';
            b.dataset.uid = String(card.uid);
            b.style.setProperty('--n', String(i));
            b.append(cardFace(card.id));
            const def = CARDS[card.id];
            b.setAttribute('aria-label', `${def.name}, costs ${def.cost} energy: ${def.text}`);
            b.addEventListener('click', () => onPlay(card.uid, b));
            refs.hand.append(b);
        });
        fanHand();
    };

    // A gentle fan: outer cards tilt and dip a little.
    const fanHand = () => {
        const buttons = [...refs.hand.querySelectorAll('.card-button:not(.is-played)')];
        const mid = (buttons.length - 1) / 2;
        buttons.forEach((b, i) => {
            const offset = i - mid;
            b.style.setProperty('--fan', `${offset * 2.5}deg`);
            b.style.setProperty('--dip', `${Math.abs(offset) * 4}px`);
        });
    };

    const float = (panel, text, tone) => {
        const node = el('span', `float${tone ? ` float--${tone}` : ''}`, text);
        node.style.setProperty('--x', `${Math.round(Math.random() * 40 - 20)}px`);
        node.addEventListener('animationend', () => node.remove());
        panel.floats.append(node);
    };

    const shake = (panel) => {
        panel.panel.classList.remove('is-hit');
        void panel.panel.offsetWidth; // restart the animation
        panel.panel.classList.add('is-hit');
    };

    const log = (text) => { refs.log.textContent = text; };

    const showEvents = async (events) => {
        for (const event of events) {
            const target = event.target === 'enemy' ? refs.enemy : refs.player;
            switch (event.kind) {
                case 'hit':
                    if (event.taken > 0) { shake(target); float(target, `−${event.taken}`, 'hit'); }
                    if (event.blocked > 0) float(target, `${event.blocked} blocked`, 'block');
                    log(event.target === 'enemy'
                        ? `You hit ${fight.enemy.def.name} for ${event.amount}${event.blocked ? ` (${event.blocked} blocked)` : ''}.`
                        : `${fight.enemy.def.name} hits you for ${event.amount}${event.blocked ? ` (${event.blocked} blocked)` : ''}.`);
                    renderStatus();
                    await wait(260);
                    break;
                case 'block':
                    float(target, `+${event.amount} block`, 'block');
                    break;
                case 'strength':
                    float(target, `+${event.amount} strength`, 'buff');
                    break;
                case 'energy':
                    float(refs.player, `+${event.amount} energy`, 'buff');
                    break;
                case 'heal':
                    float(refs.player, `+${event.amount} HP`, 'buff');
                    break;
                case 'mark':
                    float(refs.enemy, 'marked', 'buff');
                    break;
                case 'draw':
                case 'newHand':
                    addCards(event.cards);
                    break;
                default:
                    break;
            }
        }
        renderStatus();
    };

    async function onPlay(cardUid, b) {
        if (busy) return;
        const card = fight.hand.find(c => c.uid === cardUid);
        if (!card || !TinyRun.canPlay(fight, card)) return;

        busy = true;
        b.classList.add('is-played');
        b.disabled = true;
        fanHand();
        const events = TinyRun.playCard(run, fight, cardUid);
        log(`You play ${CARDS[card.id].name}.`);
        await showEvents(events);
        setTimeout(() => b.remove(), 400);
        busy = false;
        renderStatus();

        if (fight.over === 'won') {
            refs.enemy.panel.classList.add('is-defeated');
            log(`${fight.enemy.def.name} is defeated.`);
            await wait(900);
            if (run.floor === ENEMIES.length - 1) showEnd(true);
            else showReward();
        }
    }

    async function onEndTurn() {
        if (busy || fight.over) return;
        busy = true;
        refs.hand.querySelectorAll('.card-button').forEach(b => b.classList.add('is-discarded'));
        renderStatus();
        await wait(350);
        refs.hand.replaceChildren();
        log(`${fight.enemy.def.name} acts.`);
        await wait(300);
        const events = TinyRun.endTurn(run, fight);
        busy = false;
        await showEvents(events);
        if (fight.over === 'lost') {
            await wait(700);
            showEnd(false);
            return;
        }
        log('Your turn.');
    }

    function startRun() {
        run = TinyRun.createRun();
        fight = TinyRun.startFight(run);
        buildFight();
        refs.hand.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
    }

    function nextFloor(cardId) {
        TinyRun.advance(run, cardId);
        fight = TinyRun.startFight(run);
        buildFight();
    }

    showTitle();
});
