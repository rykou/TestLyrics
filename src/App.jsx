import React, { useState, useEffect, useRef } from 'react'
import './modal.css'
import { FaLinkedin, FaPaypal, FaCopy, FaPrint, FaFileExport, FaFileImport } from 'react-icons/fa'

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
  const [metronomeBPM, setMetronomeBPM] = useState(60)
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false)
  const [beatCount, setBeatCount] = useState(0)
  const customChordInputRef = useRef(null)
  const lyricsRef = useRef(null)
  const metronomeIntervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)
  const gainNodeRef = useRef(null)
  const fileInputRef = useRef(null)

  // Piano notes (C4 to B4)
  const pianoNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  const playNote = (note) => {
    if (!audioContextRef.current) return
    
    const noteFrequencies = {
      'C': 261.63,
      'C#': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'B': 493.88
    }

    const osc = audioContextRef.current.createOscillator()
    const gain = audioContextRef.current.createGain()
    
    osc.type = 'sine'
    osc.frequency.value = noteFrequencies[note] || 440
    gain.gain.value = 0.3
    
    osc.connect(gain)
    gain.connect(audioContextRef.current.destination)
    
    osc.start()
    osc.stop(audioContextRef.current.currentTime + 0.5)
  }

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

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    gainNodeRef.current = audioContextRef.current.createGain()
    gainNodeRef.current.gain.value = 0.5
    gainNodeRef.current.connect(audioContextRef.current.destination)

    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const exportToJSON = () => {
    const data = {
      version: '1.0',
      name: tabName || 'Untitled Tab',
      lyrics,
      chords,
      customNotes,
      recentChords,
      createdAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tabName || 'tigerlyrics'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.version !== '1.0') {
          alert('Unsupported file version')
          return
        }

        setLyrics(data.lyrics || '')
        setChords(data.chords || [])
        setTabName(data.name || '')
        setCustomNotes(data.customNotes || [])
        setRecentChords(data.recentChords || [])
        
        // Save custom notes and recent chords to localStorage
        localStorage.setItem('tigerLyricsCustomNotes', JSON.stringify(data.customNotes || []))
        localStorage.setItem('tigerLyricsRecentChords', JSON.stringify(data.recentChords || []))
        
        alert('Successfully imported tab!')
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import file. Invalid format.')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input to allow re-importing same file
  }

  const playMetronomeSound = (isAccent) => {
    if (!audioContextRef.current) return
    
    oscillatorRef.current = audioContextRef.current.createOscillator()
    oscillatorRef.current.type = 'sine'
    oscillatorRef.current.frequency.value = isAccent ? 880 : 440
    oscillatorRef.current.connect(gainNodeRef.current)
    oscillatorRef.current.start()
    oscillatorRef.current.stop(audioContextRef.current.currentTime + 0.1)
  }

  const toggleMetronome = () => {
    if (isMetronomePlaying) {
      clearInterval(metronomeIntervalRef.current)
      metronomeIntervalRef.current = null
      setIsMetronomePlaying(false)
      setBeatCount(0)
    } else {
      const interval = 60000 / metronomeBPM // Convert BPM to milliseconds
      metronomeIntervalRef.current = setInterval(() => {
        setBeatCount(prev => {
          const newBeat = (prev % 4) + 1
          playMetronomeSound(newBeat === 1)
          return newBeat
        })
      }, interval)
      setIsMetronomePlaying(true)
    }
  }

  const handleBPMChange = (e) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1 && value <= 300) {
      setMetronomeBPM(value)
      if (isMetronomePlaying) {
        toggleMetronome()
        toggleMetronome()
      }
    }
  }

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

  const renderPiano = () => {
    return (
      <div className="piano-container">
        <h3>Piano</h3>
        <div className="piano">
          {pianoNotes.map((note) => (
            <button
              key={note}
              className={`piano-key ${note.includes('#') ? 'black-key' : 'white-key'}`}
              onClick={() => playNote(note)}
            >
              {!note.includes('#') && <span className="note-label">{note}</span>}
            </button>
          ))}
        </div>
      </div>
    )
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
        <button onClick={exportToJSON}><FaFileExport /> Export JSON</button>
        <button onClick={() => fileInputRef.current.click()}><FaFileImport /> Import</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileImport}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>

      <div className="metronome-controls">
        <div className="metronome-input">
          <label>Metronome (BPM):</label>
          <input
            type="number"
            min="1"
            max="300"
            value={metronomeBPM}
            onChange={handleBPMChange}
          />
        </div>
        <button 
          onClick={toggleMetronome}
          className={isMetronomePlaying ? 'metronome-active' : ''}
        >
          {isMetronomePlaying ? 'Stop Metronome' : 'Start Metronome'}
        </button>
        {isMetronomePlaying && (
          <div className="beat-indicator">
            {Array.from({ length: 4 }).map((_, i) => (
              <div 
                key={i}
                className={`beat ${beatCount === i + 1 ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
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

      {renderPiano()}

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
