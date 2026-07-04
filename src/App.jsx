import { lazy, Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Routes, Route } from 'react-router-dom'
import AppShell from './layout/AppShell'
import { connectTradeStream } from './features/trades/sseService'
import BlotterSkeleton from './features/trades/BlotterSkeleton'

const BlotterPage = lazy(() => import('./pages/BlotterPage'))

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const disconnect = connectTradeStream(dispatch)
    return disconnect
  }, [dispatch])

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route
          index
          element={
            <Suspense fallback={<BlotterSkeleton />}>
              <BlotterPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
