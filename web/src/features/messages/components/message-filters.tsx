import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { MessageStatus } from "../types";

interface MessageFilterProps {
  filter: MessageStatus | "all";
  onFilterChange: (status: MessageStatus | "all") => void;
}

export function MessageFilters(props: MessageFilterProps) {
  const { filter, onFilterChange } = props;

  return (
    <ToggleButtonGroup
      aria-label="Filtrar mensagens"
      exclusive
      value={filter}
      size="small"
    >
      <ToggleButton value="all" onClick={() => onFilterChange("all")}>
        Todas
      </ToggleButton>
      <ToggleButton value="sent" onClick={() => onFilterChange("sent")}>
        Enviadas
      </ToggleButton>
      <ToggleButton
        value="scheduled"
        onClick={() => onFilterChange("scheduled")}
      >
        Agendadas
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
