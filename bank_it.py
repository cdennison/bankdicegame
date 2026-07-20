#!/usr/bin/env python3
"""Monte Carlo tournament for the Bank (also called Bank It) dice game."""

from __future__ import annotations

import argparse
import itertools
import math
import random
from collections import defaultdict
from dataclasses import dataclass
from typing import Callable, Iterable, Sequence


@dataclass(frozen=True)
class GameView:
    """Everything a strategy is allowed to know when deciding whether to bank."""

    pot: int
    roll: int
    danger_rolls: int
    round_number: int
    rounds: int
    own_score: int
    opponent_scores: tuple[int, ...]
    active_opponents: int
    total_opponents: int
    last_roll_was_double: bool

    @property
    def leader_score(self) -> int:
        return max(self.opponent_scores, default=0)

    @property
    def rank(self) -> int:
        return 1 + sum(score > self.own_score for score in self.opponent_scores)

    @property
    def banked_opponents(self) -> int:
        return self.total_opponents - self.active_opponents


Decision = Callable[[GameView], bool]


@dataclass(frozen=True)
class Strategy:
    name: str
    description: str
    bank: Decision


def at_pot(amount: int) -> Decision:
    return lambda view: view.pot >= amount


def after_danger_rolls(amount: int) -> Decision:
    return lambda view: view.danger_rolls >= amount


def adaptive_200(lead_target: int, trailing_floor: int) -> Decision:
    """Build an adaptive policy with a 200 target when scores are tied."""

    def bank(view: GameView) -> bool:
        if view.own_score > view.leader_score:
            target = lead_target
        elif view.own_score == view.leader_score:
            target = 200
        else:
            gap = view.leader_score - view.own_score
            rounds_left = view.rounds - view.round_number + 1
            pressure = (gap + rounds_left - 1) // rounds_left
            target = min(400, max(trailing_floor, 200 + pressure))
            if view.banked_opponents:
                target = max(target, min(400, gap + 1))
            if view.round_number == view.rounds:
                target = max(target, gap + 1)
        return view.pot >= target

    return bank


def state_aware_target(view: GameView) -> int:
    """Compute a target from score margin, time remaining, and table size."""
    score_delta = view.own_score - view.leader_score
    if score_delta == 0:
        return 200

    rounds_left = view.rounds - view.round_number + 1
    # Normalize pressure to a four-player table. The same gap matters more when
    # more opponents have a chance to catch or outscore this player.
    player_pressure = math.sqrt(max(1, view.total_opponents) / 3)
    per_round_gap = abs(score_delta) / rounds_left
    adjustment = per_round_gap * player_pressure
    # Start from the empirically strong 150-leading / 300-trailing policy, then
    # vary continuously with the urgency of the actual score gap.
    raw_target = (
        150 - 0.25 * adjustment
        if score_delta > 0
        else 300 + 0.50 * adjustment
    )
    target = round(raw_target / 5) * 5
    target = max(100, min(400, target))

    if score_delta < 0 and view.banked_opponents:
        target = max(target, min(400, abs(score_delta) + 1))
    if score_delta < 0 and view.round_number == view.rounds:
        target = max(target, abs(score_delta) + 1)
    return target


def state_aware_200(view: GameView) -> bool:
    return view.pot >= state_aware_target(view)


def solution_4o_target(view: GameView) -> float:
    """Threshold proposed in solutions/40.md, implemented literally."""
    players = view.total_opponents + 1
    final_round = int(view.round_number == view.rounds)
    return (
        view.pot / 7
        + 10 * max(0, -view.own_score + view.leader_score) * final_round
        + 5 / (view.rounds - view.round_number + 1)
        * (1 - view.banked_opponents / players)
    )


def solution_gpt35_target(view: GameView) -> float:
    """Threshold proposed in solutions/gpt35.md, implemented literally."""
    score_delta = view.own_score - view.leader_score
    rounds_left = view.rounds - view.round_number + 1
    players = view.total_opponents + 1
    final_round = int(view.round_number == view.rounds)
    exponent = -0.1 * score_delta
    if exponent > 700:
        return math.inf
    return (
        140 / (rounds_left + 1)
        * (1 + math.exp(exponent))
        * (players - view.banked_opponents) / players
        * (1 + 0.5 * final_round)
    )


def solution_gpt5_target(view: GameView) -> float:
    """Mean-variance threshold proposed in solutions/gpt5.md."""
    score_delta = view.own_score - view.leader_score
    rounds_left = view.rounds - view.round_number + 1
    players = view.total_opponents + 1
    final_round = int(view.round_number == view.rounds)
    lambda_zero = 28 / (100**2 + 133 / 3)
    log_multiplier = (
        0.5 * math.log(rounds_left / 5.5)
        + 0.5 * math.log(2 / players)
        + score_delta / (100 * rounds_left)
        - view.banked_opponents / (2 * (players - 1))
        + final_round * (score_delta / 50 - 0.7)
    )
    if log_multiplier > 700:
        risk_aversion = 0.02
    elif log_multiplier < -700:
        risk_aversion = 0.0002
    else:
        risk_aversion = lambda_zero * math.exp(log_multiplier)
        risk_aversion = max(0.0002, min(0.02, risk_aversion))
    return math.sqrt(max(0, 28 / risk_aversion - 133 / 3))


def submitted_strategies() -> tuple[Strategy, ...]:
    """Policies extracted without modification from the files in solutions/."""
    return (
        Strategy("Solution 4o", "Literal formula from solutions/40.md.", lambda v: v.pot >= solution_4o_target(v)),
        Strategy(
            "Solution GPT-3.5",
            "Literal formula from solutions/gpt35.md.",
            lambda v: v.pot >= solution_gpt35_target(v),
        ),
        Strategy(
            "Solution GPT-5",
            "Literal formula from solutions/gpt5.md.",
            lambda v: v.pot >= solution_gpt5_target(v),
        ),
    )


def strategies() -> tuple[Strategy, ...]:
    """A varied field of threshold, timing, and opponent-aware policies."""

    def double_or_cap(view: GameView) -> bool:
        return view.last_roll_was_double or view.pot >= 250 or view.danger_rolls >= 8

    def protect_lead(view: GameView) -> bool:
        if view.own_score >= view.leader_score:
            return view.pot >= 60
        return view.pot >= 130

    def catch_up(view: GameView) -> bool:
        gap = max(0, view.leader_score - view.own_score)
        rounds_left = view.rounds - view.round_number + 1
        target = max(90, min(250, gap // rounds_left + 70))
        return view.pot >= target

    def adaptive(view: GameView) -> bool:
        # Protect a lead, take normal risk from the middle, and swing from behind.
        target = {1: 70, 2: 110, 3: 145}.get(view.rank, 185)
        if view.round_number == view.rounds and view.own_score < view.leader_score:
            target = max(target, view.leader_score - view.own_score + 1)
        return view.pot >= target

    return (
        Strategy("Safe Exit", "Bank immediately after the three safe rolls.", after_danger_rolls(0)),
        Strategy("Pot 60", "Bank when the shared pot reaches 60.", at_pot(60)),
        Strategy("Pot 80", "Bank when the shared pot reaches 80.", at_pot(80)),
        Strategy("Pot 100", "Bank when the shared pot reaches 100.", at_pot(100)),
        Strategy("Pot 125", "Bank when the shared pot reaches 125.", at_pot(125)),
        Strategy("Pot 150", "Bank when the shared pot reaches 150.", at_pot(150)),
        Strategy("Fixed Pot 200", "Always bank when the shared pot reaches 200.", at_pot(200)),
        Strategy(
            "Pot 211 Counter",
            "A tuned best-response threshold for a known Fixed Pot 200 opponent.",
            at_pot(211),
        ),
        Strategy(
            "Adaptive 150/200/300",
            "Lead: 150; tie: 200; trail: at least 300 plus score-gap pressure.",
            adaptive_200(lead_target=150, trailing_floor=300),
        ),
        Strategy(
            "State Delta",
            "Continuous target using score delta, rounds remaining, and player count.",
            state_aware_200,
        ),
        Strategy("One More", "Bank after one successful danger-zone roll.", after_danger_rolls(1)),
        Strategy("Three More", "Bank after three successful danger-zone rolls.", after_danger_rolls(3)),
        Strategy("Five More", "Bank after five successful danger-zone rolls.", after_danger_rolls(5)),
        Strategy("Double Hunter", "Wait for a danger double, with a 250/8-roll safety cap.", double_or_cap),
        Strategy("Protect Lead", "Use a 60 target while leading and 130 otherwise.", protect_lead),
        Strategy("Catch Up", "Scale the target to the score gap and rounds remaining.", catch_up),
        Strategy("Adaptive Rank", "Use targets of 70/110/145/185 based on current rank.", adaptive),
    )


@dataclass
class Result:
    appearances: int = 0
    outright_wins: int = 0
    win_share: float = 0.0
    points: int = 0


def play_game(
    field: Sequence[Strategy], rng: random.Random, rounds: int = 10
) -> list[int]:
    """Play one game and return final scores in the same order as ``field``."""
    player_count = len(field)
    scores = [0] * player_count
    first_roller = rng.randrange(player_count)

    for round_index in range(rounds):
        active = set(range(player_count))
        pot = 0
        roll_number = 0
        danger_rolls = 0
        next_player = (first_roller + round_index) % player_count

        while active:
            # Only active players roll; preserve the clockwise order.
            while next_player not in active:
                next_player = (next_player + 1) % player_count

            die_1, die_2 = rng.randint(1, 6), rng.randint(1, 6)
            roll_number += 1
            total = die_1 + die_2
            is_double = die_1 == die_2

            if roll_number <= 3:
                pot += 70 if total == 7 else total
            elif total == 7:
                break
            else:
                danger_rolls += 1
                pot = pot * 2 if is_double else pot + total

            # Nobody should bank before all three guaranteed-safe rolls are done.
            if roll_number >= 3:
                banking: list[int] = []
                for player in sorted(active):
                    opponents = tuple(scores[i] for i in range(player_count) if i != player)
                    view = GameView(
                        pot=pot,
                        roll=roll_number,
                        danger_rolls=danger_rolls,
                        round_number=round_index + 1,
                        rounds=rounds,
                        own_score=scores[player],
                        opponent_scores=opponents,
                        active_opponents=len(active) - 1,
                        total_opponents=player_count - 1,
                        last_roll_was_double=is_double and roll_number > 3,
                    )
                    if field[player].bank(view):
                        banking.append(player)
                for player in banking:
                    scores[player] += pot
                    active.remove(player)

            next_player = (next_player + 1) % player_count

    return scores


def groups_balanced(
    field: Sequence[Strategy], players: int, repeats: int, rng: random.Random
) -> Iterable[list[Strategy]]:
    """Yield every matchup equally often, with randomized seat positions."""
    for group in itertools.combinations(field, players):
        for _ in range(repeats):
            seated = list(group)
            rng.shuffle(seated)
            yield seated


def simulate(
    field: Sequence[Strategy], players: int, rounds: int, repeats: int, seed: int
) -> tuple[dict[str, Result], int]:
    rng = random.Random(seed)
    results: dict[str, Result] = defaultdict(Result)
    games = 0
    for matchup in groups_balanced(field, players, repeats, rng):
        scores = play_game(matchup, rng, rounds)
        high = max(scores)
        winners = [i for i, score in enumerate(scores) if score == high]
        games += 1
        for index, strategy in enumerate(matchup):
            result = results[strategy.name]
            result.appearances += 1
            result.points += scores[index]
            if index in winners:
                result.win_share += 1.0 / len(winners)
                if len(winners) == 1:
                    result.outright_wins += 1
    return results, games


def simulate_head_to_head(
    field: Sequence[Strategy], rounds: int, games_per_pair: int, seed: int
) -> list[list[float]]:
    """Return tie-adjusted row-strategy win rates for every two-player pairing."""
    rng = random.Random(seed)
    size = len(field)
    matrix = [[0.5 for _ in range(size)] for _ in range(size)]
    for left in range(size):
        for right in range(left + 1, size):
            left_win_share = 0.0
            for _ in range(games_per_pair):
                matchup = [field[left], field[right]]
                rng.shuffle(matchup)
                scores = play_game(matchup, rng, rounds)
                if scores[0] == scores[1]:
                    left_win_share += 0.5
                else:
                    winning_name = matchup[0].name if scores[0] > scores[1] else matchup[1].name
                    if winning_name == field[left].name:
                        left_win_share += 1.0
            rate = left_win_share / games_per_pair
            matrix[left][right] = rate
            matrix[right][left] = 1.0 - rate
    return matrix


def simulate_fixed_matchup(
    field: Sequence[Strategy], rounds: int, games: int, seed: int
) -> dict[str, Result]:
    """Repeat one exact strategy field with shuffled seats and tie-adjusted wins."""
    rng = random.Random(seed)
    results = {strategy.name: Result() for strategy in field}
    for _ in range(games):
        matchup = list(field)
        rng.shuffle(matchup)
        scores = play_game(matchup, rng, rounds)
        high = max(scores)
        winners = [index for index, score in enumerate(scores) if score == high]
        for index, strategy in enumerate(matchup):
            result = results[strategy.name]
            result.appearances += 1
            result.points += scores[index]
            if index in winners:
                result.win_share += 1 / len(winners)
                if len(winners) == 1:
                    result.outright_wins += 1
    return results


def evaluate_policy(
    candidate: Strategy,
    opponent_pool: Sequence[Strategy],
    rounds: int,
    games_per_matchup: int,
    rng: random.Random,
    opponents_per_game: int = 3,
) -> tuple[float, float, int]:
    """Evaluate one policy against balanced groups from a common opponent pool."""
    win_share = 0.0
    points = 0
    games = 0
    for opponents in itertools.combinations(opponent_pool, opponents_per_game):
        for _ in range(games_per_matchup):
            matchup = [candidate, *opponents]
            rng.shuffle(matchup)
            scores = play_game(matchup, rng, rounds)
            candidate_index = matchup.index(candidate)
            high = max(scores)
            winners = sum(score == high for score in scores)
            if scores[candidate_index] == high:
                win_share += 1.0 / winners
            points += scores[candidate_index]
            games += 1
    return win_share / games, points / games, games


def report_adaptive_analysis(field: Sequence[Strategy], args: argparse.Namespace) -> None:
    """Quantify how early to bank while leading and how far to push while trailing."""
    names = {
        "Pot 80", "Pot 100", "Pot 125", "Pot 150", "Pot 211 Counter",
        "Five More", "Double Hunter", "Adaptive Rank",
    }
    opponent_pool = tuple(strategy for strategy in field if strategy.name in names)
    rng = random.Random(args.seed)
    fixed = next(strategy for strategy in field if strategy.name == "Fixed Pot 200")
    baseline, baseline_score, games = evaluate_policy(
        fixed, opponent_pool, args.rounds, args.adaptive_games, rng
    )

    lead_targets = (100, 125, 150, 175, 200)
    trailing_floors = (200, 225, 250, 275, 300)
    outcomes: dict[tuple[int, int], tuple[float, float]] = {}
    for lead_target in lead_targets:
        for trailing_floor in trailing_floors:
            candidate = Strategy(
                f"Adaptive L{lead_target}/T{trailing_floor}",
                "",
                adaptive_200(lead_target, trailing_floor),
            )
            rate, score, _ = evaluate_policy(
                candidate, opponent_pool, args.rounds, args.adaptive_games, rng
            )
            outcomes[lead_target, trailing_floor] = (rate, score)

    print("BANK IT ADAPTIVE-POLICY SWEEP")
    print(
        f"{games:,} games/policy | 4 players | {args.rounds} rounds | seed {args.seed}"
    )
    print("All policies face the same balanced combinations from an 8-strategy pool.")
    print(f"Fixed Pot 200: {100 * baseline:.2f}% win rate | {baseline_score:.1f} avg score")
    print("\nCell = win rate; parenthesis = percentage-point change vs fixed Pot 200.")
    print("Lower lead targets mean MORE conservative play while leading.\n")
    print(f"{'Lead target':<12}" + "".join(f"Trail {target:>3}   " for target in trailing_floors))
    best = (-1.0, 0, 0, 0.0)
    for lead_target in lead_targets:
        cells = []
        for trailing_floor in trailing_floors:
            rate, score = outcomes[lead_target, trailing_floor]
            cells.append(f"{100 * rate:5.1f} ({100 * (rate - baseline):+5.1f})")
            best = max(best, (rate, lead_target, trailing_floor, score))
        print(f"{lead_target:<12}" + " ".join(cells))
    rate, lead_target, trailing_floor, score = best
    print(
        f"\nBest tested: lead {lead_target}, tie 200, trail floor {trailing_floor} "
        f"=> {100 * rate:.2f}% ({100 * (rate - baseline):+.2f} points), {score:.1f} avg score"
    )


def scenario_view(delta: int, round_number: int, rounds: int, players: int) -> GameView:
    """Construct a scenario where no opponent has banked in the current round."""
    if delta >= 0:
        own_score = 1000 + delta
        opponent_scores = (1000,) * (players - 1)
    else:
        own_score = 1000
        opponent_scores = (1000 - delta,) + (1000,) * (players - 2)
    return GameView(
        pot=0,
        roll=3,
        danger_rolls=0,
        round_number=round_number,
        rounds=rounds,
        own_score=own_score,
        opponent_scores=opponent_scores,
        active_opponents=players - 1,
        total_opponents=players - 1,
        last_roll_was_double=False,
    )


def report_policy_table(field: Sequence[Strategy], args: argparse.Namespace) -> None:
    """Print state-dependent targets and benchmark them across table sizes."""
    deltas = (-500, -200, 0, 200, 500)
    round_numbers = (2, 5, 8, 10)
    print("BANK IT STATE-DELTA POLICY")
    print("Target = pot value at which the policy banks; 10-round game.")
    print("Negative delta means trailing the leader; positive means leading.\n")
    for players in (2, 4, 6):
        print(f"{players} PLAYERS")
        print(f"{'Round':<7}" + "".join(f"{delta:+6d}" for delta in deltas))
        for round_number in round_numbers:
            targets = [
                state_aware_target(scenario_view(delta, round_number, 10, players))
                for delta in deltas
            ]
            print(f"{round_number:<7}" + "".join(f"{target:>6d}" for target in targets))
        print()

    names = {
        "Pot 80", "Pot 100", "Pot 125", "Pot 150", "Pot 211 Counter",
        "Five More", "Double Hunter", "Adaptive Rank",
    }
    opponent_pool = tuple(strategy for strategy in field if strategy.name in names)
    selected = {"Fixed Pot 200", "Adaptive 150/200/300", "State Delta"}
    policies = tuple(strategy for strategy in field if strategy.name in selected)
    print("BALANCED BENCHMARK WIN RATES")
    print(f"{'Policy':<24}{'2 players':>12}{'4 players':>12}{'6 players':>12}")
    policy_results: dict[str, list[float]] = {policy.name: [] for policy in policies}
    for players in (2, 4, 6):
        for policy_index, policy in enumerate(policies):
            rng = random.Random(args.seed + players * 100 + policy_index)
            rate, _, _ = evaluate_policy(
                policy,
                opponent_pool,
                args.rounds,
                args.policy_games,
                rng,
                opponents_per_game=players - 1,
            )
            policy_results[policy.name].append(rate)
    for policy in policies:
        rates = policy_results[policy.name]
        print(f"{policy.name:<24}" + "".join(f"{100 * rate:>11.2f}%" for rate in rates))


def report_solution_comparison(field: Sequence[Strategy], args: argparse.Namespace) -> None:
    """Compare submitted model formulas against the discovered State Delta policy."""
    submissions = submitted_strategies()
    state_delta = next(strategy for strategy in field if strategy.name == "State Delta")
    policies = (state_delta, *submissions)
    names = {
        "Pot 80", "Pot 100", "Pot 125", "Pot 150", "Pot 211 Counter",
        "Five More", "Double Hunter", "Adaptive Rank",
    }
    opponent_pool = tuple(strategy for strategy in field if strategy.name in names)

    print("SUBMITTED FORMULA COMPARISON")
    print("Formulas are implemented literally from the files in solutions/.\n")
    print("EXTRACTED FORMULAS")
    print("  Solution 4o:")
    print("    T = P/7 + 10·max(0,−D)·F + (5/R)·(1−B/N)")
    print("  Solution GPT-3.5:")
    print("    T = [140/(R+1)]·[1+exp(−0.1D)]·[(N−B)/N]·[1+0.5F]")
    print("  Solution GPT-5:")
    print("    λ = clip(λ₀√(R/5.5)√(2/N)e^(D/100R)e^(−B/2(N−1))e^[F(D/50−0.7)])")
    print("    T = √max(0, 28/λ − 133/3),  λ₀ = 28/(100²+133/3)\n")

    print("BALANCED BENCHMARK WIN RATES")
    print(
        f"{args.solution_games} games/opponent combination; every policy faces the same pool."
    )
    print(f"{'Policy':<24}{'2 players':>12}{'4 players':>12}{'6 players':>12}")
    benchmark: dict[str, list[float]] = {policy.name: [] for policy in policies}
    for players in (2, 4, 6):
        for policy in policies:
            rng = random.Random(args.seed + players * 1000)
            rate, _, _ = evaluate_policy(
                policy,
                opponent_pool,
                args.rounds,
                args.solution_games,
                rng,
                opponents_per_game=players - 1,
            )
            benchmark[policy.name].append(rate)
    for policy in policies:
        print(
            f"{policy.name:<24}"
            + "".join(f"{100 * rate:>11.2f}%" for rate in benchmark[policy.name])
        )

    print("\nDIRECT HEAD-TO-HEAD VS STATE DELTA")
    print(f"{args.showdown_games:,} two-player games/pair; ties split.")
    print(f"{'Challenger':<24}{'Challenger':>13}{'State Delta':>14}")
    for index, submission in enumerate(submissions):
        matrix = simulate_head_to_head(
            (submission, state_delta),
            args.rounds,
            args.showdown_games,
            args.seed + 9000 + index,
        )
        challenger_rate = matrix[0][1]
        print(
            f"{submission.name:<24}{100 * challenger_rate:>12.2f}%"
            f"{100 * (1 - challenger_rate):>13.2f}%"
        )

    print("\nFOUR-WAY SHOWDOWN: ALL FORMULAS IN EVERY GAME")
    print(f"{args.four_way_games:,} four-player games; randomized seats; ties split.")
    showdown = simulate_fixed_matchup(
        policies, args.rounds, args.four_way_games, args.seed + 18000
    )
    ranked = sorted(
        policies,
        key=lambda policy: showdown[policy.name].win_share,
        reverse=True,
    )
    print(f"{'Policy':<24}{'Win share':>12}{'Outright':>12}{'Avg score':>12}")
    for policy in ranked:
        result = showdown[policy.name]
        print(
            f"{policy.name:<24}"
            f"{100 * result.win_share / result.appearances:>11.2f}%"
            f"{100 * result.outright_wins / result.appearances:>11.2f}%"
            f"{result.points / result.appearances:>12.1f}"
        )


def report_matrix(
    field: Sequence[Strategy], matrix: Sequence[Sequence[float]], args: argparse.Namespace
) -> None:
    labels = (
        "Safe", "P060", "P080", "P100", "P125", "P150", "F200", "P211", "A150", "Delta",
        "One+", "Three+", "Five+", "Double", "Lead", "Catch", "Adapt",
    )
    print("BANK IT HEAD-TO-HEAD MATRIX")
    print(
        f"{args.matrix_games:,} games/pair | {args.rounds} rounds | seed {args.seed} | "
        "ties split"
    )
    print("Each cell is the ROW strategy's win rate against the COLUMN strategy.")
    print(" " * 8 + " ".join(f"{label:>6}" for label in labels))
    for row, label in enumerate(labels):
        cells = []
        for column in range(len(field)):
            cells.append("   -- " if row == column else f"{100 * matrix[row][column]:5.1f}%")
        print(f"{label:<7} " + " ".join(cells))

    print("\nLegend:")
    for label, strategy in zip(labels, field):
        print(f"  {label:<6} {strategy.name}")

    target_index = next(
        (i for i, strategy in enumerate(field) if strategy.name.casefold() == args.target.casefold()),
        None,
    )
    if target_index is None:
        choices = ", ".join(strategy.name for strategy in field)
        raise SystemExit(f"Unknown --target {args.target!r}. Choose one of: {choices}")

    counters = sorted(
        (
            (matrix[index][target_index], strategy.name)
            for index, strategy in enumerate(field)
            if index != target_index
        ),
        reverse=True,
    )
    print(f"\nBEST HEAD-TO-HEAD RESULTS AGAINST {field[target_index].name.upper()}")
    for rank, (rate, name) in enumerate(counters[:5], 1):
        print(f"  {rank}. {name:<18} {100 * rate:5.1f}%")


def report(field: Sequence[Strategy], results: dict[str, Result], games: int, args: argparse.Namespace) -> None:
    rows = []
    for strategy in field:
        result = results[strategy.name]
        rows.append((result.win_share / result.appearances, strategy, result))
    rows.sort(reverse=True, key=lambda row: row[0])

    print("BANK IT STRATEGY TOURNAMENT")
    print(
        f"{games:,} games | {args.players} players/game | {args.rounds} rounds | "
        f"seed {args.seed} | ties split"
    )
    print("-" * 75)
    print(f"{'#':>2}  {'Strategy':<18} {'Win %':>8} {'Outright':>9} {'Avg score':>11}")
    print("-" * 75)
    for rank, (win_rate, strategy, result) in enumerate(rows, 1):
        outright = 100 * result.outright_wins / result.appearances
        average = result.points / result.appearances
        print(f"{rank:>2}  {strategy.name:<18} {100 * win_rate:>7.2f}% {outright:>8.2f}% {average:>11.1f}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--players", type=int, default=4, help="strategies per game (default: 4)")
    parser.add_argument("--rounds", type=int, default=10, help="rounds per game (default: 10)")
    parser.add_argument(
        "--repeats", type=int, default=200, help="games per unique matchup (default: 200)"
    )
    parser.add_argument("--seed", type=int, default=20260719, help="random seed")
    parser.add_argument(
        "--matrix", action="store_true", help="run a two-player strategy-vs-strategy matrix"
    )
    parser.add_argument(
        "--matrix-games",
        type=int,
        default=5000,
        help="games per strategy pair in matrix mode (default: 5000)",
    )
    parser.add_argument(
        "--target",
        default="Fixed Pot 200",
        help="strategy to rank counters against in matrix mode (default: Fixed Pot 200)",
    )
    parser.add_argument(
        "--adaptive-analysis",
        action="store_true",
        help="compare fixed Pot 200 with a grid of score-adaptive variants",
    )
    parser.add_argument(
        "--adaptive-games",
        type=int,
        default=100,
        help="games per opponent trio in adaptive analysis (default: 100)",
    )
    parser.add_argument(
        "--policy-table",
        action="store_true",
        help="show state-dependent targets and multi-table-size benchmarks",
    )
    parser.add_argument(
        "--policy-games",
        type=int,
        default=100,
        help="games per opponent combination in policy benchmarks (default: 100)",
    )
    parser.add_argument(
        "--compare-solutions",
        action="store_true",
        help="compare formulas extracted from solutions/ against State Delta",
    )
    parser.add_argument(
        "--solution-games",
        type=int,
        default=200,
        help="games per opponent combination for solution benchmarks (default: 200)",
    )
    parser.add_argument(
        "--showdown-games",
        type=int,
        default=20000,
        help="head-to-head games per submitted formula (default: 20000)",
    )
    parser.add_argument(
        "--four-way-games",
        type=int,
        default=200000,
        help="games with all four formulas at one table (default: 200000)",
    )
    args = parser.parse_args()
    count = len(strategies())
    if not 2 <= args.players <= count:
        parser.error(f"--players must be between 2 and {count}")
    if (
        args.rounds < 1
        or args.repeats < 1
        or args.matrix_games < 1
        or args.adaptive_games < 1
        or args.policy_games < 1
        or args.solution_games < 1
        or args.showdown_games < 1
        or args.four_way_games < 1
    ):
        parser.error("all game-count and round-count options must be positive")
    return args


def main() -> None:
    args = parse_args()
    field = strategies()
    if args.compare_solutions:
        report_solution_comparison(field, args)
    elif args.policy_table:
        report_policy_table(field, args)
    elif args.adaptive_analysis:
        report_adaptive_analysis(field, args)
    elif args.matrix:
        matrix = simulate_head_to_head(field, args.rounds, args.matrix_games, args.seed)
        report_matrix(field, matrix, args)
    else:
        results, games = simulate(field, args.players, args.rounds, args.repeats, args.seed)
        report(field, results, games, args)


if __name__ == "__main__":
    main()
