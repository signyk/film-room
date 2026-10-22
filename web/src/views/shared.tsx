import { shortName } from "../data/format";
import type { Filters } from "../data/analysis";
import type { Meta, PlayerInfo, PointType, Season } from "../data/types";

export interface ResolvedFilters extends Filters {
  pointType: PointType;
  n: number;
}

export interface ViewProps {
  season: Season;
  meta: Meta;
  filters: ResolvedFilters;
  openPlayer: (player: PlayerInfo) => void;
}

export function PlayerLink(props: { player: PlayerInfo; openPlayer: (p: PlayerInfo) => void; short?: boolean }) {
  const { player, openPlayer, short } = props;
  return (
    <a
      title={short ? player.name : undefined}
      href={`/player?player=${encodeURIComponent(player.name)}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        openPlayer(player);
      }}
    >
      {short ? shortName(player.name) : player.name}
    </a>
  );
}
