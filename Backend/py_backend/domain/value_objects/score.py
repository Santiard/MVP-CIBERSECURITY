from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Score:
    value: float

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Score must be greater than or equal to 0")
