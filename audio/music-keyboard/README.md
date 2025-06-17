# Music Keyboard Audio Samples

This directory is for storing audio samples for the Music Keyboard app.

## Adding Custom Sound Themes

To add custom sound samples:

1. Create a subdirectory for your sound theme (e.g., `piano`, `synth`, `organ`)
2. Add audio files named after the notes they represent (e.g., `C4.mp3`, `D4.mp3`)
3. Make sure all files are in the same format (preferably MP3 or WAV)
4. Update the `soundThemes` object in `music-keyboard.js` to include your new theme

## Sample Structure

```
music-keyboard/
├── piano/
│   ├── C4.mp3
│   ├── D4.mp3
│   └── ...
├── synth/
│   ├── C4.mp3
│   ├── D4.mp3
│   └── ...
└── organ/
    ├── C4.mp3
    ├── D4.mp3
    └── ...
```

## Notes Range

The app currently supports notes from C4 to E5, including sharps/flats.

## Future Enhancements

In future versions, the app will support:
- Loading custom sound packs
- Recording and using your own samples
- Adjusting sample playback parameters (pitch, speed, etc.)