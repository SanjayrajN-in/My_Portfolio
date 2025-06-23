# Audio Folder

This folder is for background music files for the website.

## Adding Background Music

To enable background music:

1. Add an MP3 file named `background.mp3` to this folder
2. The audio should be:
   - In MP3 format
   - Suitable for looping (starts and ends smoothly)
   - Not too loud (the script sets volume to 10% by default)
   - Appropriate for a professional portfolio website

## Recommended Audio Sources

- **Free Music**: 
  - YouTube Audio Library
  - Freesound.org
  - Zapsplat (with free account)
  - Pixabay Music
  
- **License-Free Options**:
  - Creative Commons music
  - Public domain recordings
  
## Audio Behavior

- Music will auto-play with low volume when user first interacts with the site
- Users can toggle music on/off with the sound button
- If no audio file is provided, the sound button will be hidden automatically
- The system gracefully handles missing audio files without errors

## File Requirements

- **Filename**: Must be exactly `background.mp3`
- **Format**: MP3 (most compatible)
- **Size**: Keep under 5MB for faster loading
- **Length**: 30 seconds to 2 minutes (will loop automatically)