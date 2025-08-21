import json
from enum import Enum
from typing import Dict, Literal, Optional, TypeAlias

from pydantic import BaseModel, Field, model_validator

from ff.utils import get_fantasy_points

team_names: Dict[str, str] = json.load(open("data/team_names.json"))

POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"]
EXTRA_POSITIONS = [
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
]

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

    def __hash__(self) -> int:
        return hash(self.short)


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
            and injury_status != ""
            else None
        )

        return values


class WeeklyStats(BaseModel):
    week: int
    player_id: str
    # Kicking
    fg_attempts: int = Field(alias="fga", default=0)
    fg_made: int = Field(alias="fgm", default=0)
    fgm_0_19: int = Field(alias="fgm_0_19", default=0)
    fgm_20_29: int = Field(alias="fgm_20_29", default=0)
    fgm_30_39: int = Field(alias="fgm_30_39", default=0)
    fgm_40_49: int = Field(alias="fgm_40_49", default=0)
    fgm_50_59: int = Field(alias="fgm_50_59", default=0)
    fgm_60_plus: int = Field(alias="fgm_60p", default=0)
    xp_attempts: int = Field(alias="xpa", default=0)
    xp_made: int = Field(alias="xpm", default=0)
    # Passing
    pass_att: int = Field(alias="pass_att", default=0)
    pass_cmp: int = Field(alias="pass_cmp", default=0)
    pass_yds: int = Field(alias="pass_yd", default=0)
    pass_tds: int = Field(alias="pass_td", default=0)
    pass_2pt: int = Field(alias="pass_2pt", default=0)
    interceptions_thrown: int = Field(alias="pass_int", default=0)
    sacks: int = Field(alias="pass_sack", default=0)
    # Rushing
    rush_att: int = Field(alias="rush_att", default=0)
    rush_yds: int = Field(alias="rush_yd", default=0)
    rush_tds: int = Field(alias="rush_td", default=0)
    rush_2pt: int = Field(alias="rush_2pt", default=0)
    # Receiving
    rec_tgt: int = Field(alias="rec_tgt", default=0)
    rec: int = Field(alias="rec", default=0)
    rec_yds: int = Field(alias="rec_yd", default=0)
    rec_tds: int = Field(alias="rec_td", default=0)
    rec_2pt: int = Field(alias="rec_2pt", default=0)
    # Fumbles
    fumbles: int = Field(alias="fum", default=0)
    fumbles_lost: int = Field(alias="fum_lost", default=0)
    fumble_recovery_tds: int = Field(alias="fum_rec_td", default=0)
    # Defense
    def_sacks: int = Field(alias="sack", default=0)
    def_interceptions: int = Field(alias="int", default=0)
    def_force_fumbles: int = Field(alias="ff", default=0)
    def_fumble_recoveries: int = Field(alias="fum_rec", default=0)
    def_tds: int = Field(alias="def_td", default=0)
    return_tds: int = Field(alias="ret_td", default=0)
    blocked_kicks: int = Field(alias="blk_kick", default=0)
    yds_allowed: int = Field(alias="yds_allow", default=0)
    pts_allowed: int = Field(alias="pts_allow", default=0)
    safeties: int = Field(alias="safe", default=0)
    # Fantasy points
    fantasy_points_data: float = Field(alias="pts_ppr", default=0.0)

    def fantasy_points(self, position: Position) -> float:
        return get_fantasy_points(self, position)


class WeeklyProjection(BaseModel):
    week: int
    player_id: str
    projected_points: float = Field(alias="pts_ppr", default=0.0)


class Game(BaseModel):
    week: int
    home_team: Team
    away_team: Team

    @model_validator(mode="before")
    def parse_team(cls, values):
        home_team_short = values.get("home_team")
        away_team_short = values.get("away_team")
        if isinstance(home_team_short, Team) and isinstance(away_team_short, Team):
            return values
        if home_team_short is not None and home_team_short in TEAMS:
            values["home_team"] = TEAMS[home_team_short]
        else:
            values["home_team"] = None
        if away_team_short is not None and away_team_short in TEAMS:
            values["away_team"] = TEAMS[away_team_short]
        else:
            values["away_team"] = None
            print(
                f"Warning: Invalid team short name {away_team_short} in game {values.get('week')}"
            )

        return values
