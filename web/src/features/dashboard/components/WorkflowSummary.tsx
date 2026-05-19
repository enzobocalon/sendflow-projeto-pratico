import EventIcon from '@mui/icons-material/Event'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import { Alert, Paper, Skeleton, Typography } from '@mui/material'
import { useDashboardSummary } from '../../../hooks/useDashboardSummary'

export const WorkflowSummary = () => {
  const { error, isLoading, summary } = useDashboardSummary()

  const items = [
    { icon: GroupsOutlinedIcon, label: 'Conexões', value: summary.connections },
    { icon: PhoneOutlinedIcon, label: 'Contatos', value: summary.contacts },
    { icon: MailOutlineIcon, label: 'Mensagens', value: summary.messages },
    { icon: EventIcon, label: 'Agendadas', value: summary.scheduledMessages },
  ]

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <Paper key={item.label} elevation={0} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon fontSize="small" />
                </span>
                <div>
                  {isLoading ? (
                    <Skeleton width={36} height={32} />
                  ) : (
                    <Typography className="text-2xl font-semibold text-slate-950">{item.value}</Typography>
                  )}
                  <Typography className="text-sm text-slate-500">{item.label}</Typography>
                </div>
              </div>
            </Paper>
          )
        })}
      </div>
    </>
  )
}
