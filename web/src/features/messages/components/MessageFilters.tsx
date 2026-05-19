import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { MessageStatus } from "../types";

type MessageFilterProps = {
  filter: MessageStatus | 'all';
  onFilterChange: (status: MessageStatus | 'all') => void;
};

export const MessageFilters = ({ filter, onFilterChange }: MessageFilterProps) => (
  <ToggleButtonGroup exclusive value={filter} size="small">
    <ToggleButton value="all" onClick={() => onFilterChange('all')}>
      Todas
    </ToggleButton>
    <ToggleButton value="sent" onClick={() => onFilterChange("sent")}>
      Enviadas
    </ToggleButton>
    <ToggleButton value="scheduled" onClick={() => onFilterChange("scheduled")}>
      Agendadas
    </ToggleButton>
  </ToggleButtonGroup>
);
