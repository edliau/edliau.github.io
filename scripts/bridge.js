// "deal me in.": deals a random 13-card bridge hand and suggests an opening bid
// using simplified Standard American rules.
const SUITS = [
    { key: 'S', symbol: '♠', name: 'spades' },
    { key: 'H', symbol: '♥', name: 'hearts' },
    { key: 'D', symbol: '♦', name: 'diamonds' },
    { key: 'C', symbol: '♣', name: 'clubs' },
];
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const HCP = { A: 4, K: 3, Q: 2, J: 1 };

function dealHand() {
    const deck = SUITS.flatMap(suit => RANKS.map(rank => ({ suit: suit.key, rank })));
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const hand = deck.slice(0, 13);
    return SUITS.map(suit => ({
        ...suit,
        cards: hand
            .filter(card => card.suit === suit.key)
            .map(card => card.rank)
            .sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b)),
    }));
}

function describeHand(suits) {
    const points = suits.flatMap(s => s.cards).reduce((sum, rank) => sum + (HCP[rank] || 0), 0);
    const lengths = Object.fromEntries(suits.map(s => [s.key, s.cards.length]));
    const sorted = Object.values(lengths).sort((a, b) => b - a);
    const balanced = sorted[3] >= 2 && sorted.filter(n => n === 2).length <= 1;
    return { points, lengths, sorted, balanced };
}

function suggestBid(suits) {
    const { points, lengths, sorted, balanced } = describeHand(suits);
    const symbol = key => SUITS.find(s => s.key === key).symbol;
    const shape = balanced ? 'balanced' : `${sorted.join('-')} shape`;
    const why = `${points} high-card ${points === 1 ? 'point' : 'points'}, ${shape}`;

    if (points >= 22) return { bid: '2♣', why: `${why}. Strong and artificial: partner, we're going places.` };
    if (balanced && points >= 20 && points <= 21) return { bid: '2NT', why: `${why}.` };
    if (balanced && points >= 15 && points <= 17) return { bid: '1NT', why: `${why}. Textbook.` };

    // Opening strength: 12+ points, or the Rule of 20 (points + two longest suits).
    if (points >= 12 || points + sorted[0] + sorted[1] >= 20) {
        if (lengths.S >= 5 || lengths.H >= 5) {
            const major = lengths.S >= lengths.H ? 'S' : 'H';
            return { bid: `1${symbol(major)}`, why: `${why}, with a five-card major.` };
        }
        let minor;
        if (lengths.D > lengths.C) minor = 'D';
        else if (lengths.C > lengths.D) minor = 'C';
        else minor = lengths.D >= 4 ? 'D' : 'C';
        return { bid: `1${symbol(minor)}`, why: `${why}, no five-card major.` };
    }

    // Weak hands with a long suit get in the way of the opponents.
    const longest = ['S', 'H', 'D', 'C'].find(k => lengths[k] === sorted[0]);
    if (points >= 5 && sorted[0] >= 7) {
        return { bid: `3${symbol(longest)}`, why: `${why}. A seven-card suit and not much else: pre-empt!` };
    }
    if (points >= 5 && points <= 10 && sorted[0] === 6 && longest !== 'C') {
        return { bid: `2${symbol(longest)}`, why: `${why}. A weak two, to make life awkward for the opponents.` };
    }

    return { bid: 'pass', why: `${why}. Sometimes the best bid is the quiet one.` };
}

document.addEventListener('DOMContentLoaded', () => {
    const handEl = document.getElementById('hand');
    const dealButton = document.getElementById('deal');
    const bidButton = document.getElementById('show-bid');
    const bidEl = document.getElementById('bid');
    if (!handEl || !dealButton || !bidButton || !bidEl) return;

    let current = null;

    const hideBid = () => {
        bidEl.hidden = true;
        bidButton.setAttribute('aria-expanded', 'false');
    };

    const render = () => {
        current = dealHand();
        hideBid();
        handEl.replaceChildren();
        let index = 0;

        current.forEach(suit => {
            const row = document.createElement('div');
            row.className = 'suit-row';

            const symbol = document.createElement('span');
            symbol.className = 'suit-row__symbol';
            symbol.textContent = suit.symbol;
            symbol.setAttribute('aria-label', suit.name);
            row.appendChild(symbol);

            const cards = document.createElement('span');
            cards.className = 'suit-row__cards';
            if (suit.cards.length === 0) {
                const voidMark = document.createElement('span');
                voidMark.className = 'suit-row__void';
                voidMark.textContent = 'void';
                cards.appendChild(voidMark);
            }
            suit.cards.forEach(rank => {
                const card = document.createElement('span');
                card.className = 'card';
                card.textContent = rank;
                card.style.setProperty('--n', String(index++));
                card.style.setProperty('--tilt', `${(Math.random() * 6 - 3).toFixed(1)}deg`);
                cards.appendChild(card);
            });
            row.appendChild(cards);
            handEl.appendChild(row);
        });
    };

    dealButton.addEventListener('click', render);

    bidButton.addEventListener('click', () => {
        if (!bidEl.hidden) return hideBid();
        const { bid, why } = suggestBid(current);
        bidEl.replaceChildren();
        const strong = document.createElement('strong');
        strong.className = 'hand__bid-call';
        strong.textContent = bid;
        bidEl.append(strong, document.createTextNode(` ${why}`));
        bidEl.hidden = false;
        bidButton.setAttribute('aria-expanded', 'true');
    });

    render();
});
