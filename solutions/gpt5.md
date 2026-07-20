## 1. Assumptions

1. A banking decision occurs only **after a completed roll**, so the current pot (P) is immediately bankable.
2. From roll four onward, the next-roll probabilities are:

   * Crash on 7: (6/36=1/6).
   * Double the pot: (6/36=1/6).
   * Add a non-7, non-double sum: (24/36=2/3).
3. (D) is measured **before banking the current pot**:
   [
   D=\text{your total score}-\text{highest opponent total score}.
   ]
4. Only the number (B) of opponents already banked is known, not their exact banked values. The formula therefore treats (B) as strategic information about how many opponents have secured the round, rather than pretending their scores are known.
5. Players are approximately rational and interested in maximizing win probability. The policy does not assume identical decisions, but it treats additional opponents as increasing the score needed to win.
6. Scores are measured in points. The constants below are calibrated around a typical strategically meaningful pot of approximately (100) points.
7. Because exact win probability depends on the complete score vector, opponent behavior, and banked-pot values, an exact optimal policy cannot be expressed using only (P,D,R,N,B,F). The dice-risk component below is mathematically derived; the tournament adjustments are explicit heuristics.

---

## 2. Unified formula

Define the effective tournament risk-aversion parameter

[
\boxed{
\lambda
=

\operatorname{clip}
\left[
\lambda_0
\sqrt{\frac{R}{5.5}}
\sqrt{\frac{2}{N}}
\exp\left(\frac{D}{100R}\right)
\exp\left(-\frac{B}{2(N-1)}\right)
\exp\left(F\left(\frac{D}{50}-0.7\right)\right),
;0.0002,;0.02
\right]
}
]

where

[
\boxed{
\lambda_0
=========

\frac{28}{100^2+\frac{133}{3}}
\approx 0.002788
}
]

and

[
\operatorname{clip}(x,a,b)=\min{\max{x,a},b}.
]

The banking threshold is

[
\boxed{
T
=

\sqrt{
\max\left(
0,;
\frac{28}{\lambda}-\frac{133}{3}
\right)
}
}
]

Thus the entire policy is:

[
\boxed{
T(D,R,N,B,F)
============

\sqrt{
\max\left[
0,;
\frac{28}{
\operatorname{clip}!\left(
\lambda_0
\sqrt{\frac{R}{5.5}}
\sqrt{\frac{2}{N}}
e^{D/(100R)}
e^{-B/[2(N-1)]}
e^{F(D/50-0.7)},
0.0002,
0.02
\right)}
-\frac{133}{3}
\right]
}
}
]

For a solo game, (N=1), the winning-probability objective is undefined because there are no opponents. The formula should therefore be used only for (N\ge2).

---

## 3. Banking decision rule

[
\boxed{\text{BANK if }P\ge T;\text{ otherwise CONTINUE.}}
]

At equality, bank. This convention avoids accepting additional risk when the risk-adjusted value of continuing is approximately zero.

---

## 4. Meaning of each term

### The core expression

[
T=\sqrt{\frac{28}{\lambda}-\frac{133}{3}}
]

comes from comparing banking now with taking one additional roll and then banking immediately if the round survives.

A larger (\lambda) means that losing the current pot is strategically expensive. Therefore:

* Larger (\lambda) produces a lower (T).
* Smaller (\lambda) produces a higher (T).

### Current pot (P)

(P) enters the final decision:

[
P\ge T.
]

It also enters the underlying risk calculation because the variance of one more roll contains a term proportional to (P^2). A large pot exposes the player to a large crash loss.

### Score difference (D)

[
\exp\left(\frac{D}{100R}\right)
]

raises (\lambda) when the player is ahead and lowers it when the player is behind.

* (D>0): protect the lead and bank earlier.
* (D<0): accept more variance and bank later.
* Division by (R) prevents a modest early-game deficit from producing excessive desperation.

A (100)-point lead with five rounds remaining multiplies (\lambda) by

[
e^{100/(100\cdot5)}=e^{0.2}\approx1.221,
]

reducing the threshold by roughly 10%.

### Rounds remaining (R)

[
\sqrt{\frac{R}{5.5}}
]

makes the player more conservative when many future rounds remain.

* Large (R): many future recovery opportunities, so there is less reason to risk an already valuable pot.
* Small (R): fewer future opportunities, so more current-round variance is justified.

The square root is used rather than a linear factor because the uncertainty in a sum of approximately independent future-round scores grows roughly as (\sqrt R), not (R).

The reference value (5.5) is the average value of (R) over a ten-round game:

[
\frac{1+2+\cdots+10}{10}=5.5.
]

### Number of players (N)

[
\sqrt{\frac{2}{N}}
]

lowers (\lambda) as the field gets larger.

Winning against many opponents generally requires reaching a higher upper tail of the score distribution. A strategy that is adequate against one opponent may finish second or third in a larger field. Thus a larger field calls for more variance.

The factor equals (1) in a two-player game and declines approximately as (1/\sqrt N), consistent with a moderate rather than explosive field-size effect.

### Opponents already banked (B)

[
\exp\left(-\frac{B}{2(N-1)}\right)
]

lowers (\lambda), and therefore raises (T), when more opponents have secured a score in the current round.

This reflects two effects:

1. Their current-round points can no longer be erased by a later 7.
2. Continuing gives the player an opportunity to exceed their locked-in result.

The ratio

[
\frac{B}{N-1}
]

is the fraction of opponents already safe. The coefficient (1/2) makes the maximum adjustment moderate. If every opponent has banked, the multiplier is

[
e^{-1/2}\approx0.607,
]

which raises the threshold substantially without making continued play automatic.

### Final-round indicator (F)

[
\exp\left(F\left(\frac{D}{50}-0.7\right)\right)
]

has no effect outside the final round because (F=0).

In the final round:

* The (-0.7) term lowers (\lambda), encouraging more risk because no later rounds remain.
* The (D/50) term makes the response to the score position much sharper.

For example:

* Tied, (D=0):
  [
  e^{-0.7}\approx0.497,
  ]
  so the threshold rises strongly.
* Ahead by 100:
  [
  e^{100/50-0.7}=e^{1.3}\approx3.67,
  ]
  so the player protects the lead.
* Behind by 100:
  [
  e^{-100/50-0.7}=e^{-2.7}\approx0.067,
  ]
  so the player becomes extremely risk-seeking.

### Clipping

[
0.0002\le\lambda\le0.02
]

prevents pathological outputs.

Without clipping, a very large deficit could make (T) effectively infinite, while a huge lead could make the square-root expression negative. The chosen range corresponds approximately to thresholds between:

[
T_{\min}=0
]

and

[
T_{\max}
========

\sqrt{\frac{28}{0.0002}-\frac{133}{3}}
\approx374.
]

---

## 5. Mathematical derivation

### Step 1: Model one more roll

Suppose the player can bank (P) now.

If the player instead takes one additional roll and banks immediately after any non-crashing outcome, define (X) as the change relative to banking now.

Then:

* Roll 7, probability (1/6):
  [
  X=-P.
  ]
* Roll doubles, probability (1/6):
  the pot becomes (2P), so
  [
  X=+P.
  ]
* Other roll with sum (s), probability (1/36) for each applicable dice outcome:
  [
  X=s.
  ]

### Step 2: Calculate the mean gain

Across all 36 ordered dice outcomes, the total of all dice sums is

[
36\cdot7=252.
]

The six outcomes totaling 7 contribute

[
6\cdot7=42.
]

The six doubles contribute

[
2+4+6+8+10+12=42.
]

Therefore the 24 ordinary outcomes contribute

[
252-42-42=168.
]

The expected change from one more roll is

[
\begin{aligned}
E[X]
&=
\frac16(-P)
+\frac16(P)
+\frac{168}{36}\
&=\frac{14}{3}\
&\approx4.667.
\end{aligned}
]

The (-P) crash loss and (+P) doubling gain cancel in expectation.

This produces an important result:

[
\boxed{E[X]=14/3\text{ for every }P.}
]

Pure expected-value maximization therefore does not yield a finite banking threshold. Every additional roll has a positive expected increment, even for an enormous pot.

This happens because extremely rare sequences containing multiple doubles create a heavy upper tail. The round nevertheless crashes eventually with probability one if play continues indefinitely.

### Step 3: Calculate the variance

The squared sums of the 24 ordinary outcomes total

[
1316.
]

Thus

[
E[X^2]
======

# \frac16P^2+\frac16P^2+\frac{1316}{36}

\frac{P^2}{3}+\frac{329}{9}.
]

Since

[
E[X]^2=\left(\frac{14}{3}\right)^2=\frac{196}{9},
]

the variance is

[
\begin{aligned}
\operatorname{Var}(X)
&=
\frac{P^2}{3}
+\frac{329}{9}
-\frac{196}{9}\
&=
\boxed{\frac{P^2}{3}+\frac{133}{9}}.
\end{aligned}
]

The dominant risk term is (P^2/3). Risk therefore rises quadratically with the size of the bankable pot.

### Step 4: Convert win-probability concerns into a risk penalty

Locally approximate the strategic value of one more roll with a mean-variance certainty equivalent:

[
CE(X)
\approx
E[X]-\frac{\lambda}{2}\operatorname{Var}(X).
]

This approximation follows from a second-order Taylor expansion of expected utility. It is also the local certainty equivalent under exponential utility.

Substituting the exact mean and variance gives

[
CE(X)
=====

## \frac{14}{3}

\frac{\lambda}{2}
\left(
\frac{P^2}{3}+\frac{133}{9}
\right).
]

Continue when the risk-adjusted value is positive:

[
\frac{14}{3}

>

\frac{\lambda}{2}
\left(
\frac{P^2}{3}+\frac{133}{9}
\right).
]

At the banking threshold, set the two sides equal:

[
\frac{14}{3}
============

\frac{\lambda}{2}
\left(
\frac{T^2}{3}+\frac{133}{9}
\right).
]

Multiply by (2):

[
\frac{28}{3}
============

\lambda
\left(
\frac{T^2}{3}+\frac{133}{9}
\right).
]

Multiply by (3/\lambda):

[
\frac{28}{\lambda}
==================

T^2+\frac{133}{3}.
]

Therefore

[
\boxed{
T^2=\frac{28}{\lambda}-\frac{133}{3}
}
]

and

[
\boxed{
T=
\sqrt{
\max\left(0,\frac{28}{\lambda}-\frac{133}{3}\right)
}.
}
]

This portion is mathematically derived from the dice probabilities.

### Step 5: Calibrate the baseline

A neutral threshold of approximately (100) points is used as the center of the strategic model. Solving the derived equation for (\lambda) at (T=100):

[
100^2=\frac{28}{\lambda_0}-\frac{133}{3},
]

so

[
\lambda_0
=========

\frac{28}{100^2+133/3}
\approx0.002788.
]

Why use 100?

The first three safe rolls add an expected

[
3\left[
\frac16(70)+\frac{210}{36}
\right]
= 3(17.5)

52.5
]

points.

Thus a (100)-point pot is approximately twice the expected pot after the mandatory safe portion of the round. It represents a substantial but routinely reachable round score.

The choice of (100), unlike the (28) and (133/3) terms, is a heuristic calibration. A different risk preference could use another neutral threshold (T_0), replacing (\lambda_0) with

[
\lambda_0=\frac{28}{T_0^2+133/3}.
]

### Mathematically derived components

The following are exact under the one-more-roll approximation:

[
\Pr(7)=\frac16,
\qquad
\Pr(\text{double})=\frac16,
]

[
E[X]=\frac{14}{3},
]

[
\operatorname{Var}(X)=\frac{P^2}{3}+\frac{133}{9},
]

and

[
T=\sqrt{\frac{28}{\lambda}-\frac{133}{3}}.
]

### Heuristic components

The following encode tournament strategy but are not exact consequences of the dice distribution:

[
\sqrt{\frac{R}{5.5}},
\quad
\sqrt{\frac{2}{N}},
\quad
e^{D/(100R)},
\quad
e^{-B/[2(N-1)]},
\quad
e^{F(D/50-0.7)},
]

as well as the neutral (100)-point calibration and the clipping range.

They are analytically motivated approximations to how win-probability utility changes with game state.

---

## 6. Scenario results table

Values are rounded to the nearest point.

| Situation                          |  (D) | (R) | (N) | (B) | (F) | Threshold (T) | Decision at (P=120) |
| ---------------------------------- | ---: | --: | --: | --: | --: | ------------: | ------------------- |
| Midgame, tied, four players        |    0 |   5 |   4 |   0 |   0 |           122 | Continue            |
| Midgame, ahead by 100              |  100 |   5 |   4 |   0 |   0 |           110 | Bank                |
| Midgame, behind by 100             | -100 |   5 |   4 |   0 |   0 |           135 | Continue            |
| Midgame, two opponents banked      |    0 |   5 |   4 |   2 |   0 |           144 | Continue            |
| Midgame, eight-player field        |    0 |   5 |   8 |   0 |   0 |           145 | Continue            |
| First round, two-player game, tied |    0 |  10 |   2 |   0 |   0 |            86 | Bank                |
| Final round, tied                  |    0 |   1 |   4 |   0 |   1 |           259 | Continue            |
| Final round, ahead by 100          |  100 |   1 |   4 |   0 |   1 |            57 | Bank                |
| Final round, behind by 100         | -100 |   1 |   4 |   0 |   1 |           374 | Continue            |

The final-round tied threshold is intentionally high. When tied entering the last round, banking an ordinary pot may not create enough separation to win, especially while several opponents remain active.

The final-round 100-point lead produces the opposite behavior: a modest bankable pot is valuable because preserving the lead is more important than increasing expected score.

---

## 7. Manual calculation procedure

Suppose:

[
P=130,\quad D=-50,\quad R=4,\quad N=5,\quad B=1,\quad F=0.
]

### Step 1: Start with the baseline

[
\lambda_0\approx0.002788.
]

### Step 2: Remaining-round factor

[
\sqrt{\frac{4}{5.5}}
\approx0.853.
]

### Step 3: Player-count factor

[
\sqrt{\frac{2}{5}}
\approx0.632.
]

### Step 4: Score-position factor

[
e^{D/(100R)}
============

# e^{-50/400}

e^{-0.125}
\approx0.882.
]

### Step 5: Already-banked-opponent factor

There are (N-1=4) opponents:

[
e^{-B/[2(N-1)]}
===============

e^{-1/8}
\approx0.882.
]

### Step 6: Final-round factor

Since (F=0),

[
e^{F(D/50-0.7)}=1.
]

### Step 7: Calculate (\lambda)

[
\begin{aligned}
\lambda
&=
0.002788
(0.853)
(0.632)
(0.882)
(0.882)\
&\approx0.00117.
\end{aligned}
]

This lies within the clipping range.

### Step 8: Calculate (T)

[
T
=

\sqrt{
\frac{28}{0.00117}-\frac{133}{3}
}.
]

Approximately,

[
\frac{28}{0.00117}\approx23{,}932,
]

so

[
T\approx\sqrt{23{,}932-44.33}
\approx\sqrt{23{,}888}
\approx155.
]

### Step 9: Compare (P) with (T)

[
P=130<155=T.
]

Therefore:

[
\boxed{\text{CONTINUE}.}
]

---

## 8. Weaknesses and edge cases

### Only the highest opponent is represented in (D)

A single (D) cannot distinguish between:

* one opponent ahead by 20 and everyone else far behind, and
* six opponents clustered within 20 points.

Those positions have different true win probabilities. (N) partly compensates, but cannot recover the full score distribution.

### Exact banked amounts are absent

Knowing only (B) does not reveal whether those opponents banked at 40 or 400. The formula assumes that more banked opponents generally increase the need for upside. A stronger model would include the maximum and average amounts banked by opponents during the current round.

### Simultaneous banking creates strategic interaction

If several active players can bank the same (P), banking may preserve relative position rather than improve it. Conversely, continuing after opponents bank can create a unique opportunity for separation. An exact equilibrium would require:

* turn timing,
* observation rules,
* opponent thresholds,
* tie-breaking rules,
* all current scores.

### One-more-roll approximation

The exact derivation compares:

* bank now, versus
* roll once more and then bank after survival.

In real play, the player may continue for several rolls. The formula approximates that multi-step option through repeated application after every roll. This is similar to a receding-horizon policy, but it is not the exact Bellman solution.

### Heavy-tailed expected value

Because doubles multiply the pot, expected score is dominated by rare, very large outcomes. This makes ordinary expected-value optimization inappropriate. The mean-variance approximation controls that problem, but variance alone does not fully describe the extreme tail.

### Final-round thresholds can be extreme

A badly trailing player may receive the clipped maximum threshold of approximately 374. In reality, a sufficiently large deficit might require continuing regardless of pot size unless the pot already mathematically secures victory.

Conversely, when banking would guarantee victory under known opponent scores, the correct action is immediately to bank even if the formula’s threshold is slightly higher.

A mechanical override is therefore justified:

[
\boxed{
\text{If banking }P\text{ guarantees first place regardless of all remaining actions, BANK.}
}
]

This override requires more information than (P,D,R,N,B,F), so it is not included in the main threshold.

### Ties are not specified

The policy assumes that a tie is materially worse than a sole win. Different tie-breaking rules could change final-round behavior substantially.

### Coefficients are policy parameters, not universal constants

The exact dice-derived constants are:

[
28,\qquad \frac{133}{3}.
]

The constants (100,50,0.7,1/2), and the clipping bounds are heuristics. They create a coherent implementable policy with sensible comparative behavior, but they should not be mistaken for a uniquely optimal equilibrium solution.
