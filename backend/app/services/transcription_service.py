"""
Audio transcription service using SpeechRecognition library.
Supports multiple audio formats and languages.
"""

import speech_recognition as sr
import pydub
import tempfile
import os
from typing import Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

class TranscriptionService:
    """Service for transcribing audio files to text."""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    async def transcribe_audio(self, file_path: str, language: str = "en-US") -> Dict[str, Any]:
        """
        Transcribe audio file to text.
        
        Args:
            file_path: Path to the audio file
            language: Language code for transcription (e.g., 'en-US')
            
        Returns:
            Dictionary containing transcribed text and metadata
        """
        try:
            # Convert audio to WAV format if needed
            wav_path = await self._convert_to_wav(file_path)
            
            # Transcribe using Google Speech Recognition
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor, 
                self._transcribe_wav, 
                wav_path, 
                language
            )
            
            # Clean up temporary WAV file if it was created
            if wav_path != file_path and os.path.exists(wav_path):
                os.unlink(wav_path)
            
            return result
            
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
    
    def _transcribe_wav(self, wav_path: str, language: str) -> Dict[str, Any]:
        """Transcribe WAV file using SpeechRecognition."""
        try:
            with sr.AudioFile(wav_path) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.record(source)
            
            # Transcribe using Google Speech Recognition
            text = self.recognizer.recognize_google(audio, language=language)
            
            # Get audio duration
            audio_file = pydub.AudioSegment.from_wav(wav_path)
            duration = len(audio_file) / 1000.0  # Convert to seconds
            
            return {
                "text": text,
                "language": language,
                "duration": duration,
                "confidence": None  # Google doesn't provide confidence scores
            }
            
        except sr.UnknownValueError:
            raise Exception("Could not understand audio")
        except sr.RequestError as e:
            raise Exception(f"Speech recognition service error: {e}")
    
    async def _convert_to_wav(self, file_path: str) -> str:
        """Convert audio file to WAV format if needed."""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # If already WAV, return as is
        if file_ext == '.wav':
            return file_path
        
        # Convert to WAV
        try:
            audio = pydub.AudioSegment.from_file(file_path)
            wav_path = tempfile.mktemp(suffix='.wav')
            audio.export(wav_path, format="wav")
            return wav_path
        except Exception as e:
            raise Exception(f"Audio conversion failed: {str(e)}")
    
    def get_supported_formats(self) -> list:
        """Get list of supported audio formats."""
        return ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac']
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages."""
        return [
            "en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "de-DE",
            "it-IT", "pt-BR", "ru-RU", "ja-JP", "ko-KR", "zh-CN",
            "zh-TW", "ar-SA", "hi-IN"
        ]
