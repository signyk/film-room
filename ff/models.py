import json
from typing import Literal, Optional, TypeAlias

from pydantic import BaseModel, Field, model_validator

from ff.utils import get_fantasy_points

team_names = json.load(open("data/team_names.json"))
team_bye_weeks = json.load(open("data/bye_weeks.json"))

POSITION: TypeAlias = Literal[
    "QB",
    "RB",
    "WR",
    "TE",
    "K",
    "DEF",
]

EXTRA_POSITIONS: TypeAlias = Literal[
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


class Team(BaseModel):
    short: str
    name: str
    bye_week: int

    def __hash__(self) -> int:
        return hash(self.short)


TEAMS = {
    short: Team(short=short, name=name, bye_week=bye_week)
    for short, name, bye_week in zip(
        team_names.keys(), team_names.values(), team_bye_weeks.values()
    )
}


class Player(BaseModel):
    player_id: str = Field(alias="player_id")
    name: str = Field(alias="full_name", default="")
    position: Optional[POSITION | EXTRA_POSITIONS] = Field(
        alias="position", default=None
    )
    team: Optional[Team] = None
    number: Optional[int] = Field(alias="number", default=None)
    active: bool = Field(alias="active")

    @model_validator(mode="before")
    def parse_team(cls, values):
        short = values.get("team")
        if isinstance(short, Team):
            return values
        if short is not None and short in TEAMS:
            values["team"] = TEAMS[short]
        else:
            values["team"] = None

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
    fgm_50_plus: int = Field(alias="fgm_50p", default=0)
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

    def fantasy_points(self, position: POSITION) -> float:
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

        return values
