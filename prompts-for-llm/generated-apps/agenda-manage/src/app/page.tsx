import { Suspense } from 'react'
import { ClientComponent } from '@/components/ClientComponent'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading Tokamak DAO..." />}>
      <ClientComponent />
    </Suspense>
  )
}