import React, { useState, useEffect, useRef } from 'react'
import './modal.css'
import { FaLinkedin, FaPaypal, FaCopy, FaPrint, FaFileExport } from 'react-icons/fa'

function App() {
  const [lyrics, setLyrics] = useState('')
  const [chords, setChords] = useState([])
  const [savedTabs, setSavedTabs] = useState([])
  const [tabName, setTabName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState({ lineIndex: 0, charPosition: 0 })
  const [customChord, setCustomChord] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customNotes, setCustomNotes] = useState([])
  const [recentChords, setRecentChords] = useState([])
  const [draggingChord, setDraggingChord] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const customChordInputRef = useRef(null)
  const lyricsRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('savedTabs')
    if (saved) {
      setSavedTabs(JSON.parse(saved))
    }
    
    const notes = localStorage.getItem('tigerLyricsCustomNotes')
    if (notes) {
      setCustomNotes(JSON.parse(notes))
    }

    const recent = localStorage.getItem('tigerLyricsRecentChords')
    if (recent) {
      setRecentChords(JSON.parse(recent))
    }
  }, [])

  const handleLyricsClick = (e, lineIndex) => {
    if (isDragging || draggingChord) {
      setIsDragging(false)
      setDraggingChord(null)
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const charPosition = Math.floor(x / 8)
    
    setSelectedPosition({ lineIndex, charPosition })
    setShowModal(true)
  }

  const handleChordMouseDown = (e, lineIndex, chordIndex) => {
    e.stopPropagation()
    const chord = chords[lineIndex][chordIndex]
    
    const timeoutId = setTimeout(() => {
      setIsDragging(true)
      setDraggingChord({
        lineIndex,
        chordIndex,
        originalPosition: chord.position,
        startX: e.clientX
      })
    }, 200)
    
    const handleMouseUp = () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleChordMouseMove = (e) => {
    if (!draggingChord) return
    
    const { lineIndex, chordIndex, startX } = draggingChord
    const rect = lyricsRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newPosition = Math.max(0, Math.min(
      Math.floor(x / 8),
      lyrics.split('\n')[lineIndex].length - 1
    ))
    
    const newChords = [...chords]
    newChords[lineIndex][chordIndex].position = newPosition
    setChords(newChords)
  }

  const handleChordMouseUp = (e, lineIndex, chordIndex) => {
    e.stopPropagation()
    if (draggingChord) {
      setDraggingChord(null)
      setIsDragging(false)
      return
    }
    
    removeChord(lineIndex, chordIndex)
  }

  const addChord = (chord) => {
    const newChords = [...chords]
    if (!newChords[selectedPosition.lineIndex]) {
      newChords[selectedPosition.lineIndex] = []
    }
    
    newChords[selectedPosition.lineIndex].push({
      chord,
      position: selectedPosition.charPosition
    })
    
    setChords(newChords)
    setShowModal(false)
    setShowCustomInput(false)
    setCustomChord('')

    // Update recent chords
    const updatedRecent = [
      chord,
      ...recentChords.filter(c => c !== chord)
    ].slice(0, 10)
    setRecentChords(updatedRecent)
    localStorage.setItem('tigerLyricsRecentChords', JSON.stringify(updatedRecent))

    const standardChords = [
      'A', 'Am', 'A7', 'B', 'Bm', 'B7', 'C', 'Cm', 'C7',
      'D', 'Dm', 'D7', 'E', 'Em', 'E7', 'F', 'Fm', 'F7',
      'G', 'Gm', 'G7'
    ]
    
    if (!standardChords.includes(chord)) {
      const updatedNotes = [...new Set([...customNotes, chord])]
      setCustomNotes(updatedNotes)
      localStorage.setItem('tigerLyricsCustomNotes', JSON.stringify(updatedNotes))
    }
  }

  const handleCustomChordSubmit = (e) => {
    e.preventDefault()
    if (customChord.trim()) {
      addChord(customChord)
    }
  }

  const removeChord = (lineIndex, chordIndex) => {
    const newChords = [...chords]
    newChords[lineIndex].splice(chordIndex, 1)
    setChords(newChords)
  }

  const saveTab = () => {
    if (!tabName.trim()) return
    
    const newTab = {
      name: tabName,
      lyrics,
      chords: [...chords],
      recentChords: [...recentChords],
      date: new Date().toISOString()
    }
    
    const updatedTabs = [...savedTabs, newTab]
    setSavedTabs(updatedTabs)
    localStorage.setItem('savedTabs', JSON.stringify(updatedTabs))
    setTabName('')
    setChords([])
    setLyrics('')
  }

  const loadTab = (index) => {
    const tab = savedTabs[index]
    setLyrics(tab.lyrics)
    setChords(tab.chords || [])
    setRecentChords(tab.recentChords || [])
    localStorage.setItem('tigerLyricsRecentChords', JSON.stringify(tab.recentChords || []))
  }

  const deleteTab = (index) => {
    const updatedTabs = savedTabs.filter((_, i) => i !== index)
    setSavedTabs(updatedTabs)
    localStorage.setItem('savedTabs', JSON.stringify(updatedTabs))
  }

  const exportToHTML = () => {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>TigerLyrics - ${tabName || 'Untitled Tab'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .chord-line {
      font-weight: bold;
      margin-bottom: 5px;
      white-space: pre;
      font-family: monospace;
    }
    .lyrics-line {
      margin-bottom: 20px;
      white-space: pre;
      font-family: monospace;
    }
    h1, h2 {
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>TigerLyrics</h1>
  <h2>${tabName || 'Untitled Tab'}</h2>
  <div>
    ${lyrics.split('\n').map((line, lineIndex) => {
      const lineChords = chords[lineIndex] || []
      let chordLine = ''
      lineChords.forEach(chordObj => {
        const spaces = chordObj.position - chordLine.length
        chordLine += ' '.repeat(Math.max(0, spaces)) + chordObj.chord
      })
      return `
        <div class="chord-line">${chordLine}</div>
        <div class="lyrics-line">${line}</div>
      `
    }).join('')}
  </div>
</body>
</html>
      `

      const newWindow = window.open()
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

  const renderLyricsWithChords = () => {
    return lyrics.split('\n').map((line, lineIndex) => (
      <div 
        key={lineIndex} 
        className="lyrics-line"
        onClick={(e) => handleLyricsClick(e, lineIndex)}
      >
        <div className="chords-row">
          {(chords[lineIndex] || []).map((chordObj, chordIndex) => (
            <span 
              key={chordIndex}
              className="chord"
              style={{ 
                left: `${chordObj.position * 8}px`,
                cursor: 'grab',
                userSelect: 'none'
              }}
              onMouseDown={(e) => handleChordMouseDown(e, lineIndex, chordIndex)}
              onMouseUp={(e) => handleChordMouseUp(e, lineIndex, chordIndex)}
            >
              {chordObj.chord}
            </span>
          ))}
        </div>
        <div className="lyrics-text">{line}</div>
      </div>
    ))
  }

  useEffect(() => {
    if (draggingChord) {
      document.addEventListener('mousemove', handleChordMouseMove)
      document.addEventListener('mouseup', () => {
        setDraggingChord(null)
        setIsDragging(false)
      })
      
      return () => {
        document.removeEventListener('mousemove', handleChordMouseMove)
        document.removeEventListener('mouseup', () => {
          setDraggingChord(null)
          setIsDragging(false)
        })
      }
    }
  }, [draggingChord])

  const chordTypes = [
    ...recentChords,
    'A', 'Am', 'A7', 'B', 'Bm', 'B7', 'C', 'Cm', 'C7',
    'D', 'Dm', 'D7', 'E', 'Em', 'E7', 'F', 'Fm', 'F7',
    'G', 'Gm', 'G7',
    ...customNotes.filter(note => !recentChords.includes(note))
  ]

  return (
    <div className="container">
      <div className="creator-header">
        <div className="creator-info">
          <span>Created by Murylo Batista</span>
          <div className="creator-links">
            <a href="https://www.linkedin.com/in/murylo-batista-43097b53/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className="icon" />
            </a>
            <a href="https://www.paypal.com/donate/?hosted_button_id=JR45EMHSW7YAL" target="_blank" rel="noopener noreferrer" className="paypal-button">
              <FaPaypal className="icon" />
              <span>BUY ME A pizza</span>
            </a>
          </div>
        </div>
      </div>

      <h1>TigerLyrics - Lyrics and Chords Editor</h1>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Tab name"
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
        />
        <button onClick={saveTab}>Save Tab</button>
        <button onClick={exportToHTML}><FaFileExport /> Export HTML</button>
      </div>

      <textarea
        ref={lyricsRef}
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Enter your lyrics here, one line per verse..."
      />

      <div className="preview">
        <h3>Preview</h3>
        {renderLyricsWithChords()}
      </div>

      <div className="saved-tabs">
        <h2>Saved Tabs</h2>
        {savedTabs.length === 0 ? (
          <p>No saved tabs yet</p>
        ) : (
          <ul>
            {savedTabs.map((tab, index) => (
              <li key={index}>
                <span>{tab.name}</span>
                <button onClick={() => loadTab(index)}>Load</button>
                <button onClick={() => deleteTab(index)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Select Chord</h3>
            
            {showCustomInput ? (
              <form onSubmit={handleCustomChordSubmit} className="custom-chord-form">
                <input
                  type="text"
                  ref={customChordInputRef}
                  value={customChord}
                  onChange={(e) => setCustomChord(e.target.value)}
                  placeholder="Enter custom chord..."
                  autoFocus
                />
                <div className="custom-chord-buttons">
                  <button type="submit" className="submit-button">Add Chord</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomChord('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="modal-chord-buttons">
                  {chordTypes.map((chord) => (
                    <button
                      key={chord}
                      className="chord-button"
                      onClick={() => addChord(chord)}
                    >
                      {chord}
                    </button>
                  ))}
                </div>
                <button 
                  className="custom-chord-trigger"
                  onClick={() => {
                    setShowCustomInput(true)
                    setTimeout(() => customChordInputRef.current?.focus(), 0)
                  }}
                >
                  + Custom Chord
                </button>
              </>
            )}
            
            <button 
              className="close-button"
              onClick={() => {
                setShowModal(false)
                setShowCustomInput(false)
                setCustomChord('')
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
