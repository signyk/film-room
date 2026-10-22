from pydantic import BaseModel


class Config(BaseModel):
    api_base_url: str = "https://api.sleeper.app/v1/"


config = Config()
