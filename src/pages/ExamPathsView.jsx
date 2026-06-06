import React, { useState } from 'react'
import ExamPaths from './ExamPaths'
import ExamPathDetail from './ExamPathDetail'


export default function ExamPathsView() {
  const [selectedPathId, setSelectedPathId] = useState(null)

  return selectedPathId
    ? <ExamPathDetail pathId={selectedPathId} onBack={() => setSelectedPathId(null)} />
    : <ExamPaths onPathSelect={id => setSelectedPathId(id)} />
}