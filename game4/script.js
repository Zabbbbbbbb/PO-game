
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    getColor() {
        return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
    }

    getHTML() {
        const card = document.createElement('div');
        card.classList.add('card', this.getColor(), 'card-animate');
        card.innerHTML = `
            <div class="card-top-left">${this.value}<div>${this.suit}</div></div>
            <div class="card-center">${this.suit}</div>
            <div class="card-bottom-right">${this.value}<div>${this.suit}</div></div>
        `;
        return card;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let suit of SUITS) {
            for (let value of VALUES) {
                this.cards.push(new Card(suit, value));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
}

class PokerGame {
    constructor() {
        this.deck = new Deck();
        // Players array: 0=User, 1=Left, 2=Top, 3=Right
        this.players = [
            { id: 'user', name: 'You', chips: 1000, hand: [], currentBet: 0, folded: false, isBot: false },
            { id: 'cpu2', name: 'Bot Lefty', chips: 1000, hand: [], currentBet: 0, folded: false, isBot: true },
            { id: 'cpu1', name: 'The House', chips: 1000, hand: [], currentBet: 0, folded: false, isBot: true },
            { id: 'cpu3', name: 'Bot Righty', chips: 1000, hand: [], currentBet: 0, folded: false, isBot: true }
        ];

        this.communityCards = [];
        this.pot = 0;
        this.stage = 0; // 0: Pre, 1: Flop, 2: Turn, 3: River
        this.dealerIdx = 0;
        this.activePlayerIdx = 0;
        this.highestBet = 0;

        // DOM Elements
        this.ui = {
            community: document.getElementById('community-area'),
            pot: document.getElementById('pot-amount'),
            msg: document.getElementById('message-area'),
            btns: {
                fold: document.getElementById('btn-fold'),
                check: document.getElementById('btn-check'),
                call: document.getElementById('btn-call'),
                raise: document.getElementById('btn-raise'),
                deal: document.getElementById('btn-deal')
            }
        };

        this.updateChipsUI();
        this.startRound();
    }

    get activePlayer() {
        return this.players[this.activePlayerIdx];
    }

    startRound() {
        if (this.players[0].chips <= 0) {
            this.ui.msg.innerText = "Game Over! You're broke.";
            return;
        }

        this.deck.reset();
        this.players.forEach(p => {
            p.hand = [];
            p.folded = false;
            p.currentBet = 0;
        });

        this.communityCards = [];
        this.pot = 0;
        this.stage = 0;
        this.highestBet = 0; // Reset highest bet for new round

        // Rotate dealer
        this.dealerIdx = (this.dealerIdx + 1) % 4;
        // First to act is player after dealer (simplified for now)
        this.activePlayerIdx = (this.dealerIdx + 1) % 4;

        this.clearUI();
        this.ui.msg.innerText = "Dealing cards...";

        // Deal logic (simple loop)
        for (let i = 0; i < 2; i++) {
            this.players.forEach(p => {
                const card = this.deck.deal();
                p.hand.push(card);
                this.renderCard(p, card);
            });
        }

        // Put dealer buttons
        document.querySelectorAll('.dealer-btn').forEach(el => el.style.display = 'none');
        document.getElementById(`dealer-${this.players[this.dealerIdx].id}`).style.display = 'flex';

        this.updateChipsUI();
        this.startTurn();
    }

    renderCard(player, card, reveal = false) {
        const handEl = document.getElementById(`hand-${player.id}`);
        // Only show user cards or if specific reveal flag is true
        const isFaceUp = !player.isBot || reveal;

        if (isFaceUp) {
            handEl.appendChild(card.getHTML());
        } else {
            handEl.appendChild(this.createBackCard());
        }
    }

    createBackCard() {
        const card = document.createElement('div');
        card.classList.add('card', 'card-animate');
        card.style.background = `repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)`;
        card.style.border = '2px solid white';
        return card;
    }

    clearUI() {
        document.querySelectorAll('.player-hand').forEach(el => el.innerHTML = '');
        document.querySelectorAll('.card-slot').forEach(el => el.innerHTML = '');
        this.ui.btns.deal.style.display = 'none';
        this.ui.btns.fold.style.display = 'inline-block'; // Show buttons initially
        this.ui.btns.check.style.display = 'inline-block';
        this.ui.btns.call.style.display = 'inline-block';
        this.ui.btns.raise.style.display = 'inline-block';
    }

    startTurn() {
        this.updateControls();

        // Count active players
        const activeCount = this.players.filter(p => !p.folded).length;
        if (activeCount === 1) {
            this.endHand(); // Everyone else folded
            return;
        }

        // Check if round is complete (everyone matched bets)
        // Basic check: if all active players have bet equal to highestBet (and highestBet > 0 or everyone checked)
        // This is complex, simplified logic:
        // We need a way to track if everyone has acted this street.
        // For this demo: we just cycle turns until USER acts or folds, simulating flow.

        if (this.activePlayer.isBot) {
            setTimeout(() => this.playBotTurn(), 800);
        } else {
            this.ui.msg.innerText = "Your action...";
            // Controls already updated
        }
    }

    updateControls() {
        // Only enable if user's turn
        const isUserTurn = !this.players[0].folded && this.activePlayerIdx === 0;

        this.ui.btns.fold.disabled = !isUserTurn;
        this.ui.btns.check.disabled = !isUserTurn;
        this.ui.btns.call.disabled = !isUserTurn;
        this.ui.btns.raise.disabled = !isUserTurn;

        // Visual feedback based on game state
        // Can only check if currentBet == highestBet
        const callAmount = this.highestBet - this.players[0].currentBet;

        if (callAmount > 0) {
            this.ui.btns.check.style.display = 'none';
            this.ui.btns.call.style.display = 'inline-block';
            this.ui.btns.call.innerText = `Call $${callAmount}`;
        } else {
            this.ui.btns.check.style.display = 'inline-block';
            this.ui.btns.call.style.display = 'none';
        }
    }

    nextPlayer() {
        let loops = 0;
        do {
            this.activePlayerIdx = (this.activePlayerIdx + 1) % 4;
            loops++;
        } while (this.activePlayer.folded && loops < 4);

        // Check if betting round is over
        // Simplified: If we return to the player who started the aggressive action or everyone checked
        // For this demo, we will use a global "actions taken" counter or similar?
        // Let's rely on a simpler 'has everyone matched?' check at start of turn

        if (this.isStreetComplete()) {
            this.advanceStage();
            return;
        }

        this.startTurn();
    }

    isStreetComplete() {
        const activePlayers = this.players.filter(p => !p.folded);
        if (activePlayers.length <= 1) return true;

        // Check if all active players have matched the highest bet
        // AND everyone has had a chance to act? (hard to track in simple model)
        // Hack: We assume street ends when it returns to dealer/first player AND bets match
        // Let's just advance if everyone matches logic is met, but we need to ensure at least one pass.
        // Actually, for a visual demo, let's force 1 round of betting per street.

        const allMatched = activePlayers.every(p => p.currentBet === this.highestBet);
        // If everyone matched and we are back to base player... this is getting complex for a 100 line script.
        // Simplified flow: 
        // 1. User acts.
        // 2. Bots act.
        // 3. If no one raised, street ends. 
        // 4. If someone raised, loop continues until everyone calls/folds.

        return allMatched && this.activePlayerIdx === (this.dealerIdx + 1) % 4 && this.highestBet === 0; // Very basic check-around
        // Improving:
    }

    advanceStage() {
        this.stage++;
        this.highestBet = 0;
        this.players.forEach(p => p.currentBet = 0);

        // Reset turn to first active after dealer
        let nextIdx = (this.dealerIdx + 1) % 4;
        while (this.players[nextIdx].folded) nextIdx = (nextIdx + 1) % 4;
        this.activePlayerIdx = nextIdx;

        if (this.stage === 1) this.dealCommunity(3);
        else if (this.stage === 2 || this.stage === 3) this.dealCommunity(1);
        else if (this.stage === 4) {
            this.endHand();
            return;
        }

        this.ui.msg.innerText = "Next street...";
        this.startTurn();
    }

    dealCommunity(n) {
        for (let i = 0; i < n; i++) {
            const card = this.deck.deal();
            this.communityCards.push(card);
            const slot = document.querySelectorAll('.card-slot')[this.communityCards.length - 1];
            if (slot) slot.appendChild(card.getHTML());
        }
    }

    // --- Player Actions ---

    fold() {
        this.activePlayer.folded = true;
        this.ui.msg.innerText = `${this.activePlayer.name} Folded.`;
        this.checkWinCondition(); // Check if only 1 remains immediately
        if (this.stage !== 4) this.nextPlayer(); // Don't next if game ended
    }

    check() {
        this.ui.msg.innerText = `${this.activePlayer.name} Checked.`;

        // If it's the last player and everyone checked, advance
        // Basic counter handling:
        this.handleActionEnd();
    }

    call() {
        const amount = this.highestBet - this.activePlayer.currentBet;
        if (this.activePlayer.chips >= amount) {
            this.activePlayer.chips -= amount;
            this.activePlayer.currentBet += amount;
            this.pot += amount;
            this.ui.msg.innerText = `${this.activePlayer.name} Called $${amount}.`;
            this.updateChipsUI();
            this.handleActionEnd();
        }
    }

    raise() {
        const raiseAmt = 50;
        const totalBet = this.highestBet + raiseAmt;
        const added = totalBet - this.activePlayer.currentBet;

        if (this.activePlayer.chips >= added) {
            this.activePlayer.chips -= added;
            this.activePlayer.currentBet += added;
            this.pot += added;
            this.highestBet = totalBet;

            this.ui.msg.innerText = `${this.activePlayer.name} Raised to $${totalBet}!`;
            this.updateChipsUI();

            // Raising resets the "round complete" logic, everyone must call again
            this.handleActionEnd();
        }
    }

    handleActionEnd() {
        // If only 1 player left:
        if (this.players.filter(p => !p.folded).length === 1) {
            this.endHand();
            return;
        }

        // Logic to determine if we move to next player or next street
        // For this demo: assume fixed turns for simplicity unless raised?
        // Better: Simply go to next player. If next player matches highest bet and is the 'stopper', advance.

        // Define a "stopper": when a raise happens, the raiser becomes the new start of the "cycle".
        // If we get back to the raiser (or everyone called him), we advance.
        // Visual Demo Logic: Just verify if everyone matches highest bet.

        const active = this.players.filter(p => !p.folded);
        const allMatched = active.every(p => p.currentBet === this.highestBet);

        // If everyone checked (highestBet 0) and we looked at everyone?
        // This is hard to perfect in one-shot code without state machine.
        // Hack: Just always go nextPlayer logic.

        // Custom simple logic:
        // If current player was the last one needed to act:
        // (This happens if player closes the betting action)

        // We will just call NextPlayer. The NextPlayer check should see if we need new street?

        // Let's verify street transition inside nextPlayer() strictly based on:
        // Have all active players acted at least once AND are bets equal?
        // We need a 'hasActed' flag per street.

        this.activePlayer.hasActed = true;

        const everyoneMatched = this.players.filter(p => !p.folded).every(p => p.currentBet === this.highestBet);
        const everyoneActed = this.players.filter(p => !p.folded).every(p => p.hasActed);

        if (everyoneMatched && everyoneActed) {
            setTimeout(() => {
                this.players.forEach(p => p.hasActed = false); // Reset for next street
                this.advanceStage();
            }, 600);
        } else {
            this.nextPlayer();
        }
    }

    playBotTurn() {
        const p = this.activePlayer;
        // Simple AI
        const diff = this.highestBet - p.currentBet;
        const rand = Math.random();

        // AI Logic
        if (diff > 0) {
            // Need to call or raise
            if (rand > 0.8) { // 20% Raise
                this.raise();
            } else if (rand > 0.3) { // 50% Call
                this.call();
            } else { // 30% Fold
                this.fold();
            }
        } else {
            // Can check or raise
            if (rand > 0.9) {
                this.raise();
            } else {
                this.check();
            }
        }
    }

    checkWinCondition() {
        const active = this.players.filter(p => !p.folded);
        if (active.length === 1) {
            // Winner by default
            this.endHand();
        }
    }

    endHand() {
        this.stage = 4; // Showdown state effectively

        const active = this.players.filter(p => !p.folded);
        let winner = null;

        if (active.length === 1) {
            winner = active[0];
            this.ui.msg.innerText = `${winner.name} Wins (Everyone else folded)!`;
        } else {
            // Evaluate
            const scores = active.map(p => {
                return { player: p, score: this.evaluateHand(p.hand, this.communityCards) };
            });
            scores.sort((a, b) => b.score - a.score);
            winner = scores[0].player;
            this.ui.msg.innerText = `${winner.name} Wins with better hand!`;

            // Show cards
            this.players.forEach(p => {
                if (p.isBot && !p.folded) {
                    const handEl = document.getElementById(`hand-${p.id}`);
                    handEl.innerHTML = '';
                    p.hand.forEach(c => handEl.appendChild(c.getHTML()));
                }
            });
        }

        winner.chips += this.pot;
        // Highlight winner

        this.updateChipsUI();
        this.ui.btns.fold.style.display = 'none';
        this.ui.btns.check.style.display = 'none';
        this.ui.btns.call.style.display = 'none';
        this.ui.btns.raise.style.display = 'none';
        this.ui.btns.deal.style.display = 'inline-block';
    }

    updateChipsUI() {
        this.players.forEach(p => {
            document.getElementById(`chip-count-${p.id}`).innerText = p.chips;
        });
        this.ui.pot.innerText = this.pot;
    }

    evaluateHand(hand, community) {
        // Dummy eval similar to before
        let score = 0;
        const allCards = [...hand, ...community];
        allCards.forEach(c => score += VALUES.indexOf(c.value));

        // Pair bonus
        const vals = allCards.map(c => c.value);
        const unique = new Set(vals);
        score += (vals.length - unique.size) * 20;

        return score + Math.random();
    }
}

// Start
const game = new PokerGame();
