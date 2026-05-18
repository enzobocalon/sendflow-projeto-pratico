import type { ReactElement } from 'react'

export type DashboardTab = 'connections' | 'contacts' | 'messages'

export type TTabs = { icon: ReactElement; label: string; value: DashboardTab }
