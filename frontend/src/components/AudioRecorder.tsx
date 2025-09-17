import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from 'react-query'
import { Mic, MicOff, Square, Play, Pause, Trash2, Download, Upload } from 'lucide-react'

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void
  onClose: () => void
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete, onClose }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionText, setTranscriptionText] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Transcription mutation
  const transcriptionMutation = useMutation(
    async (audioFile: File) => {
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      const response = await fetch('http://localhost:8000/api/transcription/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }
      
      return response.json()
    },
    {
      onSuccess: (data) => {
        setTranscriptionText(data.text || '')
        setIsTranscribing(false)
      },
      onError: (error) => {
        console.error('Transcription failed:', error)
        alert('Failed to transcribe audio. Please try again.')
        setIsTranscribing(false)
      }
    }
  )

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }

  // Play recorded audio
  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Handle audio play end
  const handleAudioEnd = () => {
    setIsPlaying(false)
  }

  // Transcribe audio
  const transcribeAudio = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
      setIsTranscribing(true)
      transcriptionMutation.mutate(audioFile)
    }
  }

  // Use transcription text
  const useTranscription = () => {
    if (transcriptionText) {
      onTranscriptionComplete(transcriptionText)
      onClose()
    }
  }

  // Clear recording
  const clearRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscriptionText('')
    setIsPlaying(false)
    setRecordingTime(0)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  // Download audio
  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recording-${Date.now()}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Audio Recorder</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MicOff className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Recording Controls */}
          <div className="text-center space-y-4">
            <div className="text-6xl text-red-500 mb-4">
              {isRecording ? <Mic className="animate-pulse" /> : <MicOff />}
            </div>
            
            <div className="text-2xl font-mono text-gray-700">
              {formatTime(recordingTime)}
            </div>

            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center space-x-2 transition-colors"
                >
                  <Mic className="h-5 w-5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-full flex items-center space-x-2 transition-colors"
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-full flex items-center space-x-2 transition-colors"
                  >
                    <Square className="h-5 w-5" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Audio Playback */}
          {audioUrl && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">Recorded Audio</h3>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={playAudio}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                
                <button
                  onClick={downloadAudio}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={clearRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnd}
                className="w-full"
                controls
              />
            </div>
          )}

          {/* Transcription */}
          {audioBlob && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Transcription</h3>
                <button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>{isTranscribing ? 'Transcribing...' : 'Transcribe'}</span>
                </button>
              </div>

              {isTranscribing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-gray-600">Transcribing audio...</span>
                </div>
              )}

              {transcriptionText && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{transcriptionText}</p>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={clearRecording}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={useTranscription}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Use This Text
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioRecorder