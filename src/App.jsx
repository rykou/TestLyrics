import React, { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import './modal.css'

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
  }, [])

  const handleLyricsClick = (e, lineIndex) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const charPosition = Math.floor(x / 8)
    
    setSelectedPosition({ lineIndex, charPosition })
    setShowModal(true)
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

    // Save custom chord if it's not in the standard list
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
      chords: [...chords], // Make a copy of current chords
      date: new Date().toISOString()
    }
    
    const updatedTabs = [...savedTabs, newTab]
    setSavedTabs(updatedTabs)
    localStorage.setItem('savedTabs', JSON.stringify(updatedTabs))
    setTabName('')
    setChords([]) // Clear current chords after saving
    setLyrics('') // Clear lyrics after saving
  }

  const loadTab = (index) => {
    const tab = savedTabs[index]
    setLyrics(tab.lyrics)
    setChords(tab.chords || []) // Load saved chords or empty array
  }

  const deleteTab = (index) => {
    const updatedTabs = savedTabs.filter((_, i) => i !== index)
    setSavedTabs(updatedTabs)
    localStorage.setItem('savedTabs', JSON.stringify(updatedTabs))
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    let y = 20
    
    doc.setFontSize(16)
    doc.text('TigerLyrics - Song Lyrics with Chords', 105, y, { align: 'center' })
    y += 20
    
    doc.setFontSize(12)
    const lines = lyrics.split('\n')
    
    lines.forEach((line, lineIndex) => {
      const lineChords = chords[lineIndex] || []
      
      lineChords.forEach(chordObj => {
        doc.text(chordObj.chord, 20 + (chordObj.position * 2), y - 5)
      })
      
      doc.text(line, 20, y)
      y += 10
      
      if (y > 250) {
        doc.addPage()
        y = 20
      }
    })
    
    doc.save('tigerlyrics.pdf')
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
              style={{ left: `${chordObj.position * 8}px` }}
              onClick={(e) => {
                e.stopPropagation()
                removeChord(lineIndex, chordIndex)
              }}
            >
              {chordObj.chord}
            </span>
          ))}
        </div>
        <div className="lyrics-text">{line}</div>
      </div>
    ))
  }

  const chordTypes = [
    'A', 'Am', 'A7', 'B', 'Bm', 'B7', 'C', 'Cm', 'C7',
    'D', 'Dm', 'D7', 'E', 'Em', 'E7', 'F', 'Fm', 'F7',
    'G', 'Gm', 'G7',
    ...customNotes
  ]

  return (
    <div className="container">
      <h1>TigerLyrics - Lyrics and Chords Editor</h1>
      
      <div className="controls">
        <input
          type="text"
          placeholder="Tab name"
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
        />
        <button onClick={saveTab}>Save Tab</button>
        <button onClick={exportToPDF}>Export to PDF</button>
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
