from pydantic import BaseModel


class Config(BaseModel):
    api_base_url: str = "https://api.sleeper.app/v1/"
    stats_base_url: str = "https://api.sleeper.app/v1/stats/nfl/"
    projections_base_url: str = "https://api.sleeper.app/v1/projections/nfl/"


config = Config()
