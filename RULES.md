# Bank It Rules for an LLM

## Objective

Finish 10 rounds with the highest personal score. Tied highest scores share first place.

## State You Need

- Current round: 1–10
- Current roll number within the round
- Shared pot value
- Every player’s personal score
- Active players who have not BANKed this round
- Current roller

## Round Setup

- The shared pot starts at 0.
- Every player starts active, including players who BANKed in an earlier round.
- The starting player rotates one seat clockwise each round.
- Play uses two fair six-sided dice.

## Resolving a Roll

For rolls 1–3, the roll is safe and no player may BANK yet:

- Total of 7: add 70 to the pot.
- Any other total: add the dice total to the pot.
- Doubles have no special effect; add only their total.

Starting with roll 4, the roll is dangerous:

- Total of 7: the round ends immediately. Active players gain nothing from the pot.
- Doubles other than 7: double the entire current pot. Do not also add the dice total.
- Any other roll: add the dice total to the pot.

## Decision Checkpoints

A decision checkpoint occurs after roll 3 and after every later non-busting roll.

Each active player independently chooses one action using the same current state:

- `BANK`: add the current pot to that player’s personal score, then remove that player from the rest of the round.
- `STAY`: score nothing now and remain active.

A player who BANKs cannot roll or make another decision until the next round. Banked points are permanent and are not lost if the round later busts.

After decisions resolve, the next active player clockwise rolls.

## Ending Conditions

- The round ends when a dangerous 7 is rolled or every player has BANKed.
- After round 10 ends, the player or players with the highest personal score win.

## Required LLM Output

When asked for a decision, return exactly one legal action: `BANK` or `STAY`.
