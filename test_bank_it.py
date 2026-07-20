import unittest

from bank_it import (
    GameView,
    Strategy,
    play_game,
    scenario_view,
    simulate,
    simulate_fixed_matchup,
    simulate_head_to_head,
    solution_4o_target,
    solution_gpt35_target,
    solution_gpt5_target,
    state_aware_target,
    strategies,
)


class FixedRandom:
    """Small deterministic RNG stub: randint values are consumed in pairs."""

    def __init__(self, values):
        self.values = iter(values)

    def randrange(self, stop):
        return 0

    def randint(self, low, high):
        return next(self.values)


class BankItTests(unittest.TestCase):
    def test_safe_seven_is_worth_70(self):
        always = Strategy("always", "", lambda view: True)
        rng = FixedRandom([3, 4, 1, 2, 2, 3])
        self.assertEqual(play_game([always, always], rng, rounds=1), [78, 78])

    def test_danger_seven_crashes_unbanked_players(self):
        never = Strategy("never", "", lambda view: False)
        rng = FixedRandom([1, 2, 2, 3, 3, 4, 1, 6])
        self.assertEqual(play_game([never, never], rng, rounds=1), [0, 0])

    def test_danger_double_doubles_pot(self):
        after_one = Strategy("one", "", lambda view: view.danger_rolls == 1)
        rng = FixedRandom([1, 2, 2, 3, 3, 4, 4, 4])
        self.assertEqual(play_game([after_one, after_one], rng, rounds=1), [156, 156])

    def test_balanced_tournament_appearance_counts(self):
        field = strategies()[:5]
        results, games = simulate(field, players=3, rounds=1, repeats=2, seed=7)
        self.assertEqual(games, 20)
        self.assertEqual({result.appearances for result in results.values()}, {12})

    def test_seed_is_reproducible(self):
        field = strategies()[:5]
        one = simulate(field, players=3, rounds=2, repeats=3, seed=42)
        two = simulate(field, players=3, rounds=2, repeats=3, seed=42)
        self.assertEqual(one, two)

    def test_head_to_head_rates_are_complements(self):
        field = strategies()[:3]
        matrix = simulate_head_to_head(field, rounds=2, games_per_pair=20, seed=9)
        for row in range(len(field)):
            self.assertEqual(matrix[row][row], 0.5)
            for column in range(len(field)):
                self.assertAlmostEqual(matrix[row][column] + matrix[column][row], 1.0)

    def test_tournament_strategy_changes_target_with_score(self):
        tournament = next(s for s in strategies() if s.name == "Adaptive 150/200/300")
        common = dict(
            roll=5,
            danger_rolls=2,
            round_number=5,
            rounds=10,
            active_opponents=1,
            total_opponents=1,
            last_roll_was_double=False,
        )
        leading = GameView(pot=150, own_score=500, opponent_scores=(400,), **common)
        tied = GameView(pot=199, own_score=500, opponent_scores=(500,), **common)
        trailing = GameView(pot=225, own_score=400, opponent_scores=(600,), **common)
        trailing_at_target = GameView(pot=300, own_score=400, opponent_scores=(600,), **common)
        self.assertTrue(tournament.bank(leading))
        self.assertFalse(tournament.bank(tied))
        self.assertFalse(tournament.bank(trailing))
        self.assertTrue(tournament.bank(trailing_at_target))

    def test_state_delta_examples_and_player_pressure(self):
        down_500_round_5 = scenario_view(-500, round_number=5, rounds=10, players=4)
        up_200_round_2 = scenario_view(200, round_number=2, rounds=10, players=4)
        self.assertEqual(state_aware_target(down_500_round_5), 340)
        self.assertEqual(state_aware_target(up_200_round_2), 145)

        two_players = scenario_view(-500, round_number=5, rounds=10, players=2)
        six_players = scenario_view(-500, round_number=5, rounds=10, players=6)
        self.assertLess(state_aware_target(two_players), state_aware_target(six_players))

    def test_submitted_formula_extraction(self):
        tied = scenario_view(0, round_number=5, rounds=10, players=4)
        self.assertAlmostEqual(solution_4o_target(tied), 5 / 6)
        self.assertAlmostEqual(solution_gpt35_target(tied), 40.0)
        self.assertGreater(solution_gpt5_target(tied), 0)

    def test_fixed_matchup_win_shares_sum_to_games(self):
        field = strategies()[:3]
        results = simulate_fixed_matchup(field, rounds=2, games=20, seed=12)
        self.assertAlmostEqual(sum(result.win_share for result in results.values()), 20)


if __name__ == "__main__":
    unittest.main()
