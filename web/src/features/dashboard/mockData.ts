export const connections = [
  { id: '1', name: 'WhatsApp Comercial', contacts: 48, messages: 12 },
  { id: '2', name: 'Lista de Leads', contacts: 31, messages: 7 },
  { id: '3', name: 'Suporte Premium', contacts: 16, messages: 4 },
]

export const contacts = [
  { id: '1', name: 'Maria Oliveira', phone: '(11) 99999-1001', connection: 'WhatsApp Comercial' },
  { id: '2', name: 'Carlos Mendes', phone: '(21) 98888-2099', connection: 'WhatsApp Comercial' },
  { id: '3', name: 'Ana Souza', phone: '(31) 97777-4488', connection: 'Lista de Leads' },
]

export const messages = [
  {
    id: '1',
    content: 'Olá, sua campanha já está disponível.',
    date: 'Hoje, 09:30',
    recipients: 18,
    status: 'sent',
  },
  {
    id: '2',
    content: 'Lembrete do atendimento agendado.',
    date: 'Amanhã, 14:00',
    recipients: 9,
    status: 'scheduled',
  },
]
