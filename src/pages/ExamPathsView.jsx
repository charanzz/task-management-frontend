import React, { useState } from 'react'
import ExamPaths from './ExamPaths'
import ExamPathDetail from './ExamPathDetail'

// Drop this component into Dashboard.jsx as a new view
// In Dashboard.jsx nav, add: ['paths', '📚', 'Exam Paths', null]
// In Dashboard.jsx view routing, add:
//   :view==='paths' ? <ExamPathsView/>
// In headerTitle(), add:
//   if(view==='paths') return <>📚 <span style={{color:'var(--accent2)'}}>Exam Paths</span></>

export default function ExamPathsView() {
  const [selectedPathId, setSelectedPathId] = useState(null)

  return selectedPathId
    ? <ExamPathDetail pathId={selectedPathId} onBack={() => setSelectedPathId(null)} />
    : <ExamPaths onPathSelect={id => setSelectedPathId(id)} />
}