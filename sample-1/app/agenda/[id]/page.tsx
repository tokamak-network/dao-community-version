'use client'
import Layout from '@/components/layout/Layout'
import AgendaDetail from '@/components/agenda/AgendaDetail'

interface AgendaDetailPageProps {
  params: {
    id: string
  }
}

export default function AgendaDetailPage({ params }: AgendaDetailPageProps) {
  return (
    <Layout>
      <AgendaDetail agendaId={params.id} />
    </Layout>
  )
}