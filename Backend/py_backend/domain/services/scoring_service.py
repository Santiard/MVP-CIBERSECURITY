from typing import Any

from domain.value_objects.score import Score


class ScoringService:
    def calculate(self, answers: Any) -> Score:
        # Placeholder scoring algorithm. Replace with business rules.
        if not answers:
            return Score(0)
        return Score(float(len(answers)))
