import json
from enum import Enum
from typing import Dict, Literal, Optional, TypeAlias

from pydantic import BaseModel, Field, model_validator

team_names: Dict[str, str] = json.load(open("data/team_names.json"))

POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"]
Position: TypeAlias = Literal["QB", "RB", "WR", "TE", "K", "DEF"]

ExtraPosition: TypeAlias = Literal[
    "LB",
    "OT",
    "FS",
    "DE",
    "C",
    "ILB",
    "NT",
    "DB",
    "DT",
    "OL",
    "FB",
    "OG",
    "DL",
    "P",
    "CB",
    "T",
    "K/P",
    "S",
    "LS",
    "G",
    "OLB",
    "SS",
    "ATH",
]


class InjuryStatus(Enum):
    Q = "Questionable"
    D = "Doubtful"
    OUT = "Out"
    IR = "IR"
    PUP = "PUP"
    COV = "COV"
    DNR = "DNR"
    SUS = "Sus"


class Team(BaseModel):
    short: str
    name: str


TEAMS: Dict[str, Team] = {
    short: Team(short=short, name=name)
    for short, name in zip(team_names.keys(), team_names.values())
}


class Player(BaseModel):
    player_id: str = Field(alias="player_id")
    name: str = Field(alias="full_name", default="")
    position: Optional[Position | ExtraPosition] = Field(alias="position", default=None)
    team: Optional[Team] = None
    number: Optional[int] = Field(alias="number", default=None)
    injury_status: Optional[InjuryStatus] = None
    active: bool = Field(alias="active")

    def is_relevant(self) -> bool:
        return self.active and self.position in POSITIONS and self.team is not None

    @model_validator(mode="before")
    def parse_team(cls, values):
        short = values.get("team")
        if isinstance(short, Team):
            return values
        if short is not None and short in TEAMS:
            values["team"] = TEAMS[short]
        else:
            values["team"] = None

        injury_status = values.get("injury_status")
        values["injury_status"] = (
            InjuryStatus(injury_status)
            if injury_status is not None
            and injury_status != "NA"
            and injury_status != "Active"
            and injury_status != ""
            else None
        )

        return values
