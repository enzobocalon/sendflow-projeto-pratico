import { ToggleButton, ToggleButtonGroup } from '@mui/material'

export const MessageFilters = () => (
  <ToggleButtonGroup exclusive value="all" size="small">
    <ToggleButton value="all">Todas</ToggleButton>
    <ToggleButton value="sent">Enviadas</ToggleButton>
    <ToggleButton value="scheduled">Agendadas</ToggleButton>
  </ToggleButtonGroup>
)
