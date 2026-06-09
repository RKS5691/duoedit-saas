
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',background:'#0a0a0f',color:'#f0f0ff'}}>Loading...</div>}>
      <DashboardClient />
    </Suspense>
  )
}
