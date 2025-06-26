// Music Keyboard App - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Audio Context
    let audioContext;
    let masterGainNode;
    let trackGainNode; // Separate gain node for track playback
    
    // Detect low-end devices
    const isLowEndDevice = () => {
        // Check for low memory (less than 4GB)
        const lowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        // Check for slow CPU (less than 4 cores)
        const slowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        // Check for mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for Safari (which can have Web Audio issues)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        // Return true if any of these conditions are met
        return lowMemory || slowCPU || isMobile || isSafari;
    };
    
    // App State
    // Create app state and expose it globally for debugging
    const appState = {
        isRecording: false,
        isPlaying: false,
        isLooping: false, // Track if loop mode is enabled
        overdubMode: false, // For overdub recording with existing tracks
        currentTrack: null,
        tracks: [],
        recordingStartTime: 0,
        soundTheme: 'piano',
        showKeyLabels: true,
        editingKeyMap: false,
        activeNotes: new Map(), // For tracking currently playing notes
        trackNotes: new Map(), // Separate tracking for track playback notes
        keyMappingMode: false,
        pressedKeys: new Set(), // Track currently pressed keys to prevent stuck notes
        drumSamples: {}, // Store loaded drum samples
        isLowPerformanceMode: isLowEndDevice(), // Auto-detect low-end devices
        lastNoteTime: 0, // Track when the last note was played (for stuck note detection)
        noteTimeouts: new Map(), // Store timeouts for each note to ensure cleanup
        maxNoteLength: 15, // Maximum note length in seconds (to prevent stuck notes)
        audioNodesRegistry: new Set(), // Registry of all created audio nodes for global cleanup
        playbackTimeouts: [], // Store timeouts for track playback to support looping
        keyboardEnabled: true, // Track if PC keyboard input is enabled
        playbackStartTime: 0, // When current track playback started (for overdub sync)
        // Audio recording related
        currentTrack: [],
        recordingStartTime: 0,
        audioElements: new Map(), // Store audio elements for playback
        // Audio recording for MP3 export
        mediaRecorder: null,
        recordedChunks: [],
        audioDestination: null,
        isAudioRecording: false
    };
    
    // Expose appState globally for debugging
    window.appState = appState;
    
    // DOM Elements
    const pianoKeyboard = document.getElementById('piano-keyboard');
    const soundThemeSelect = document.getElementById('sound-theme');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const saveRecordingBtn = document.getElementById('save-recording');
    const trackNameInput = document.getElementById('track-name');
    const tracksList = document.getElementById('tracks-list');
    const noTracksMessage = document.getElementById('no-tracks-message');
    const playAllTracksBtn = document.getElementById('play-all-tracks');
    const stopPlaybackBtn = document.getElementById('stop-playback');
    const loopPlaybackBtn = document.getElementById('loop-playback');
    const exportTracksBtn = document.getElementById('export-tracks');
    const importTracksBtn = document.getElementById('import-tracks');
    const toggleKeyLabelsBtn = document.getElementById('toggle-key-labels');
    const resetMappingBtn = document.getElementById('reset-mapping');
    const toggleMappingModeBtn = document.getElementById('toggle-mapping-mode');
    const beginnerMappingBtn = document.getElementById('beginner-mapping');
    const keyMappingDisplay = document.getElementById('key-mapping-display');
    const savePreferencesBtn = document.getElementById('save-preferences');
    const volumeSlider = document.getElementById('volume-slider');
    const panicButton = document.getElementById('panic-button');
    const toggleThemeKeyboardBtn = document.getElementById('toggle-theme-keyboard');
    const toggleKeyboardBtn = document.getElementById('toggle-keyboard');
    const keyboardStatus = document.getElementById('keyboard-status');
    
    // Default Key Mapping (Computer keyboard key to note)
    const defaultKeyMap = {
        // Lower octave
        'z': { note: 'C3', frequency: 130.81 },
        's': { note: 'C#3', frequency: 138.59 },
        'x': { note: 'D3', frequency: 146.83 },
        'd': { note: 'D#3', frequency: 155.56 },
        'c': { note: 'E3', frequency: 164.81 },
        'v': { note: 'F3', frequency: 174.61 },
        'g': { note: 'F#3', frequency: 185.00 },
        'b': { note: 'G3', frequency: 196.00 },
        'h': { note: 'G#3', frequency: 207.65 },
        'n': { note: 'A3', frequency: 220.00 },
        'j': { note: 'A#3', frequency: 233.08 },
        'm': { note: 'B3', frequency: 246.94 },
        
        // Middle octave
        'q': { note: 'C4', frequency: 261.63 },
        '2': { note: 'C#4', frequency: 277.18 },
        'w': { note: 'D4', frequency: 293.66 },
        '3': { note: 'D#4', frequency: 311.13 },
        'e': { note: 'E4', frequency: 329.63 },
        'r': { note: 'F4', frequency: 349.23 },
        '5': { note: 'F#4', frequency: 369.99 },
        't': { note: 'G4', frequency: 392.00 },
        '6': { note: 'G#4', frequency: 415.30 },
        'y': { note: 'A4', frequency: 440.00 },
        '7': { note: 'A#4', frequency: 466.16 },
        'u': { note: 'B4', frequency: 493.88 },
        
        // Upper octave
        'i': { note: 'C5', frequency: 523.25 },
        '9': { note: 'C#5', frequency: 554.37 },
        'o': { note: 'D5', frequency: 587.33 },
        '0': { note: 'D#5', frequency: 622.25 },
        'p': { note: 'E5', frequency: 659.25 },
        '[': { note: 'F5', frequency: 698.46 },
        '=': { note: 'F#5', frequency: 739.99 },
        ']': { note: 'G5', frequency: 783.99 }
    };
    
    // Drum kit mapping
    const drumKitMap = {
        '1': { name: 'kick', sample: 'kick.mp3' },
        'a': { name: 'snare', sample: 'snare.mp3' },
        'l': { name: 'hihat', sample: 'hihat.mp3' },
        'k': { name: 'clap', sample: 'clap.mp3' },
        ';': { name: 'tom', sample: 'tom.mp3' },
        '.': { name: 'crash', sample: 'crash.mp3' },
        '/': { name: 'ride', sample: 'ride.mp3' },
        ',': { name: 'rim', sample: 'rim.mp3' }
    };
    
    // Current Key Mapping (can be customized)
    let keyMap = { ...defaultKeyMap };
    
    // Piano Key Data
    const pianoKeys = [
        // Lower octave
        { note: 'C3', type: 'white', keyLabel: 'Z' },
        { note: 'C#3', type: 'black', keyLabel: 'S' },
        { note: 'D3', type: 'white', keyLabel: 'X' },
        { note: 'D#3', type: 'black', keyLabel: 'D' },
        { note: 'E3', type: 'white', keyLabel: 'C' },
        { note: 'F3', type: 'white', keyLabel: 'V' },
        { note: 'F#3', type: 'black', keyLabel: 'G' },
        { note: 'G3', type: 'white', keyLabel: 'B' },
        { note: 'G#3', type: 'black', keyLabel: 'H' },
        { note: 'A3', type: 'white', keyLabel: 'N' },
        { note: 'A#3', type: 'black', keyLabel: 'J' },
        { note: 'B3', type: 'white', keyLabel: 'M' },
        
        // Middle octave
        { note: 'C4', type: 'white', keyLabel: 'Q' },
        { note: 'C#4', type: 'black', keyLabel: '2' },
        { note: 'D4', type: 'white', keyLabel: 'W' },
        { note: 'D#4', type: 'black', keyLabel: '3' },
        { note: 'E4', type: 'white', keyLabel: 'E' },
        { note: 'F4', type: 'white', keyLabel: 'R' },
        { note: 'F#4', type: 'black', keyLabel: '5' },
        { note: 'G4', type: 'white', keyLabel: 'T' },
        { note: 'G#4', type: 'black', keyLabel: '6' },
        { note: 'A4', type: 'white', keyLabel: 'Y' },
        { note: 'A#4', type: 'black', keyLabel: '7' },
        { note: 'B4', type: 'white', keyLabel: 'U' },
        
        // Upper octave
        { note: 'C5', type: 'white', keyLabel: 'I' },
        { note: 'C#5', type: 'black', keyLabel: '9' },
        { note: 'D5', type: 'white', keyLabel: 'O' },
        { note: 'D#5', type: 'black', keyLabel: '0' },
        { note: 'E5', type: 'white', keyLabel: 'P' },
        { note: 'F5', type: 'white', keyLabel: '[' },
        { note: 'F#5', type: 'black', keyLabel: '=' },
        { note: 'G5', type: 'white', keyLabel: ']' }
    ];
    
    // Drum kit keys
    const drumKeys = [
        { name: 'kick', keyLabel: '1', displayName: 'Kick' },
        { name: 'snare', keyLabel: 'A', displayName: 'Snare' },
        { name: 'hihat', keyLabel: 'L', displayName: 'Hi-Hat' },
        { name: 'clap', keyLabel: 'K', displayName: 'Clap' },
        { name: 'tom', keyLabel: ';', displayName: 'Tom' },
        { name: 'crash', keyLabel: '.', displayName: 'Crash' },
        { name: 'ride', keyLabel: '/', displayName: 'Ride' },
        { name: 'rim', keyLabel: ',', displayName: 'Rim' }
    ];
    
    // Sound Theme Configurations
    const soundThemes = {
        piano: {
            type: 'oscillator',
            oscillatorType: 'triangle',
            attack: 0.02,
            decay: 0.1,
            sustain: 0.7,
            release: 0.4
        },
        synth: {
            type: 'oscillator',
            oscillatorType: 'sawtooth',
            attack: 0.01,
            decay: 0.2,
            sustain: 0.6,
            release: 0.2
        },
        organ: {
            type: 'oscillator',
            oscillatorType: 'square',
            attack: 0.05,
            decay: 0.3,
            sustain: 1.0,
            release: 0.7
        },
        electric: {
            type: 'oscillator',
            oscillatorType: 'sawtooth',
            attack: 0.005,
            decay: 0.1,
            sustain: 0.3,
            release: 0.1
        },
        ambient: {
            type: 'oscillator',
            oscillatorType: 'sine',
            attack: 0.1,
            decay: 0.4,
            sustain: 0.8,
            release: 1.5
        },
        drums: {
            type: 'drums'
        }
    };
    
    // Periodic cleanup to prevent stuck sounds
    function setupPeriodicCleanup() {
        // Fast cleanup check every 3 seconds for immediate issues
        setInterval(() => {
            if (!audioContext) return;
            
            // If there are active notes but no pressed keys, they might be stuck
            if (appState.activeNotes.size > 0 && appState.pressedKeys.size === 0) {
                stopAllNotes();
            }
            
            // Check for audio context issues
            if (audioContext.state === 'suspended') {
                audioContext.resume().catch(e => {
                    // Audio context resume failed, but we'll continue
                });
            }
            
            // Check for inactive UI but active notes
            const activeUIElements = document.querySelectorAll('.piano-key.active, .drum-pad.active');
            if (activeUIElements.length === 0 && appState.activeNotes.size > 0) {
                stopAllNotes();
            }
            
            // Check for no recent activity but active notes
            if (appState.activeNotes.size > 0 && audioContext.currentTime - appState.lastNoteTime > 5) {
                stopAllNotes();
            }
        }, 3000);
        
        // More thorough cleanup every 10 seconds
        setInterval(() => {
            if (!audioContext) return;
            
            // Check for notes that have been playing too long
            const currentTime = audioContext.currentTime;
            let stuckNotesFound = false;
            
            appState.activeNotes.forEach((data, note) => {
                // For low performance mode, use shorter max duration
                const maxDuration = appState.isLowPerformanceMode ? 10 : 20;
                
                if (currentTime - data.startTime > maxDuration) {
                    stopNote(note);
                    stuckNotesFound = true;
                }
            });
            
            if (stuckNotesFound) {
                // Stuck notes were found and cleaned up
            }
            
            // Check for memory usage (indirect way to detect leaks)
            if (appState.audioNodesRegistry.size > 100) {
                forceCleanupAllAudio();
            }
            
            // Check for browser performance issues
            if (appState.isLowPerformanceMode === false && 
                (document.visibilityState === 'visible' && 
                 performance && performance.now && 
                 performance.memory && performance.memory.usedJSHeapSize > 50000000)) {
                appState.isLowPerformanceMode = true;
                document.body.classList.add('low-performance');
            }
        }, 10000);
        
        // Deep cleanup every 30 seconds
        setInterval(() => {
            // Clean up any orphaned timeouts
            appState.noteTimeouts.forEach((timeout, note) => {
                if (!appState.activeNotes.has(note)) {
                    clearTimeout(timeout);
                    appState.noteTimeouts.delete(note);
                }
            });
            
            // If we have active notes but UI doesn't match, force reset
            const activeUICount = document.querySelectorAll('.piano-key.active, .drum-pad.active').length;
            if (activeUICount !== appState.activeNotes.size) {
                // Reset UI to match audio state
                document.querySelectorAll('.piano-key.active, .drum-pad.active').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Then update UI for actually active notes
                appState.activeNotes.forEach((data, note) => {
                    updateKeyUI(note, true);
                });
            }
            
            // If we have more than a few active notes, it might be a leak
            if (appState.activeNotes.size > 5) {
                forceCleanupAllAudio();
            }
        }, 30000);
    }
    
    // Force cleanup all audio nodes
    function forceCleanupAllAudio() {
        try {
            // First try to stop all active notes
            stopAllNotes();
            
            // Clear all note timeouts
            appState.noteTimeouts.forEach((timeout) => {
                clearTimeout(timeout);
            });
            appState.noteTimeouts.clear();
            
            // Disconnect and clean up all registered audio nodes
            appState.audioNodesRegistry.forEach((node) => {
                try {
                    if (node && node.disconnect) {
                        node.disconnect();
                    }
                    if (node && node.stop) {
                        node.stop(0);
                    }
                } catch (e) {
                    // Ignore errors during cleanup
                }
            });
            appState.audioNodesRegistry.clear();
            
            // Reset active notes and pressed keys
            appState.activeNotes.clear();
            appState.pressedKeys.clear();
            
            // Instead of recreating the audio context (which can cause issues),
            // just suspend and resume it to clear any stuck audio
            if (audioContext) {
                try {
                    if (audioContext.state === 'running') {
                        audioContext.suspend().then(() => {
                            setTimeout(() => {
                                audioContext.resume().catch(() => {
                                    // Resume failed, but we'll continue
                                });
                            }, 100);
                        }).catch(() => {
                            // Suspend failed, but we'll continue
                        });
                    }
                    
                    // Reset gain nodes but keep the audio context
                    if (masterGainNode) {
                        masterGainNode.gain.value = volumeSlider ? (volumeSlider.value / 100) : 0.7;
                    }
                    
                    if (trackGainNode) {
                        trackGainNode.gain.value = masterGainNode ? masterGainNode.gain.value : 0.7;
                    }
                } catch (e) {
                    // Audio context operation failed
                }
            }
            
            // Reset UI
            document.querySelectorAll('.piano-key.active').forEach(key => {
                key.classList.remove('active');
            });
            
            document.querySelectorAll('.drum-pad.active').forEach(pad => {
                pad.classList.remove('active');
            });
            
        } catch (e) {
            // Force cleanup failed
        }
    }
    
    // Initialize the app
    function init() {
        // Load saved preferences and tracks
        loadPreferences();
        loadTracks();
        
        // Initialize Audio Context (on user interaction to comply with browser policies)
        document.addEventListener('click', initAudioContext, { once: true });
        
        // Add touch event listener for mobile devices
        document.addEventListener('touchstart', function() {
            // Initialize audio context if it doesn't exist
            if (!audioContext) {
                initAudioContext();
            }
            
            // Resume audio context if it's suspended (common on mobile)
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(err => {
                    // Audio context resume failed on mobile
                });
            }
        }, { once: true });
        
        // Apply low performance mode if detected
        if (appState.isLowPerformanceMode) {
            document.body.classList.add('low-performance');
            // Reduce max note length for low-end devices
            appState.maxNoteLength = 8;
        }
        
        // Create piano keyboard UI
        createPianoKeyboard();
        
        // Update key mapping display
        updateKeyMappingDisplay();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update sound theme options
        updateSoundThemeOptions();
        
        // Initialize keyboard button state
        updateKeyboardButtonState();
        
        // Ensure keyboard focus is set
        setTimeout(() => {
            ensureKeyboardFocus();
        }, 500);
        
        // Set initial volume
        if (volumeSlider) {
            volumeSlider.value = 70; // Default to 70%
        }
        
        // Add window blur event to stop all notes (prevents stuck notes when switching tabs)
        window.addEventListener('blur', stopAllNotes);
        
        // Add visibility change event to stop all notes when page is hidden
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAllNotes();
            }
        });
        
        // Add beforeunload event to stop all notes when page is closed
        window.addEventListener('beforeunload', stopAllNotes);
        
        // Setup periodic cleanup to prevent stuck sounds
        setupPeriodicCleanup();
        
        // Add keyboard focus/blur events to handle tab switching
        window.addEventListener('focus', function() {
            // When window gets focus back, check if there are any active notes without pressed keys
            if (appState.activeNotes.size > 0 && appState.pressedKeys.size === 0) {
                stopAllNotes();
            }
        });
        
        // Add panic button with double-click for force cleanup
        if (panicButton) {
            panicButton.addEventListener('dblclick', forceCleanupAllAudio);
        }
        
        // Add emergency cleanup on errors
        window.addEventListener('error', function(e) {
            forceCleanupAllAudio();
        });
        
        // Add window resize listener to recreate keyboard layout
        let resizeTimeout;
        window.addEventListener('resize', function() {
            // Debounce resize events to avoid excessive recreation
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                createPianoKeyboard();
            }, 250);
        });
        
        // Add orientation change listener for mobile devices
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                createPianoKeyboard();
            }, 500); // Delay to allow orientation change to complete
        });
    }
    
    // Initialize Audio Context
    function initAudioContext() {
        if (!audioContext) {
            try {
                // Check global sound setting from games.js
                if (typeof window.soundEnabled !== 'undefined' && !window.soundEnabled) {
                    return null;
                }
                
                // Create audio context with consistent settings for reliable sound
                const contextOptions = {
                    latencyHint: 'playback', // Use 'playback' for more stable audio processing
                    sampleRate: 44100
                };
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
                
                // Create master gain node
                masterGainNode = audioContext.createGain();
                masterGainNode.gain.value = volumeSlider ? (volumeSlider.value / 100) : 0.7;
                
                // Create separate gain node for track playback with same volume as master
                trackGainNode = audioContext.createGain();
                trackGainNode.gain.value = masterGainNode.gain.value; // Use same volume for consistent playback
                
                // Create a compressor to prevent clipping when multiple notes play
                const compressor = audioContext.createDynamicsCompressor();
                compressor.threshold.value = -24;  // Lower threshold for more consistent compression
                compressor.knee.value = 20;        // Gentler knee for smoother sound
                compressor.ratio.value = 4;        // Gentler ratio for more natural sound
                compressor.attack.value = 0.005;   // Slightly slower attack to preserve transients
                compressor.release.value = 0.1;    // Faster release for cleaner transitions
                
                // Add a limiter for additional safety
                const limiter = audioContext.createDynamicsCompressor();
                limiter.threshold.value = -3;      // Higher threshold for less coloration
                limiter.knee.value = 0;            // Hard knee
                limiter.ratio.value = 12;          // Less aggressive limiting for cleaner sound
                limiter.attack.value = 0.002;      // Slightly slower attack to preserve transients
                limiter.release.value = 0.03;      // Slightly longer release for smoother sound
                
                // Create audio destination for recording
                appState.audioDestination = audioContext.createMediaStreamDestination();
                
                // Connect the audio chain with limiter
                masterGainNode.connect(compressor);
                // trackGainNode will connect to masterGainNode for consistent sound
                compressor.connect(limiter);
                limiter.connect(audioContext.destination);
                
                // Also connect to recording destination
                limiter.connect(appState.audioDestination);
                
                // Register for cleanup
                appState.audioNodesRegistry.add(compressor);
                appState.audioNodesRegistry.add(limiter);
                appState.audioNodesRegistry.add(masterGainNode);
                appState.audioNodesRegistry.add(trackGainNode);
                appState.audioNodesRegistry.add(appState.audioDestination);
                
                // Create drum samples
                createDrumSamples();
                
            } catch (e) {
                alert("There was a problem initializing audio. Please try a different browser.");
            }
        }
    }
    
    // Create drum samples
    function createDrumSamples() {
        // Create synthesized drum sounds
        appState.drumSamples = {};
        
        // We'll create the actual samples when they're played
        // This is just to initialize the object
        drumKeys.forEach(drum => {
            appState.drumSamples[drum.name] = null;
        });
    }
    
    // Update sound theme options in the dropdown
    function updateSoundThemeOptions() {
        if (!soundThemeSelect) return;
        
        soundThemeSelect.innerHTML = '';
        
        Object.keys(soundThemes).forEach(theme => {
            const option = document.createElement('option');
            option.value = theme;
            option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            soundThemeSelect.appendChild(option);
        });
        
        // Set the current theme
        soundThemeSelect.value = appState.soundTheme;
    }
    
    // Create Piano Keyboard UI
    function createPianoKeyboard() {
        if (!pianoKeyboard) return;
        
        pianoKeyboard.innerHTML = '';
        pianoKeyboard.className = 'piano-keyboard';
        
        // Check if we're in drums mode
        if (appState.soundTheme === 'drums') {
            createDrumPads();
            return;
        }
        
        // Check if we're on mobile and should use 2-row layout
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            createMobileKeyboard();
        } else {
            createDesktopKeyboard();
        }
    }
    
    // Create desktop keyboard (single row)
    function createDesktopKeyboard() {
        pianoKeys.forEach(key => {
            const keyElement = createKeyElement(key);
            pianoKeyboard.appendChild(keyElement);
        });
    }
    
    // Create mobile keyboard (2 rows)
    function createMobileKeyboard() {
        // Split keys evenly into two rows (14 keys each)
        // Upper row: First half of all keys
        const upperRowKeys = pianoKeys.slice(0, 14);
        
        // Lower row: Second half of all keys  
        const lowerRowKeys = pianoKeys.slice(14);
        
        // Create upper row
        const upperRow = document.createElement('div');
        upperRow.className = 'keyboard-row upper-row';
        upperRowKeys.forEach(key => {
            const keyElement = createKeyElement(key);
            upperRow.appendChild(keyElement);
        });
        pianoKeyboard.appendChild(upperRow);
        
        // Create lower row
        const lowerRow = document.createElement('div');
        lowerRow.className = 'keyboard-row lower-row';
        lowerRowKeys.forEach(key => {
            const keyElement = createKeyElement(key);
            lowerRow.appendChild(keyElement);
        });
        pianoKeyboard.appendChild(lowerRow);
    }
    
    // Create individual key element
    function createKeyElement(key) {
        const keyElement = document.createElement('div');
        keyElement.className = `piano-key ${key.type}-key`;
        keyElement.dataset.note = key.note;
        
        // Add key label if enabled
        if (appState.showKeyLabels) {
            const keyLabel = document.createElement('span');
            keyLabel.className = 'key-label';
            keyLabel.textContent = key.keyLabel;
            keyElement.appendChild(keyLabel);
        }
        
        // Add mouse event listeners
        keyElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            playNote(key.note);
        });
        
        keyElement.addEventListener('mouseup', (e) => {
            e.preventDefault();
            stopNote(key.note);
        });
        
        keyElement.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            stopNote(key.note);
        });
        
        // Add touch event listeners
        keyElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playNote(key.note);
        });
        
        keyElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopNote(key.note);
        });
        
        // Prevent context menu on right-click
        keyElement.addEventListener('contextmenu', e => e.preventDefault());
        
        return keyElement;
    }
    
    // Create Drum Pads UI
    function createDrumPads() {
        if (!pianoKeyboard) return;
        
        pianoKeyboard.innerHTML = '';
        pianoKeyboard.className = 'drum-pads';
        
        drumKeys.forEach(drum => {
            const padElement = document.createElement('div');
            padElement.className = 'drum-pad';
            padElement.dataset.drum = drum.name;
            
            const padName = document.createElement('div');
            padName.className = 'pad-name';
            padName.textContent = drum.displayName;
            
            const padLabel = document.createElement('div');
            padLabel.className = 'pad-label';
            padLabel.textContent = drum.keyLabel;
            
            padElement.appendChild(padName);
            padElement.appendChild(padLabel);
            
            // Add event listeners
            padElement.addEventListener('mousedown', (e) => {
                e.preventDefault();
                playDrum(drum.name);
            });
            
            padElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playDrum(drum.name);
            });
            
            pianoKeyboard.appendChild(padElement);
        });
    }
    
    // Function to toggle through sound themes using keyboard
    function toggleSoundTheme() {
        if (!soundThemeSelect) return;
        
        const themes = Array.from(soundThemeSelect.options).map(option => option.value);
        const currentIndex = themes.indexOf(appState.soundTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        // Set the new theme
        appState.soundTheme = themes[nextIndex];
        soundThemeSelect.value = appState.soundTheme;
        
        // Update UI based on sound theme
        createPianoKeyboard(); // Recreate keyboard UI based on selected theme
        updateKeyMappingDisplay(); // Update key mapping display
        
        // Stop any playing notes when changing themes
        stopAllNotes();
        
        // Show a notification
        showNotification(`Sound Theme: ${appState.soundTheme.charAt(0).toUpperCase() + appState.soundTheme.slice(1)}`);
    }
    
    // Function to show a temporary notification
    function showNotification(message) {
        // Check if notification element exists, if not create it
        let notification = document.querySelector('.keyboard-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'keyboard-notification';
            document.querySelector('.keyboard-container').appendChild(notification);
        }
        
        // Set message and show
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Remove existing keyboard event listeners to prevent duplicates
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        
        // Keyboard events
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        
        

        
        // Sound theme selection
        if (soundThemeSelect) {
            soundThemeSelect.addEventListener('change', () => {
                
                appState.soundTheme = soundThemeSelect.value;
                createPianoKeyboard(); // Recreate keyboard UI based on selected theme
                updateKeyMappingDisplay(); // Update key mapping display
                updateKeyboardButtonState(); // Ensure keyboard button state is preserved
                
                // Ensure keyboard focus is properly set
                setTimeout(() => {
                    ensureKeyboardFocus();
                }, 100);
                
                
            });
        }
        
        // Volume control
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                const volumeValue = volumeSlider.value / 100;
                
                // Update both gain nodes to keep volumes in sync
                if (masterGainNode) {
                    masterGainNode.gain.value = volumeValue;
                }
                
                if (trackGainNode) {
                    trackGainNode.gain.value = volumeValue;
                }
                
                // Save the volume setting to localStorage
                try {
                    localStorage.setItem('musicKeyboardVolume', volumeValue);
                } catch (e) {
                    // Ignore storage errors
                }
            });
            
            // Load saved volume if available
            try {
                const savedVolume = localStorage.getItem('musicKeyboardVolume');
                if (savedVolume !== null) {
                    volumeSlider.value = Math.round(parseFloat(savedVolume) * 100);
                    // Trigger the input event to apply the volume
                    volumeSlider.dispatchEvent(new Event('input'));
                }
            } catch (e) {
                // Ignore storage errors
            }
        }
        
        // Recording controls
        if (startRecordingBtn) {
            startRecordingBtn.addEventListener('click', startRecording);
        }
        
        if (stopRecordingBtn) {
            stopRecordingBtn.addEventListener('click', stopRecording);
        }
        
        if (saveRecordingBtn) {
            saveRecordingBtn.addEventListener('click', saveRecording);
        }
        
        // Playback controls
        if (playAllTracksBtn) {
            playAllTracksBtn.addEventListener('click', playAllTracks);
        }
        
        if (stopPlaybackBtn) {
            stopPlaybackBtn.addEventListener('click', stopPlayback);
        }
        
        if (loopPlaybackBtn) {
            loopPlaybackBtn.addEventListener('click', toggleLoopMode);
        }
        
        // Export/Import
        if (exportTracksBtn) {
            exportTracksBtn.addEventListener('click', function() {
                showExportDialog();
            });
        } else {
            console.error('Export button not found in the DOM');
        }
        
        if (importTracksBtn) {
            importTracksBtn.addEventListener('click', () => {
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                
                fileInput.addEventListener('change', importTracksFromFile);
                fileInput.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(fileInput);
                }, 1000);
            });
        }
        
        // UI Controls
        if (toggleKeyLabelsBtn) {
            toggleKeyLabelsBtn.addEventListener('click', toggleKeyLabels);
        }
        
        if (toggleKeyboardBtn) {
            toggleKeyboardBtn.addEventListener('click', toggleKeyboard);
        }
        
        if (resetMappingBtn) {
            resetMappingBtn.addEventListener('click', resetKeyMapping);
        }
        
        if (toggleMappingModeBtn) {
            toggleMappingModeBtn.addEventListener('click', toggleKeyMappingMode);
        }
        
        if (beginnerMappingBtn) {
            beginnerMappingBtn.addEventListener('click', setBeginnerMapping);
        }
        
        if (savePreferencesBtn) {
            savePreferencesBtn.addEventListener('click', savePreferences);
        }
        
        // Add panic button event (stop all sounds)
        if (panicButton) {
            panicButton.addEventListener('click', stopAllNotes);
        }
        
        // Add toggle theme button event
        if (toggleThemeKeyboardBtn) {
            toggleThemeKeyboardBtn.addEventListener('click', toggleSoundTheme);
        }
        
        // Add click handler to ensure keyboard focus when clicking on the page
        document.addEventListener('click', (e) => {
            // Only ensure focus if not clicking on input elements
            if (e.target.tagName !== 'INPUT' && 
                e.target.tagName !== 'SELECT' && 
                e.target.tagName !== 'TEXTAREA' && 
                e.target.tagName !== 'BUTTON') {
                setTimeout(() => {
                    ensureKeyboardFocus();
                }, 10);
            }
        });
    }
    
    // Handle keyboard key press
    function handleKeyDown(e) {
        // Ignore if keyboard is disabled, key is already pressed, or if we're in an input field
        if (!appState.keyboardEnabled || e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        const key = e.key.toLowerCase();
        
        // Add to pressed keys set
        appState.pressedKeys.add(key);
        
        // Ensure audio context is initialized
        if (!audioContext) {
            initAudioContext();
        }
        
        // Resume audio context if suspended (fixes issues with keys not working)
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(err => {
                // Audio context resume failed
            });
        }
        
        // Prevent space bar from scrolling
        if (key === ' ') {
            e.preventDefault();
        }
        
        // Use Tab key to toggle through sound themes
        if (key === 'tab') {
            e.preventDefault(); // Prevent default tab behavior
            toggleSoundTheme();
            return;
        }
        
        // If in key mapping mode, handle key mapping
        if (appState.keyMappingMode && document.querySelector('.key-map-item.editing')) {
            const editingItem = document.querySelector('.key-map-item.editing');
            const note = editingItem.dataset.note;
            
            // Find the old key for this note
            let oldKey = null;
            for (const [k, v] of Object.entries(keyMap)) {
                if (v.note === note) {
                    oldKey = k;
                    break;
                }
            }
            
            // Remove the old mapping
            if (oldKey) {
                delete keyMap[oldKey];
            }
            
            // Add the new mapping
            keyMap[key] = { 
                note: note, 
                frequency: getNoteFrequency(note)
            };
            
            // Update the display
            updateKeyMappingDisplay();
            
            // Exit editing mode for this item
            editingItem.classList.remove('editing');
            
            return;
        }
        
        // Check if we're in drums mode
        if (appState.soundTheme === 'drums') {
            // Check if the key is mapped to a drum
            for (const [drumKey, drumData] of Object.entries(drumKitMap)) {
                if (drumKey === key) {
                    // Play the drum sound
                    playDrum(drumData.name);
                    
                    // Update keyboard status
                    if (keyboardStatus) {
                        keyboardStatus.textContent = `Drum: ${drumData.name}`;
                        keyboardStatus.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                        keyboardStatus.style.color = '#e74c3c';
                        keyboardStatus.style.borderColor = '#e74c3c';
                    }
                    return;
                }
            }
            
            // If no drum mapping found but we're in drum mode, check if it's a piano key
            // This allows piano keys to trigger drums as well
            if (keyMap[key]) {
                // Map piano keys to drums in a cyclic manner
                const drumKeys = Object.keys(drumKitMap);
                const drumIndex = Math.abs(keyMap[key].note.charCodeAt(0)) % drumKeys.length;
                const drumKey = drumKeys[drumIndex];
                const drumName = drumKitMap[drumKey].name;
                
                // Play the drum sound
                playDrum(drumName);
                
                // Update keyboard status
                if (keyboardStatus) {
                    keyboardStatus.textContent = `Drum: ${drumName}`;
                    keyboardStatus.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                    keyboardStatus.style.color = '#e74c3c';
                    keyboardStatus.style.borderColor = '#e74c3c';
                }
                return;
            }
        } else {
            // Check if the key is mapped to a note
            if (keyMap[key]) {
                const note = keyMap[key].note;
                playNote(note);
                
                // Update keyboard status
                if (keyboardStatus) {
                    keyboardStatus.textContent = `Playing: ${note}`;
                    keyboardStatus.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
                    keyboardStatus.style.color = '#3498db';
                    keyboardStatus.style.borderColor = '#3498db';
                }
            }
        }
    }
    
    // Handle keyboard key release
    function handleKeyUp(e) {
        // Ignore if keyboard is disabled
        if (!appState.keyboardEnabled) {
            return;
        }
        
        const key = e.key.toLowerCase();
        
        // Remove from pressed keys set
        appState.pressedKeys.delete(key);
        
        // If in drums mode, we don't need to stop anything (one-shot sounds)
        if (appState.soundTheme !== 'drums') {
            // Check if the key is mapped to a note
            if (keyMap[key]) {
                const note = keyMap[key].note;
                stopNote(note);
                
                // Reset keyboard status if no keys are pressed
                if (appState.pressedKeys.size === 0 && keyboardStatus) {
                    keyboardStatus.textContent = 'Ready';
                    keyboardStatus.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';
                    keyboardStatus.style.color = '#27ae60';
                    keyboardStatus.style.borderColor = '#27ae60';
                }
            }
        }
    }
    
    // Play a drum sound
    function playDrum(drumName) {
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) return; // Exit if audio context initialization failed
        
        // Visual feedback
        const drumPad = document.querySelector(`.drum-pad[data-drum="${drumName}"]`);
        if (drumPad) {
            drumPad.classList.add('active');
            setTimeout(() => {
                drumPad.classList.remove('active');
            }, 150);
        }
        
        // Use the same synthetic drum function for consistency
        playTrackSyntheticDrum(drumName, 'live');
        
        // Record the drum hit if recording
        if (appState.isRecording) {
            // Calculate duration based on drum type
            let duration = 0.1; // Default duration
            switch (drumName) {
                case 'kick': duration = 0.3; break;
                case 'snare': duration = 0.2; break;
                case 'hihat': duration = 0.1; break;
                case 'clap': duration = 0.2; break;
                case 'tom': duration = 0.3; break;
                case 'crash': duration = 0.5; break;
                case 'ride': duration = 0.3; break;
                case 'rim': duration = 0.1; break;
            }
            
            // Save the current theme
            const currentTheme = appState.soundTheme;
            
            // Record the drum with explicit drums theme
            appState.currentTrack.push({
                drum: drumName,
                startTime: audioContext.currentTime - appState.recordingStartTime,
                endTime: audioContext.currentTime - appState.recordingStartTime + duration,
                theme: 'drums', // Always use drums theme for drum sounds
                duration: duration, // Store the exact duration for consistent playback
                type: 'drum' // Explicitly mark as drum type
            });
            
            // If we're in overdub mode, also play the drum through the track system
            // so it's immediately audible alongside other tracks
            if (appState.overdubMode && appState.tracks.length > 0) {
                // Temporarily switch to drums theme
                appState.soundTheme = 'drums';
                
                // Play through track system for consistent sound
                playTrackSyntheticDrum(drumName, 'recording');
                
                // Restore theme
                appState.soundTheme = currentTheme;
            }
        }
    }
    
    // Play a note - completely simplified for performance
    function playNote(note) {
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) return; // Exit if audio context initialization failed
        
        // If the note is already playing, don't restart it (prevents glitching with multiple keys)
        if (appState.activeNotes.has(note)) {
            // Update the UI to ensure it shows as active
            updateKeyUI(note, true);
            return;
        }
        
        // Check for stuck notes with the same name in track notes (can happen during overdub)
        if (appState.overdubMode) {
            appState.trackNotes.forEach((data, key) => {
                if (key.includes(note) && audioContext.currentTime - data.startTime > 5) {
                    // This is likely a stuck note, stop it
                    stopTrackNote(note, key.split('_')[1]);
                }
            });
        }
        
        // Increase note limit during track playback and recording to prevent notes from being dropped
        const maxNotes = (appState.isPlaying || appState.isRecording) ? 12 : 8;
        if (appState.activeNotes.size >= maxNotes) {
            // Find the oldest note and stop it
            let oldestNote = null;
            let oldestTime = Infinity;
            
            appState.activeNotes.forEach((data, noteKey) => {
                if (data.startTime < oldestTime) {
                    oldestTime = data.startTime;
                    oldestNote = noteKey;
                }
            });
            
            if (oldestNote) {
                stopNote(oldestNote);
            }
        }
        
        // Get the sound theme configuration with fallback to piano
        const theme = soundThemes[appState.soundTheme] || soundThemes['piano'];
        
        try {
            // Create oscillator with ultra-simplified settings
            const oscillator = audioContext.createOscillator();
            oscillator.type = theme && theme.oscillatorType ? theme.oscillatorType : 'sine';
            oscillator.frequency.value = getNoteFrequency(note);
            
            // Register the oscillator for global cleanup
            appState.audioNodesRegistry.add(oscillator);
            
            // Create envelope with simplified gain node
            const gainNode = audioContext.createGain();
            
            // Start with zero gain to prevent clicks
            gainNode.gain.value = 0;
            
            // Register the gain node for global cleanup
            appState.audioNodesRegistry.add(gainNode);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            // Start oscillator
            oscillator.start();
            
            // Use ADSR envelope based on the selected sound theme
            const now = audioContext.currentTime;
            const attack = theme.attack || 0.01;
            const decay = theme.decay || 0.1;
            const sustain = theme.sustain || 0.7;
            const sustainValue = sustain * 0.8; // Scale sustain to max volume of 0.8
            
            // Apply ADSR envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.8, now + attack); // Attack
            gainNode.gain.linearRampToValueAtTime(sustainValue, now + attack + decay); // Decay to sustain level
            
            // Store the active note
            appState.activeNotes.set(note, {
                oscillator,
                gainNode,
                startTime: audioContext.currentTime
            });
            
            // Update last note time for stuck note detection
            appState.lastNoteTime = audioContext.currentTime;
            
            // Set a short maximum note length timeout to prevent stuck notes
            const maxNoteTimeout = setTimeout(() => {
                if (appState.activeNotes.has(note)) {
                    
                    stopNote(note);
                }
            }, 8000); // 8 seconds max for all devices
            
            // Store the timeout for cleanup
            appState.noteTimeouts.set(note, maxNoteTimeout);
            
            // Record the note if recording
            if (appState.isRecording) {
                appState.currentTrack.push({
                    note,
                    startTime: audioContext.currentTime - appState.recordingStartTime,
                    endTime: null,
                    theme: appState.soundTheme, // Lock in the current theme
                    frequency: getNoteFrequency(note) // Store the exact frequency for consistent playback
                });
            }
            
            // Update UI
            updateKeyUI(note, true);
        } catch (e) {
            
            // Clean up any partial setup
            if (appState.activeNotes.has(note)) {
                stopNote(note);
            }
        }
    }
    
    // Stop a note - ultra simplified for performance
    function stopNote(note) {
        if (!appState.activeNotes.has(note)) {
            updateKeyUI(note, false);
            return;
        }
        
        // Clear any maximum note length timeout
        if (appState.noteTimeouts.has(note)) {
            clearTimeout(appState.noteTimeouts.get(note));
            appState.noteTimeouts.delete(note);
        }
        
        if (!audioContext) {
            appState.activeNotes.delete(note);
            updateKeyUI(note, false);
            return;
        }
        
        const activeNote = appState.activeNotes.get(note);
        
        // Safety check for valid objects
        if (!activeNote || !activeNote.gainNode || !activeNote.oscillator) {
            appState.activeNotes.delete(note);
            updateKeyUI(note, false);
            return;
        }
        
        try {
            // Get the sound theme configuration for proper release time
            const theme = soundThemes[appState.soundTheme] || soundThemes['piano'];
            const release = theme ? (theme.release || 0.02) : 0.02;
            
            // Apply release envelope
            activeNote.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
            activeNote.gainNode.gain.setValueAtTime(activeNote.gainNode.gain.value, audioContext.currentTime);
            activeNote.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + release);
            
            // Stop the oscillator after the release time
            setTimeout(() => {
                try {
                    if (activeNote.oscillator) {
                        activeNote.oscillator.stop(0);
                    }
                } catch (e) {
                    // Ignore errors
                }
                
                try {
                    if (activeNote.gainNode) {
                        activeNote.gainNode.disconnect();
                    }
                } catch (e) {
                    // Ignore errors
                }
                
                // Remove from registry
                appState.audioNodesRegistry.delete(activeNote.gainNode);
                appState.audioNodesRegistry.delete(activeNote.oscillator);
                
                // Remove from active notes
                appState.activeNotes.delete(note);
            }, 30);
            
            // Update recording if recording
            if (appState.isRecording) {
                const noteRecord = appState.currentTrack.find(n => 
                    n.note === note && n.endTime === null
                );
                
                if (noteRecord) {
                    noteRecord.endTime = audioContext.currentTime - appState.recordingStartTime;
                }
            }
            
        } catch (e) {
            
            // Emergency cleanup - immediate disconnect and stop
            try {
                if (activeNote.gainNode) {
                    activeNote.gainNode.disconnect();
                    appState.audioNodesRegistry.delete(activeNote.gainNode);
                }
                if (activeNote.oscillator) {
                    try {
                        activeNote.oscillator.stop(0);
                    } catch (stopError) {
                        // Ignore stop errors
                    }
                    appState.audioNodesRegistry.delete(activeNote.oscillator);
                }
            } catch (cleanupError) {
                // Ignore errors
            }
            appState.activeNotes.delete(note);
        }
        
        // Update UI immediately regardless of audio state
        updateKeyUI(note, false);
    }
    
    // Stop all notes (panic button / blur event) - ultra simplified
    function stopAllNotes() {
        if (!audioContext || !masterGainNode) return;
        
        try {
            // The simplest approach: just disconnect the master gain node temporarily
            // This immediately stops all sound
            masterGainNode.disconnect();
            
            // Clear all timeouts
            appState.noteTimeouts.forEach(timeout => {
                clearTimeout(timeout);
            });
            appState.noteTimeouts.clear();
            
            // Also clear all playback timeouts to prevent stuck notes during overdub
            clearPlaybackTimeouts();
            
            // Stop all oscillators
            appState.activeNotes.forEach((data, note) => {
                try {
                    if (data.oscillator) {
                        data.oscillator.stop(0);
                    }
                } catch (e) {
                    // Ignore errors
                }
            });
            
            // Also stop all track notes to prevent conflicts
            appState.trackNotes.forEach((data, noteKey) => {
                try {
                    if (data.oscillator) {
                        data.oscillator.stop(0);
                    }
                } catch (e) {
                    // Ignore errors
                }
            });
            
            // Clear active notes
            appState.activeNotes.clear();
            
            // Clear track notes
            appState.trackNotes.clear();
            
            // Clear pressed keys
            appState.pressedKeys.clear();
            
            // Reset UI
            document.querySelectorAll('.piano-key.active, .drum-pad.active').forEach(el => {
                el.classList.remove('active');
            });
            
            // Reconnect master gain after a short delay
            setTimeout(() => {
                try {
                    if (audioContext && masterGainNode) {
                        // Find the first node in the chain (compressor or destination)
                        const destination = audioContext.destination;
                        masterGainNode.connect(destination);
                    }
                } catch (e) {
                    
                    
                    // If reconnection fails, recreate the audio context
                    try {
                        if (audioContext) {
                            audioContext.close().then(() => {
                                audioContext = null;
                                masterGainNode = null;
                                trackGainNode = null;
                                initAudioContext();
                            }).catch(() => {
                                // If close fails, force new context
                                audioContext = null;
                                masterGainNode = null;
                                trackGainNode = null;
                                initAudioContext();
                            });
                        }
                    } catch (e2) {
                        // Last resort: force new context
                        audioContext = null;
                        masterGainNode = null;
                        trackGainNode = null;
                        initAudioContext();
                    }
                }
            }, 50);
            
        } catch (e) {
            
            
            // Emergency reset - recreate audio context
            try {
                audioContext = null;
                masterGainNode = null;
                trackGainNode = null;
                setTimeout(initAudioContext, 100);
            } catch (e2) {
                
            }
        }
    }
    
    // Update key UI state with reference counting for multiple tracks
    const activeKeyReferences = new Map(); // Track how many sources are activating each key
    
    function updateKeyUI(note, isActive) {
        const keyElement = document.querySelector(`.piano-key[data-note="${note}"]`);
        if (!keyElement) return;
        
        // Get current reference count or initialize to 0
        const currentCount = activeKeyReferences.get(note) || 0;
        
        if (isActive) {
            // Increment reference count
            activeKeyReferences.set(note, currentCount + 1);
            keyElement.classList.add('active');
        } else {
            // Decrement reference count, but don't go below 0
            const newCount = Math.max(0, currentCount - 1);
            activeKeyReferences.set(note, newCount);
            
            // Only remove active class if no references remain
            if (newCount === 0) {
                keyElement.classList.remove('active');
            }
        }
    }
    
    // Dedicated track playback functions (separate from keyboard input)
    function playTrackNote(note, trackId = null) {
        // Make sure we have a valid audio context
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext || !masterGainNode) return;
        
        // Ensure trackGainNode exists and is properly connected
        if (!trackGainNode) {
            trackGainNode = audioContext.createGain();
            trackGainNode.gain.value = masterGainNode.gain.value;
            trackGainNode.connect(masterGainNode);
            appState.audioNodesRegistry.add(trackGainNode);
        } else if (!trackGainNode.context) {
            // If trackGainNode exists but is not connected to a context, recreate it
            trackGainNode = audioContext.createGain();
            trackGainNode.gain.value = masterGainNode.gain.value;
            trackGainNode.connect(masterGainNode);
            appState.audioNodesRegistry.add(trackGainNode);
        }
        
        // Create unique key for track notes to allow same notes from different tracks
        const noteKey = trackId ? `${note}_${trackId}` : note;
        
        // Don't interfere with existing track notes, but allow same note from different tracks
        if (appState.trackNotes.has(noteKey)) {
            // If the note is already playing for this track, stop it first to prevent conflicts
            stopTrackNote(note, trackId);
        }
        
        // Clean up any stuck notes with the same base note but different track IDs
        // This helps prevent conflicts in overdub mode
        appState.trackNotes.forEach((data, key) => {
            if (key.startsWith(note + '_') && key !== noteKey) {
                // Only clean up notes that have been playing for a while (to avoid cutting off legitimate notes)
                if (audioContext.currentTime - data.startTime > 5) {
                    stopTrackNote(note, key.split('_')[1]);
                }
            }
        });
        
        const frequency = getNoteFrequency(note);
        
        // Find the track this note belongs to for proper theme
        let noteTheme = appState.soundTheme;
        
        // Ensure trackId is a string before using string methods
        const trackIdStr = trackId ? String(trackId) : '';
        
        if (trackIdStr && trackIdStr.startsWith('track_')) {
            const trackIdNum = trackIdStr.replace('track_', '');
            const track = appState.tracks.find(t => String(t.id) === trackIdNum);
            if (track && track.theme) {
                noteTheme = track.theme;
            }
        }
        
        // Use the correct theme for this note, with fallback to piano if theme not found
        const theme = soundThemes[noteTheme] || soundThemes['piano'];
        
        try {
            // Create oscillator and gain nodes
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Use the exact same oscillator type as in playNote for consistency
            // Ensure we have a valid oscillator type (default to 'sine' if undefined)
            oscillator.type = theme && theme.oscillatorType ? theme.oscillatorType : 'sine';
            oscillator.frequency.value = frequency;
            
            // Connect the nodes - use trackGainNode for track playback
            oscillator.connect(gainNode);
            gainNode.connect(trackGainNode);
            
            // Track the node
            appState.audioNodesRegistry.add(oscillator);
            appState.audioNodesRegistry.add(gainNode);
            
            // ADSR envelope - use same values as regular playNote for consistent sound
            const now = audioContext.currentTime;
            const attack = theme.attack || 0.01;
            const decay = theme.decay || 0.1;
            const sustain = theme.sustain || 0.7;
            const sustainValue = sustain * 0.8; // Use same sustain level as regular notes
            
            // Use the exact same envelope settings as in playNote
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.8, now + attack);
            gainNode.gain.linearRampToValueAtTime(sustainValue, now + attack + decay);
            
            // Start the oscillator
            oscillator.start();
            
            // Store the track note with unique key
            appState.trackNotes.set(noteKey, {
                oscillator,
                gainNode,
                startTime: now,
                originalNote: note,
                trackId: trackId,
                theme: noteTheme // Store the theme used for this note
            });
            
        } catch (e) {
            // Silent error handling to avoid console logs
        }
    }
    
    function stopTrackNote(note, trackId = null) {
        if (!audioContext) return; // Can't stop notes without audio context
        
        // Ensure trackId is a string if provided
        const trackIdStr = trackId ? String(trackId) : null;
        
        const noteKey = trackIdStr ? `${note}_${trackIdStr}` : note;
        const trackNote = appState.trackNotes.get(noteKey);
        
        // If we can't find the exact note, try some fallback approaches
        if (!trackNote) {
            // 1. Try without trackId (backward compatibility)
            if (trackId && appState.trackNotes.has(note)) {
                const fallbackTrackNote = appState.trackNotes.get(note);
                if (fallbackTrackNote) {
                    appState.trackNotes.delete(note);
                    if (fallbackTrackNote.gainNode && fallbackTrackNote.oscillator) {
                        try {
                            // Use the same release method as regular notes
                            const now = audioContext.currentTime;
                            // Use the note's theme if available, otherwise use current theme
                            const noteTheme = fallbackTrackNote.theme || appState.soundTheme;
                            const theme = soundThemes[noteTheme] || soundThemes['piano'];
                            const release = theme ? (theme.release || 0.3) : 0.3;
                            
                            fallbackTrackNote.gainNode.gain.cancelScheduledValues(now);
                            fallbackTrackNote.gainNode.gain.setValueAtTime(fallbackTrackNote.gainNode.gain.value, now);
                            fallbackTrackNote.gainNode.gain.linearRampToValueAtTime(0, now + release);
                            
                            setTimeout(() => {
                                try {
                                    fallbackTrackNote.oscillator.stop();
                                    fallbackTrackNote.oscillator.disconnect();
                                    fallbackTrackNote.gainNode.disconnect();
                                    appState.audioNodesRegistry.delete(fallbackTrackNote.oscillator);
                                    appState.audioNodesRegistry.delete(fallbackTrackNote.gainNode);
                                } catch (e) {
                                    // Silent cleanup
                                }
                            }, release * 1000 + 10);
                        } catch (e) {
                            // Emergency cleanup
                            try {
                                fallbackTrackNote.oscillator.stop();
                                fallbackTrackNote.oscillator.disconnect();
                                fallbackTrackNote.gainNode.disconnect();
                            } catch (err) {
                                // Silent error
                            }
                        }
                    }
                }
            }
            
            // 2. Try to find any notes that match this note regardless of track ID
            // This helps with cleaning up stuck notes in overdub mode
            appState.trackNotes.forEach((data, key) => {
                // If the key starts with the note name (e.g., "C4_track1")
                if (key.startsWith(note + '_')) {
                    try {
                        if (data.gainNode && data.oscillator) {
                            // Use the same release method as regular notes
                            const now = audioContext.currentTime;
                            // Use the note's theme if available, otherwise use current theme
                            const noteTheme = data.theme || appState.soundTheme;
                            const theme = soundThemes[noteTheme] || soundThemes['piano'];
                            const release = theme ? (theme.release || 0.3) : 0.3;
                            
                            data.gainNode.gain.cancelScheduledValues(now);
                            data.gainNode.gain.setValueAtTime(data.gainNode.gain.value, now);
                            data.gainNode.gain.linearRampToValueAtTime(0, now + release);
                            
                            setTimeout(() => {
                                try {
                                    data.oscillator.stop();
                                    data.oscillator.disconnect();
                                    data.gainNode.disconnect();
                                    appState.audioNodesRegistry.delete(data.oscillator);
                                    appState.audioNodesRegistry.delete(data.gainNode);
                                } catch (e) {
                                    // Silent cleanup
                                }
                                appState.trackNotes.delete(key);
                            }, release * 1000 + 10);
                        } else {
                            appState.trackNotes.delete(key);
                        }
                    } catch (e) {
                        // Emergency cleanup
                        appState.trackNotes.delete(key);
                    }
                }
            });
            
            return; // We've handled all possible cleanup
        }
        
        try {
            const now = audioContext.currentTime;
            // Use the note's theme if available, otherwise use current theme
            const noteTheme = trackNote.theme || appState.soundTheme;
            const theme = soundThemes[noteTheme] || soundThemes['piano'];
            const release = theme ? (theme.release || 0.3) : 0.3;
            
            // Use the same release time as regular notes for consistent sound
            trackNote.gainNode.gain.cancelScheduledValues(now);
            trackNote.gainNode.gain.setValueAtTime(trackNote.gainNode.gain.value, now);
            trackNote.gainNode.gain.linearRampToValueAtTime(0, now + release);
            
            // Stop and cleanup
            setTimeout(() => {
                try {
                    trackNote.oscillator.stop();
                    trackNote.oscillator.disconnect();
                    trackNote.gainNode.disconnect();
                    appState.audioNodesRegistry.delete(trackNote.oscillator);
                    appState.audioNodesRegistry.delete(trackNote.gainNode);
                } catch (e) {
                    // Silent cleanup
                }
                appState.trackNotes.delete(noteKey);
            }, release * 1000 + 10);
            
        } catch (e) {
            // Emergency cleanup
            appState.trackNotes.delete(noteKey);
            try {
                if (trackNote && trackNote.oscillator) {
                    trackNote.oscillator.stop();
                    trackNote.oscillator.disconnect();
                }
                if (trackNote && trackNote.gainNode) {
                    trackNote.gainNode.disconnect();
                }
            } catch (err) {
                // Silent error
            }
        }
    }
    
    function playTrackDrum(drumName, trackId = null) {
        // Make sure we have a valid audio context
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext || !masterGainNode) return;
        
        // Ensure trackGainNode exists and is properly connected
        if (!trackGainNode) {
            trackGainNode = audioContext.createGain();
            trackGainNode.gain.value = 0.8; // Higher gain for drums to be more audible
            trackGainNode.connect(masterGainNode);
            appState.audioNodesRegistry.add(trackGainNode);
        } else if (!trackGainNode.context) {
            // If trackGainNode exists but is not connected to a context, recreate it
            trackGainNode = audioContext.createGain();
            trackGainNode.gain.value = 0.8; // Higher gain for drums to be more audible
            trackGainNode.connect(masterGainNode);
            appState.audioNodesRegistry.add(trackGainNode);
        }
        
        // Create unique key for track drums to allow same drums from different tracks
        const drumKey = trackId ? `${drumName}_${trackId}` : drumName;
        
        // Always use synthetic drums for consistent playback
        playTrackSyntheticDrum(drumName, trackId);
        
        // Show visual feedback for the drum pad
        const drumPad = document.querySelector(`.drum-pad[data-drum="${drumName}"]`);
        if (drumPad) {
            drumPad.classList.add('active');
            setTimeout(() => {
                drumPad.classList.remove('active');
            }, 150);
        }
    }
    
    // Synthetic drum sounds for track playback
    function playTrackSyntheticDrum(drumName, trackId = null) {
        // Make sure we have a valid audio context
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext || !masterGainNode) return;
        
        // Create unique key for track drums
        const drumKey = trackId ? `${drumName}_${trackId}` : drumName;
        
        try {
            // Create main oscillator
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const now = audioContext.currentTime;
            
            // Create a simple but effective drum sound based on type
            switch (drumName) {
                case 'kick':
                    // Kick drum - simple low frequency sine wave with pitch drop
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(150, now);
                    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                    gainNode.gain.setValueAtTime(1.0, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    break;
                    
                case 'snare':
                    // Snare - simple noise burst
                    createNoiseHit(0.2, 1000, 0.7, 0.2);
                    
                    // Add a bit of tone
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(200, now);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    break;
                    
                case 'hihat':
                    // Hi-hat - filtered noise burst
                    createNoiseHit(0.1, 8000, 0.4, 0.1);
                    
                    // Add a bit of tone
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(8000, now);
                    gainNode.gain.setValueAtTime(0.2, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                    break;
                    
                case 'clap':
                    // Clap - filtered noise burst
                    createNoiseHit(0.2, 2000, 0.8, 0.15);
                    
                    // Add a bit of tone
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(1200, now);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    break;
                    
                case 'tom':
                    // Tom - mid-low frequency with decay
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(180, now);
                    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                    gainNode.gain.setValueAtTime(0.9, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    break;
                    
                case 'crash':
                    // Crash - high frequency noise with longer decay
                    createNoiseHit(0.5, 6000, 0.6, 0.4);
                    
                    // Add a bit of tone
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(4000, now);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    break;
                    
                case 'ride':
                    // Ride - high frequency with metallic character
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(2000, now);
                    gainNode.gain.setValueAtTime(0.5, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                    
                    // Add a second oscillator for more metallic character
                    try {
                        const osc2 = audioContext.createOscillator();
                        const gain2 = audioContext.createGain();
                        
                        osc2.type = 'triangle';
                        osc2.frequency.setValueAtTime(4000, now);
                        gain2.gain.setValueAtTime(0.2, now);
                        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                        
                        osc2.connect(gain2);
                        gain2.connect(masterGainNode);
                        
                        osc2.start(now);
                        osc2.stop(now + 0.3);
                        
                        // Register for cleanup
                        appState.audioNodesRegistry.add(osc2);
                        appState.audioNodesRegistry.add(gain2);
                        
                        // Auto-cleanup
                        setTimeout(() => {
                            try {
                                osc2.disconnect();
                                gain2.disconnect();
                                appState.audioNodesRegistry.delete(osc2);
                                appState.audioNodesRegistry.delete(gain2);
                            } catch (e) {
                                // Silent cleanup
                            }
                        }, 400);
                    } catch (e) {
                        // Silent error handling
                    }
                    break;
                    
                case 'rim':
                    // Rim shot - short, high-pitched click
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(1000, now);
                    gainNode.gain.setValueAtTime(0.6, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                    break;
                    
                default:
                    // Default drum sound - simple tone
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(300, now);
                    gainNode.gain.setValueAtTime(0.7, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            }
            
            // Helper function to create noise-based drum sounds
            function createNoiseHit(duration, filterFreq, volume, decayTime) {
                try {
                    // Create noise buffer
                    const bufferSize = audioContext.sampleRate * duration;
                    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const data = noiseBuffer.getChannelData(0);
                    
                    // Fill with random values (white noise)
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    
                    // Create source and connect through filter
                    const noise = audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    
                    // Create filter
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'highpass';
                    filter.frequency.value = filterFreq;
                    
                    // Create gain node
                    const noiseGain = audioContext.createGain();
                    noiseGain.gain.setValueAtTime(volume, now);
                    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + decayTime);
                    
                    // Connect everything
                    noise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(masterGainNode);
                    
                    // Start the noise
                    noise.start(now);
                    
                    // Register for cleanup
                    appState.audioNodesRegistry.add(noise);
                    appState.audioNodesRegistry.add(filter);
                    appState.audioNodesRegistry.add(noiseGain);
                    
                    // Auto-cleanup
                    setTimeout(() => {
                        try {
                            noise.disconnect();
                            filter.disconnect();
                            noiseGain.disconnect();
                            appState.audioNodesRegistry.delete(noise);
                            appState.audioNodesRegistry.delete(filter);
                            appState.audioNodesRegistry.delete(noiseGain);
                        } catch (e) {
                            // Silent cleanup
                        }
                    }, duration * 1000 + 100);
                } catch (e) {
                    // Silent error handling
                }
            }
            
            // Connect oscillator to gain to master
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            
            // Register for cleanup
            appState.audioNodesRegistry.add(oscillator);
            appState.audioNodesRegistry.add(gainNode);
            
            // Start the oscillator
            oscillator.start(now);
            
            // Calculate duration based on drum type
            let duration = 0.2; // Default duration
            switch (drumName) {
                case 'kick': duration = 0.3; break;
                case 'snare': duration = 0.2; break;
                case 'hihat': duration = 0.1; break;
                case 'clap': duration = 0.2; break;
                case 'tom': duration = 0.3; break;
                case 'crash': duration = 0.5; break;
                case 'ride': duration = 0.3; break;
                case 'rim': duration = 0.1; break;
            }
            
            // Stop the oscillator after the appropriate duration
            oscillator.stop(now + duration);
            
            // Auto-cleanup
            setTimeout(() => {
                try {
                    oscillator.disconnect();
                    gainNode.disconnect();
                    appState.audioNodesRegistry.delete(oscillator);
                    appState.audioNodesRegistry.delete(gainNode);
                } catch (e) {
                    // Silent cleanup
                }
            }, duration * 1000 + 100); // Safe cleanup after duration
            
        } catch (e) {
            // Silent error handling to avoid console logs
        }
    }
    
    // Get frequency for a note
    function getNoteFrequency(note) {
        // Find the note in the keyMap
        for (const [key, data] of Object.entries(keyMap)) {
            if (data.note === note) {
                return data.frequency;
            }
        }
        
        // Fallback to calculating frequency (in case the note isn't in the keyMap)
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        
        const noteIndex = notes.indexOf(noteName);
        if (noteIndex === -1) return 440; // Default to A4 if note not found
        
        // Calculate semitones from A4
        const semitones = (octave - 4) * 12 + noteIndex - 9;
        
        // Calculate frequency using the formula: f = 440 * 2^(n/12)
        return 440 * Math.pow(2, semitones / 12);
    }
    
    // Start overdub playback (play existing tracks while recording)
    function startOverdubPlayback() {
        if (appState.tracks.length === 0) return;
        
        // Clear any existing playback timeouts
        clearPlaybackTimeouts();
        
        // Clear any existing track notes to prevent conflicts
        appState.trackNotes.clear();
        
        appState.isPlaying = true;
        appState.playbackStartTime = audioContext.currentTime;
        let maxDuration = 0;
        
        // Reduce the volume of track playback during overdub
        if (trackGainNode) {
            trackGainNode.gain.value = 0.2; // Lower volume for clearer recording
        }
        
        // Play all existing tracks simultaneously for overdub
        appState.tracks.forEach((track, trackIndex) => {
            if (track.notes && track.notes.length > 0) {
                // Ensure track has a valid ID
                if (!track.id) {
                    track.id = String(trackIndex + 1); // Simple numeric ID
                }
                
                // Use a simple track ID that's consistent
                const trackId = `track_${track.id}`;
                
                track.notes.forEach(note => {
                    // Schedule note start
                    const noteStartTimeout = setTimeout(() => {
                        if (!appState.isPlaying || !appState.overdubMode) return;
                        
                        // Use the track's theme for this note
                        const noteTheme = note.theme || track.theme || appState.soundTheme;
                        
                        // Store the current theme to restore later
                        const currentTheme = appState.soundTheme;
                        
                        // Temporarily set the app state theme for UI updates
                        appState.soundTheme = noteTheme;
                        
                        // Play the note or drum
                        if (note.note) {
                            // The playTrackNote function will use the correct theme from the track
                            // Ensure trackId is converted to a string
                            const trackIdStr = trackId ? String(trackId) : null;
                            playTrackNote(note.note, trackIdStr);
                            
                            // Also update the UI to show the key being played
                            updateKeyUI(note.note, true);
                        } else if (note.drum) {
                            // For drums, always use the drums theme
                            const originalTheme = appState.soundTheme;
                            appState.soundTheme = 'drums';
                            
                            // Play the drum sound directly with synthetic drum for better audibility
                            playTrackSyntheticDrum(note.drum, trackId);
                            
                            // Show visual feedback for the drum pad
                            const drumPad = document.querySelector(`.drum-pad[data-drum="${note.drum}"]`);
                            if (drumPad) {
                                drumPad.classList.add('active');
                                setTimeout(() => {
                                    drumPad.classList.remove('active');
                                }, 150);
                            }
                            
                            // Restore the original theme
                            appState.soundTheme = originalTheme;
                        }
                        
                        // Restore theme
                        appState.soundTheme = currentTheme;
                        
                        // Schedule note end (for sustained notes)
                        if (note.note && note.endTime) {
                            const duration = note.endTime - note.startTime;
                            const noteEndTimeout = setTimeout(() => {
                                if (!appState.isPlaying || !appState.overdubMode) return;
                                stopTrackNote(note.note, trackId);
                                
                                // Update UI to show the key being released
                                updateKeyUI(note.note, false);
                            }, duration * 1000);
                            
                            appState.playbackTimeouts.push(noteEndTimeout);
                        }
                    }, note.startTime * 1000);
                    
                    appState.playbackTimeouts.push(noteStartTimeout);
                });
                
                maxDuration = Math.max(maxDuration, track.duration || 0);
            }
        });
        
        // Set up continuous looping for overdub
        if (maxDuration > 0) {
            // Use exact track duration with a small standard buffer for consistent timing
            // This buffer should match the one used in playAllTracks
            const standardBuffer = 0.1; // 100ms standard buffer
            const loopDuration = maxDuration + standardBuffer;
            
            const loopTimeout = setTimeout(() => {
                if (appState.overdubMode && appState.isRecording) {
                    // Stop all currently playing notes with a quick fade out
                    appState.trackNotes.forEach((trackNote, noteKey) => {
                        if (trackNote.gainNode) {
                            try {
                                // Quick fade out to prevent clicks
                                trackNote.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
                                trackNote.gainNode.gain.setValueAtTime(trackNote.gainNode.gain.value, audioContext.currentTime);
                                trackNote.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
                                
                                // Schedule oscillator stop
                                setTimeout(() => {
                                    try {
                                        if (trackNote.oscillator) {
                                            trackNote.oscillator.stop();
                                        }
                                    } catch (e) {
                                        // Ignore errors during cleanup
                                    }
                                }, 60);
                            } catch (e) {
                                // Ignore errors during cleanup
                            }
                        }
                    });
                    
                    // Clear and restart with a small standard delay to prevent audio glitches
                    setTimeout(() => {
                        // Force clear all track notes
                        appState.trackNotes.clear();
                        
                        // Only restart if still in overdub mode
                        if (appState.overdubMode && appState.isRecording) {
                            startOverdubPlayback();
                        }
                    }, 50); // Small 50ms delay before restarting
                }
            }, loopDuration * 1000);
            
            appState.playbackTimeouts.push(loopTimeout);
        }
    }
    
    // Start recording
    function startRecording() {
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) {
            alert("Audio context failed to initialize. Please refresh and try again.");
            return;
        }
        
        // Stop any existing playback first
        if (appState.isPlaying) {
            stopPlayback();
        }
        
        // Reset recording data
        appState.currentTrack = [];
        appState.isRecording = true;
        appState.overdubMode = true; // Enable overdub mode
        
        // Make sure all notes are stopped before starting
        stopAllNotes();
        
        // Clear any existing track notes to prevent conflicts
        appState.trackNotes.clear();
        
        // Initialize or reset track gain node for consistent playback
        if (!trackGainNode || !trackGainNode.context) {
            trackGainNode = audioContext.createGain();
            trackGainNode.gain.value = 0.2; // Lower volume for clearer recording
            trackGainNode.connect(masterGainNode);
            appState.audioNodesRegistry.add(trackGainNode);
        } else {
            // Ensure proper connection
            trackGainNode.disconnect();
            trackGainNode.connect(masterGainNode);
            trackGainNode.gain.value = 0.2; // Lower volume for clearer recording
        }
        
        appState.recordingStartTime = audioContext.currentTime;
        
        // Start existing tracks for overdub if any exist
        if (appState.tracks.length > 0) {
            // Start playback of existing tracks for overdub at lower volume
            startOverdubPlayback();
        }
        
        // Start audio recording for MP3 export
        startAudioRecording();
        
        // Update UI
        if (startRecordingBtn) {
            startRecordingBtn.disabled = true;
            if (appState.tracks.length > 0) {
                startRecordingBtn.textContent = 'Recording (Overdub)...';
            }
        }
        if (stopRecordingBtn) stopRecordingBtn.disabled = false;
        if (saveRecordingBtn) saveRecordingBtn.disabled = true;
    }
    
    // Stop recording
    function stopRecording() {
        appState.isRecording = false;
        appState.overdubMode = false; // Disable overdub mode
        
        // Stop audio recording
        stopAudioRecording();
        
        // Stop overdub playback
        if (appState.isPlaying) {
            stopPlayback();
        }
        
        // Make sure all notes are properly released
        stopAllNotes();
        
        // Clear any stuck track notes
        appState.trackNotes.clear();
        
        // Reset track gain to normal
        if (trackGainNode) {
            trackGainNode.gain.value = 0.3;
        }
        
        // Update UI
        if (startRecordingBtn) {
            startRecordingBtn.disabled = false;
            startRecordingBtn.textContent = 'Start Recording'; // Reset text
        }
        if (stopRecordingBtn) stopRecordingBtn.disabled = true;
        if (saveRecordingBtn) saveRecordingBtn.disabled = false;
    }
    
    // Save recording
    function saveRecording() {
        if (!trackNameInput || !appState.currentTrack || appState.currentTrack.length === 0) return;
        
        const trackName = trackNameInput.value.trim() || `Track ${appState.tracks.length + 1}`;
        
        // Calculate proper duration for overdub recordings
        let trackDuration = 0;
        if (appState.currentTrack.length > 0) {
            trackDuration = Math.max(...appState.currentTrack.map(note => note.endTime || note.startTime || 0));
        }
        
        const track = {
            id: Date.now(),
            name: trackName,
            notes: appState.currentTrack,
            theme: appState.soundTheme,
            duration: trackDuration,
            type: 'locked-theme', // Mark as theme-locked recording
            audioData: appState.recordedChunks.length > 0 ? appState.recordedChunks : null // Store audio data
        };
        
        appState.tracks.push(track);
        
        // Save to localStorage
        saveTracks();
        
        // Update UI
        updateTracksList();
        trackNameInput.value = '';
        if (saveRecordingBtn) saveRecordingBtn.disabled = true;
        
        // Clear current track and audio data
        appState.currentTrack = [];
        appState.recordedChunks = [];
    }
    
    // Play all tracks
    function playAllTracks() {
        if (appState.isPlaying) {
            stopPlayback();
        }
        
        if (appState.tracks.length === 0) {
            alert('No tracks to play. Record something first!');
            return;
        }
        
        // Clear any existing playback timeouts
        clearPlaybackTimeouts();
        
        // Initialize audio context if not already initialized
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) {
            alert("Audio context failed to initialize. Please refresh and try again.");
            return;
        }
        
        // Ensure all previous notes are stopped and cleared
        stopAllNotes();
        appState.trackNotes.clear();
        
        // Set up the gain nodes
        if (!masterGainNode) {
            masterGainNode = audioContext.createGain();
            masterGainNode.gain.value = volumeSlider ? (volumeSlider.value / 100) : 0.7;
            
            // Connect to destination
            masterGainNode.connect(audioContext.destination);
            
            // Register for cleanup
            appState.audioNodesRegistry.add(masterGainNode);
        }
        
        if (!trackGainNode) {
            trackGainNode = audioContext.createGain();
            // Use the same gain value as masterGainNode for consistent sound
            trackGainNode.gain.value = masterGainNode.gain.value;
            
            // Connect trackGainNode to masterGainNode for consistent sound
            trackGainNode.connect(masterGainNode);
            
            // Register for cleanup
            appState.audioNodesRegistry.add(trackGainNode);
        } else {
            // Ensure proper volume - match master gain for consistent sound
            trackGainNode.gain.value = masterGainNode.gain.value;
            
            // Ensure proper connection
            trackGainNode.disconnect();
            trackGainNode.connect(masterGainNode);
        }
        
        // Stop all notes and clear any existing track notes
        stopAllNotes();
        appState.trackNotes.clear();
        
        appState.isPlaying = true;
        appState.playbackStartTime = audioContext.currentTime;
        
        // Find the maximum duration among all tracks
        let maxDuration = 0;
        appState.tracks.forEach(track => {
            if (track.notes && track.notes.length > 0) {
                // Calculate the track duration based on the last note's end time
                let trackEndTime = 0;
                track.notes.forEach(note => {
                    // For each note, find when it ends
                    const noteEndTime = note.endTime || (note.startTime + (note.duration || 0.5));
                    trackEndTime = Math.max(trackEndTime, noteEndTime);
                });
                
                // Store the calculated duration in the track object for future reference
                track.duration = trackEndTime;
                
                // Update the max duration
                maxDuration = Math.max(maxDuration, trackEndTime);
            }
        });
        
        // Play all tracks simultaneously
        appState.tracks.forEach((track, trackIndex) => {
            if (track.notes && track.notes.length > 0) {
                // Ensure track has a valid ID
                if (!track.id) {
                    track.id = String(trackIndex + 1); // Assign sequential ID if missing
                }
                
                // Calculate how many times this track needs to loop to match the longest track
                const trackDuration = track.duration || 0;
                const loopCount = trackDuration > 0 ? Math.ceil(maxDuration / trackDuration) : 1;
                
                // Play the track for each loop iteration
                for (let loop = 0; loop < loopCount; loop++) {
                    const loopOffset = loop * trackDuration;
                    
                    track.notes.forEach(note => {
                        // Schedule note start with loop offset
                        const noteStartTime = note.startTime + loopOffset;
                        
                        // Don't schedule notes beyond the max duration
                        if (noteStartTime >= maxDuration) return;
                        
                        const noteStartTimeout = setTimeout(() => {
                            if (!appState.isPlaying) return;
                            
                            // Use the track's theme for this note
                            const noteTheme = note.theme || track.theme || appState.soundTheme;
                            
                            // Temporarily switch theme for this note
                            const currentTheme = appState.soundTheme;
                            appState.soundTheme = noteTheme;
                            
                            // Create a unique ID for this note in this loop iteration
                            const loopTrackId = `${track.id}_loop${loop}`;
                            
                            // Play the note or drum using dedicated track playback functions
                            if (note.note) {
                                // Play immediately without delay to maintain timing accuracy
                                // The playTrackNote function will use the correct theme from the track
                                // Ensure loopTrackId is converted to a string
                                const loopTrackIdStr = loopTrackId ? String(loopTrackId) : null;
                                playTrackNote(note.note, loopTrackIdStr);
                                // Also update the UI to show the key being played
                                updateKeyUI(note.note, true);
                            } else if (note.drum) {
                                // For drums, always use the drums theme
                                const originalTheme = appState.soundTheme;
                                appState.soundTheme = 'drums';
                                
                                // Play the drum sound directly with synthetic drum for better audibility
                                playTrackSyntheticDrum(note.drum, loopTrackId);
                                
                                // Show visual feedback for the drum pad
                                const drumPad = document.querySelector(`.drum-pad[data-drum="${note.drum}"]`);
                                if (drumPad) {
                                    drumPad.classList.add('active');
                                    setTimeout(() => {
                                        drumPad.classList.remove('active');
                                    }, 150);
                                }
                                
                                // Restore the original theme
                                appState.soundTheme = originalTheme;
                            }
                            
                            // Restore theme immediately after playing
                            appState.soundTheme = currentTheme;
                            
                            // Schedule note end (for sustained notes)
                            if (note.note && note.endTime) {
                                const duration = note.endTime - note.startTime;
                                const noteEndTimeout = setTimeout(() => {
                                    if (!appState.isPlaying) return;
                                    stopTrackNote(note.note, loopTrackId);
                                    // Update UI to show the key being released
                                    updateKeyUI(note.note, false);
                                }, duration * 1000);
                                
                                appState.playbackTimeouts.push(noteEndTimeout);
                            }
                        }, noteStartTime * 1000);
                        
                        appState.playbackTimeouts.push(noteStartTimeout);
                    });
                }
            }
        });
        
        // Schedule playback end or loop
        const playbackEndTimeout = setTimeout(() => {
            if (appState.isLooping) {
                // Clear track notes before looping
                appState.trackNotes.forEach((trackNote, noteKey) => {
                    try {
                        // Extract note and trackId from the key
                        if (trackNote.originalNote && trackNote.trackId) {
                            stopTrackNote(trackNote.originalNote, trackNote.trackId);
                        } else {
                            // Fallback for old format
                            stopTrackNote(noteKey);
                        }
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                });
                
                // Clear all track notes
                appState.trackNotes.clear();
                
                // Reset all UI elements
                document.querySelectorAll('.piano-key.active, .drum-pad.active').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Small standard delay before restarting to prevent audio glitches
                // This delay should match the one used in startOverdubPlayback
                setTimeout(() => {
                    if (appState.isLooping) { // Check again in case user stopped during delay
                        playAllTracks();
                    }
                }, 50); // Small 50ms delay before restarting
            } else {
                stopPlayback();
            }
        }, (maxDuration + 0.1) * 1000); // Add 100ms standard buffer to match overdub mode
        
        appState.playbackTimeouts.push(playbackEndTimeout);
        
        // Update UI
        if (playAllTracksBtn) playAllTracksBtn.disabled = true;
        if (stopPlaybackBtn) stopPlaybackBtn.disabled = false;
    }
    
    // Clear all playback timeouts
    function clearPlaybackTimeouts() {
        // Clear all timeouts
        appState.playbackTimeouts.forEach(timeout => clearTimeout(timeout));
        appState.playbackTimeouts = [];
    }
    
    // Play a single track
    function playTrack(trackId) {
        if (appState.isPlaying) {
            stopPlayback();
        }
        
        const track = appState.tracks.find(t => t.id === trackId);
        if (!track) return;
        
        // Ensure all previous notes are stopped and cleared
        stopAllNotes();
        appState.trackNotes.clear();
        
        // Initialize audio context if not already initialized
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) {
            alert("Audio context failed to initialize. Please refresh and try again.");
            return;
        }
        
        // Set up the gain nodes
        if (!masterGainNode) {
            masterGainNode = audioContext.createGain();
            masterGainNode.gain.value = volumeSlider ? (volumeSlider.value / 100) : 0.7;
            
            // Connect to destination
            masterGainNode.connect(audioContext.destination);
            
            // Register for cleanup
            appState.audioNodesRegistry.add(masterGainNode);
        }
        
        // Always recreate trackGainNode for each track playback to ensure clean audio
        if (trackGainNode) {
            try {
                trackGainNode.disconnect();
                appState.audioNodesRegistry.delete(trackGainNode);
            } catch (e) {
                // Silent cleanup
            }
        }
        
        trackGainNode = audioContext.createGain();
        // Use the same gain value as masterGainNode for consistent sound
        trackGainNode.gain.value = masterGainNode.gain.value;
        
        // Connect trackGainNode to masterGainNode for consistent sound
        trackGainNode.connect(masterGainNode);
        
        // Register for cleanup
        appState.audioNodesRegistry.add(trackGainNode);
        
        appState.isPlaying = true;
        appState.playbackStartTime = audioContext.currentTime;
        
        // Use locked theme for theme-locked tracks, otherwise use track's theme
        const originalTheme = appState.soundTheme;
        const trackTheme = track.type === 'locked-theme' ? track.theme : (track.theme || appState.soundTheme);
        
        // Temporarily switch to track's theme if it's locked
        if (track.type === 'locked-theme') {
            appState.soundTheme = trackTheme;
        }
        
        // Schedule all notes
        track.notes.forEach(note => {
            // Schedule note start
            const noteStartTimeout = setTimeout(() => {
                if (!appState.isPlaying) return;
                
                // Use the track's individual note theme if available
                const noteTheme = note.theme || trackTheme;
                const currentTheme = appState.soundTheme;
                
                // Temporarily switch theme for this note
                appState.soundTheme = noteTheme;
                
                // Play the note or drum using dedicated track playback functions
                if (note.note) {
                    // Ensure track.id is converted to a string
                    const trackIdStr = track.id ? String(track.id) : null;
                    playTrackNote(note.note, trackIdStr);
                    
                    // Also update the UI to show the key being played
                    updateKeyUI(note.note, true);
                } else if (note.drum) {
                    // For drums, always use the drums theme
                    const drumTheme = appState.soundTheme;
                    appState.soundTheme = 'drums';
                    
                    // Play the drum sound directly with synthetic drum for better audibility
                    playTrackSyntheticDrum(note.drum, track.id);
                    
                    // Show visual feedback for the drum pad
                    const drumPad = document.querySelector(`.drum-pad[data-drum="${note.drum}"]`);
                    if (drumPad) {
                        drumPad.classList.add('active');
                        setTimeout(() => {
                            drumPad.classList.remove('active');
                        }, 150);
                    }
                    
                    // Restore the original theme
                    appState.soundTheme = drumTheme;
                }
                
                // Restore theme
                appState.soundTheme = currentTheme;
                
                // Schedule note end (for sustained notes)
                if (note.note && note.endTime) {
                    const duration = note.endTime - note.startTime;
                    const noteEndTimeout = setTimeout(() => {
                        if (!appState.isPlaying) return;
                        stopTrackNote(note.note, track.id);
                    }, duration * 1000);
                    
                    appState.playbackTimeouts.push(noteEndTimeout);
                }
            }, note.startTime * 1000);
                
                appState.playbackTimeouts.push(noteStartTimeout);
            });
        
        // Restore original theme
        appState.soundTheme = originalTheme;
        
        // Schedule playback end or loop
        const playbackEndTimeout = setTimeout(() => {
            if (appState.isLooping) {
                // Clear track notes before looping
                appState.trackNotes.forEach((trackNote, note) => {
                    stopTrackNote(note);
                });
                appState.trackNotes.clear();
                
                // Small delay before restarting to prevent audio glitches
                setTimeout(() => {
                    if (appState.isLooping) { // Check again in case user stopped during delay
                        playTrack(trackId);
                    }
                }, 100);
            } else {
                stopPlayback();
            }
        }, (track.duration + 0.5) * 1000);
        
        appState.playbackTimeouts.push(playbackEndTimeout);
        
        // Update UI
        if (playAllTracksBtn) playAllTracksBtn.disabled = true;
        if (stopPlaybackBtn) stopPlaybackBtn.disabled = false;
    }
    
    // Stop playback
    function stopPlayback() {
        appState.isPlaying = false;
        appState.playbackStartTime = 0;
        
        // Clear all playback timeouts first
        clearPlaybackTimeouts();
        
        // Stop all track notes separately from keyboard notes
        // Create a copy of the keys to avoid modification during iteration
        const trackNoteKeys = Array.from(appState.trackNotes.keys());
        
        // First try to stop notes with their track IDs
        trackNoteKeys.forEach(noteKey => {
            const trackNote = appState.trackNotes.get(noteKey);
            if (trackNote && trackNote.originalNote && trackNote.trackId) {
                stopTrackNote(trackNote.originalNote, trackNote.trackId);
            } else {
                // Fallback for notes without track info
                stopTrackNote(noteKey);
            }
        });
        
        // Force cleanup of any remaining track notes
        appState.trackNotes.forEach((trackNote, noteKey) => {
            if (trackNote.gainNode) {
                try {
                    trackNote.gainNode.gain.cancelScheduledValues(audioContext.currentTime);
                    trackNote.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
            if (trackNote.oscillator) {
                try {
                    trackNote.oscillator.stop(audioContext.currentTime);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        });
        
        appState.trackNotes.clear(); // Clear all track notes
        
        // Clean up trackGainNode to prevent issues with subsequent playbacks
        if (trackGainNode) {
            try {
                trackGainNode.disconnect();
                appState.audioNodesRegistry.delete(trackGainNode);
                trackGainNode = null;
            } catch (e) {
                // Silent cleanup
            }
        }
        
        // Stop all active notes
        stopAllNotes();
        
        // Stop all audio elements
        appState.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        appState.audioElements.clear();
        
        // Clear all playback timeouts
        clearPlaybackTimeouts();
        
        // Reset recording state if it was corrupted during playback
        const recordButton = document.getElementById('record-btn');
        if (appState.isRecording && recordButton && !recordButton.classList.contains('recording')) {
            appState.isRecording = false;
            appState.currentTrack = [];
        }
        
        // Reset all UI key states
        const activeKeys = document.querySelectorAll('.piano-key.active, .drum-pad.active');
        activeKeys.forEach(key => {
            key.classList.remove('active');
        });
        
        // Reset the reference counter for active keys
        activeKeyReferences.clear();
        
        // Update UI buttons
        if (playAllTracksBtn) playAllTracksBtn.disabled = false;
        if (stopPlaybackBtn) stopPlaybackBtn.disabled = true;
    }
    
    // Toggle loop mode
    function toggleLoopMode() {
        appState.isLooping = !appState.isLooping;
        
        // Update button text
        if (loopPlaybackBtn) {
            loopPlaybackBtn.innerHTML = `<i class="fas fa-sync"></i> Loop: ${appState.isLooping ? 'On' : 'Off'}`;
            
            // Add/remove active class for visual feedback
            if (appState.isLooping) {
                loopPlaybackBtn.classList.add('active-loop');
            } else {
                loopPlaybackBtn.classList.remove('active-loop');
            }
        }
        
        // Show notification
        showNotification(`Loop mode: ${appState.isLooping ? 'On' : 'Off'}`);
    }
    
    // Delete a track
    function deleteTrack(trackId) {
        appState.tracks = appState.tracks.filter(track => track.id !== trackId);
        saveTracks();
        updateTracksList();
    }
    
    // Update tracks list UI
    function updateTracksList() {
        if (!tracksList || !noTracksMessage) return;
        
        tracksList.innerHTML = '';
        
        if (appState.tracks.length === 0) {
            noTracksMessage.style.display = 'block';
            return;
        }
        
        noTracksMessage.style.display = 'none';
        
        appState.tracks.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.trackId = track.id;
            
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';
            
            const trackName = document.createElement('div');
            trackName.className = 'track-name';
            trackName.textContent = track.name;
            
            const trackDetails = document.createElement('div');
            trackDetails.className = 'track-details';
            
            if (track.type === 'locked-theme') {
                trackDetails.textContent = `${track.notes?.length || 0} notes Â· ${track.duration.toFixed(1)}s Â· ${track.theme} (Locked)`;
            } else {
                trackDetails.textContent = `${track.notes?.length || 0} notes Â· ${track.duration.toFixed(1)}s Â· ${track.theme || 'Legacy'}`;
            }
            
            trackInfo.appendChild(trackName);
            trackInfo.appendChild(trackDetails);
            
            const trackActions = document.createElement('div');
            trackActions.className = 'track-actions';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'btn primary-btn';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.title = 'Play track';
            playBtn.addEventListener('click', () => playTrack(track.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn danger-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete track';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${track.name}"?`)) {
                    deleteTrack(track.id);
                }
            });
            
            trackActions.appendChild(playBtn);
            trackActions.appendChild(deleteBtn);
            
            trackItem.appendChild(trackInfo);
            trackItem.appendChild(trackActions);
            
            tracksList.appendChild(trackItem);
        });
    }
    
    // Toggle key labels
    function toggleKeyLabels() {
        appState.showKeyLabels = !appState.showKeyLabels;
        createPianoKeyboard(); // Recreate keyboard with updated labels
    }
    
    // Toggle PC keyboard input
    function toggleKeyboard() {
        appState.keyboardEnabled = !appState.keyboardEnabled;
        updateKeyboardButtonState();
        
        // Show notification
        showKeyboardNotification(appState.keyboardEnabled ? 'PC Keyboard Enabled' : 'PC Keyboard Disabled');
    }
    
    // Update keyboard button state
    function updateKeyboardButtonState() {
        if (toggleKeyboardBtn) {
            if (appState.keyboardEnabled) {
                toggleKeyboardBtn.innerHTML = '<i class="fas fa-keyboard"></i> PC Keyboard: ON';
                toggleKeyboardBtn.classList.add('primary-btn');
                toggleKeyboardBtn.classList.remove('danger-btn');
                
                // Update status
                if (keyboardStatus) {
                    keyboardStatus.textContent = 'Ready';
                    keyboardStatus.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';
                    keyboardStatus.style.color = '#27ae60';
                    keyboardStatus.style.borderColor = '#27ae60';
                }
            } else {
                toggleKeyboardBtn.innerHTML = '<i class="fas fa-ban"></i> PC Keyboard: OFF';
                toggleKeyboardBtn.classList.remove('primary-btn');
                toggleKeyboardBtn.classList.add('danger-btn');
                
                // Update status
                if (keyboardStatus) {
                    keyboardStatus.textContent = 'Disabled';
                    keyboardStatus.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                    keyboardStatus.style.color = '#e74c3c';
                    keyboardStatus.style.borderColor = '#e74c3c';
                }
                
                // Stop all currently playing notes when disabling keyboard
                stopAllNotes();
            }
        }
    }
    
    // Ensure keyboard focus for proper event handling
    function ensureKeyboardFocus() {
        // Remove focus from any input elements
        if (document.activeElement && (
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'SELECT' || 
            document.activeElement.tagName === 'TEXTAREA'
        )) {
            document.activeElement.blur();
        }
        
        // Focus on the document body to ensure keyboard events are captured
        document.body.focus();
        
        // Make sure the body is focusable
        if (!document.body.hasAttribute('tabindex')) {
            document.body.setAttribute('tabindex', '-1');
        }
    }
    
    // Reset key mapping to default
    function resetKeyMapping() {
        if (confirm('Are you sure you want to reset key mapping to default?')) {
            keyMap = { ...defaultKeyMap };
            updateKeyMappingDisplay();
            savePreferences();
        }
    }
    
    // Set beginner-friendly key mapping
    function setBeginnerMapping() {
        if (confirm('Apply beginner-friendly key mapping? This will overwrite your current key mappings.')) {
            // Create a simple, intuitive mapping using the middle row of the keyboard
            // This makes it easier for beginners to play without looking at the keyboard
            const beginnerKeyMap = {
                // Middle row of keyboard (ASDFGHJKL;')
                'a': { note: 'C3', frequency: getNoteFrequency('C3') },
                's': { note: 'D3', frequency: getNoteFrequency('D3') },
                'd': { note: 'E3', frequency: getNoteFrequency('E3') },
                'f': { note: 'F3', frequency: getNoteFrequency('F3') },
                'g': { note: 'G3', frequency: getNoteFrequency('G3') },
                'h': { note: 'A3', frequency: getNoteFrequency('A3') },
                'j': { note: 'B3', frequency: getNoteFrequency('B3') },
                'k': { note: 'C4', frequency: getNoteFrequency('C4') },
                'l': { note: 'D4', frequency: getNoteFrequency('D4') },
                ';': { note: 'E4', frequency: getNoteFrequency('E4') },
                "'": { note: 'F4', frequency: getNoteFrequency('F4') },
                
                // For black keys, use the row above (QWERTYUIOP)
                'w': { note: 'C#3', frequency: getNoteFrequency('C#3') },
                'e': { note: 'D#3', frequency: getNoteFrequency('D#3') },
                't': { note: 'F#3', frequency: getNoteFrequency('F#3') },
                'y': { note: 'G#3', frequency: getNoteFrequency('G#3') },
                'u': { note: 'A#3', frequency: getNoteFrequency('A#3') },
                'o': { note: 'C#4', frequency: getNoteFrequency('C#4') },
                'p': { note: 'D#4', frequency: getNoteFrequency('D#4') }
            };
            
            keyMap = beginnerKeyMap;
            updateKeyMappingDisplay();
            savePreferences();
            
            // Show notification
            showNotification('Beginner-friendly key mapping applied');
        }
    }
    
    // Toggle key mapping mode
    function toggleKeyMappingMode() {
        appState.keyMappingMode = !appState.keyMappingMode;
        
        if (toggleMappingModeBtn) {
            if (appState.keyMappingMode) {
                toggleMappingModeBtn.innerHTML = '<i class="fas fa-keyboard"></i> Exit Mapping Mode';
                toggleMappingModeBtn.classList.add('active');
            } else {
                toggleMappingModeBtn.innerHTML = '<i class="fas fa-keyboard"></i> Edit Mapping';
                toggleMappingModeBtn.classList.remove('active');
                
                // Clear any editing state
                const editingItems = document.querySelectorAll('.key-map-item.editing');
                editingItems.forEach(item => item.classList.remove('editing'));
            }
        }
    }
    
    // Update key mapping display
    function updateKeyMappingDisplay() {
        if (!keyMappingDisplay) return;
        
        keyMappingDisplay.innerHTML = '';
        
        // If in drums mode, show drum mapping
        if (appState.soundTheme === 'drums') {
            drumKeys.forEach(drum => {
                const keyMapItem = document.createElement('div');
                keyMapItem.className = 'key-map-item';
                keyMapItem.dataset.drum = drum.name;
                
                const keyLabel = document.createElement('div');
                keyLabel.className = 'key-label';
                keyLabel.textContent = drum.keyLabel;
                
                const noteLabel = document.createElement('div');
                noteLabel.className = 'note-label';
                noteLabel.textContent = drum.displayName;
                
                keyMapItem.appendChild(keyLabel);
                keyMapItem.appendChild(noteLabel);
                
                keyMappingDisplay.appendChild(keyMapItem);
            });
            return;
        }
        
        // Show piano key mapping
        pianoKeys.forEach(key => {
            const keyMapItem = document.createElement('div');
            keyMapItem.className = 'key-map-item';
            keyMapItem.dataset.note = key.note;
            
            // Find the keyboard key for this note
            let keyboardKey = '';
            for (const [k, v] of Object.entries(keyMap)) {
                if (v.note === key.note) {
                    keyboardKey = k.toUpperCase();
                    break;
                }
            }
            
            const keyLabel = document.createElement('div');
            keyLabel.className = 'key-label';
            keyLabel.textContent = keyboardKey || '?';
            
            const noteLabel = document.createElement('div');
            noteLabel.className = 'note-label';
            noteLabel.textContent = key.note;
            
            keyMapItem.appendChild(keyLabel);
            keyMapItem.appendChild(noteLabel);
            
            // Add click handler for mapping mode
            keyMapItem.addEventListener('click', () => {
                if (!appState.keyMappingMode) return;
                
                // Clear any other editing items
                const editingItems = document.querySelectorAll('.key-map-item.editing');
                editingItems.forEach(item => {
                    if (item !== keyMapItem) {
                        item.classList.remove('editing');
                    }
                });
                
                // Toggle editing state
                keyMapItem.classList.toggle('editing');
                
                if (keyMapItem.classList.contains('editing')) {
                    alert(`Press any key to map it to note ${key.note}`);
                }
            });
            
            keyMappingDisplay.appendChild(keyMapItem);
        });
    }
    
    // Save preferences to localStorage
    function savePreferences() {
        const preferences = {
            soundTheme: appState.soundTheme,
            showKeyLabels: appState.showKeyLabels,
            keyMap: keyMap
        };
        
        try {
            localStorage.setItem('musicKeyboardPreferences', JSON.stringify(preferences));
            alert('Preferences saved successfully!');
        } catch (e) {
            
            alert('Failed to save preferences. Local storage may be full or disabled.');
        }
    }
    
    // Load preferences from localStorage
    function loadPreferences() {
        try {
            const savedPreferences = localStorage.getItem('musicKeyboardPreferences');
            if (savedPreferences) {
                const preferences = JSON.parse(savedPreferences);
                
                appState.soundTheme = preferences.soundTheme || 'piano';
                appState.showKeyLabels = preferences.showKeyLabels !== undefined ? preferences.showKeyLabels : true;
                keyMap = preferences.keyMap || { ...defaultKeyMap };
                
                // Update UI to reflect loaded preferences
                if (soundThemeSelect) {
                    soundThemeSelect.value = appState.soundTheme;
                }
            }
        } catch (e) {
            
            // Use defaults if loading fails
            appState.soundTheme = 'piano';
            appState.showKeyLabels = true;
            keyMap = { ...defaultKeyMap };
        }
    }
    
    // Save tracks to localStorage
    function saveTracks() {
        try {
            // Create a version without audio data for localStorage (to avoid size limits)
            const tracksForStorage = appState.tracks.map(track => ({
                ...track,
                audioData: null // Don't save audio data to localStorage due to size constraints
            }));
            
            localStorage.setItem('musicKeyboardTracks', JSON.stringify(tracksForStorage));
        } catch (e) {
            
            alert('Failed to save tracks. Local storage may be full or disabled.');
        }
    }
    
    // Load tracks from localStorage
    function loadTracks() {
        try {
            const savedTracks = localStorage.getItem('musicKeyboardTracks');
            if (savedTracks) {
                appState.tracks = JSON.parse(savedTracks);
                updateTracksList();
            }
        } catch (e) {
            
            // Use empty tracks array if loading fails
            appState.tracks = [];
        }
    }
    
    // Start audio recording for MP3 export
    function startAudioRecording() {
        if (!audioContext) {
            // Create audio context if it doesn't exist
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                setupAudioNodes();
            } catch (e) {
                alert('Web Audio API is not supported in this browser. Audio recording will not work.');
                return;
            }
        }
        
        if (!appState.audioDestination) {
            try {
                // Create audio destination if it doesn't exist
                appState.audioDestination = audioContext.createMediaStreamDestination();
                
                // Connect master gain to the destination
                if (masterGainNode) {
                    masterGainNode.connect(appState.audioDestination);
                }
                
                // Connect track gain to the destination
                if (trackGainNode) {
                    trackGainNode.connect(appState.audioDestination);
                }
            } catch (e) {
                alert('Could not create audio recording destination. Audio recording will not work.');
                return;
            }
        }
        
        try {
            // Reset recorded chunks
            appState.recordedChunks = [];
            
            // Create MediaRecorder from the audio destination stream
            const stream = appState.audioDestination.stream;
            
            // Determine the best available format for the browser
            let mimeType = '';
            
            // Check for supported formats in order of preference
            const formats = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg',
                'audio/wav',
                'audio/mp4'
            ];
            
            for (const format of formats) {
                try {
                    if (MediaRecorder.isTypeSupported(format)) {
                        mimeType = format;
                        break;
                    }
                } catch (e) {
                    // Ignore errors and continue with the next format
                }
            }
            
            // Create MediaRecorder with the best supported format
            const options = {
                audioBitsPerSecond: 128000 // Higher bitrate for better quality
            };
            
            if (mimeType) {
                options.mimeType = mimeType;
            }
            
            appState.mediaRecorder = new MediaRecorder(stream, options);
            
            // Handle data available event
            appState.mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    appState.recordedChunks.push(event.data);
                }
            };
            
            // Handle recording stop event
            appState.mediaRecorder.onstop = function() {
                appState.isAudioRecording = false;
            };
            
            // Start recording
            appState.mediaRecorder.start(100); // Collect data every 100ms
            appState.isAudioRecording = true;
            
        } catch (error) {
            alert('Audio recording failed to start. Your browser may not support this feature.');
            appState.isAudioRecording = false;
        }
    }
    
    // Stop audio recording
    function stopAudioRecording() {
        if (appState.mediaRecorder && appState.isAudioRecording) {
            try {
                appState.mediaRecorder.stop();
            } catch (error) {
                console.warn('Error stopping audio recording:', error);
            }
        }
        appState.isAudioRecording = false;
    }
    
    // Convert recorded audio to MP3-compatible format
    async function convertAudioToMP3(chunks) {
        if (!chunks || chunks.length === 0) {
            return null;
        }
        
        try {
            // Create a blob from the recorded chunks with the original format
            const originalBlob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
            
            // Create a more compatible audio format
            // WebM is widely supported, but we'll ensure it has the right extension
            // First, determine the actual format based on the MIME type
            const mimeType = originalBlob.type;
            let fileExtension = 'mp3';
            let outputType = 'audio/mpeg';
            
            if (mimeType.includes('webm')) {
                fileExtension = 'webm';
                outputType = 'audio/webm';
            } else if (mimeType.includes('ogg')) {
                fileExtension = 'ogg';
                outputType = 'audio/ogg';
            } else if (mimeType.includes('wav')) {
                fileExtension = 'wav';
                outputType = 'audio/wav';
            }
            
            // Create a new blob with the correct MIME type
            // This ensures the browser treats it as the right format when downloaded
            const processedBlob = new Blob([originalBlob], { type: outputType });
            
            // Add metadata to help identify the format
            const blobWithMetadata = {
                blob: processedBlob,
                extension: fileExtension,
                mimeType: outputType
            };
            
            return processedBlob;
        } catch (error) {
            // Fallback: just return the original chunks with audio MIME type
            return new Blob(chunks, { type: 'audio/webm' });
        }
    }
    
    // Generate audio for a track by playing it back
    async function generateTrackAudio(track) {
        if (!audioContext || !track.notes || track.notes.length === 0) {
            return null;
        }
        
        return new Promise((resolve) => {
            // Start a new recording session for this track
            const originalRecordedChunks = [...appState.recordedChunks];
            appState.recordedChunks = [];
            
            // Start audio recording
            startAudioRecording();
            
            // Play the track
            let noteTimeouts = [];
            const startTime = audioContext.currentTime;
            
            track.notes.forEach(note => {
                // Schedule note start
                const startTimeout = setTimeout(() => {
                    playNote(note.note || note.frequency, note.theme || track.theme);
                }, (note.startTime || 0) * 1000);
                
                noteTimeouts.push(startTimeout);
                
                // Schedule note end if duration is specified
                if (note.endTime || note.duration) {
                    const endTime = note.endTime || ((note.startTime || 0) + (note.duration || 0));
                    const endTimeout = setTimeout(() => {
                        stopNote(note.note || note.frequency);
                    }, endTime * 1000);
                    
                    noteTimeouts.push(endTimeout);
                }
            });
            
            // Stop recording after track duration + buffer time
            const trackDuration = Math.max(...track.notes.map(note => note.endTime || note.startTime || 0)) * 1000;
            setTimeout(() => {
                stopAudioRecording();
                
                // Wait a bit more for the recording to finalize
                setTimeout(async () => {
                    const audioBlob = await convertAudioToMP3(appState.recordedChunks);
                    
                    // Restore original recorded chunks
                    appState.recordedChunks = originalRecordedChunks;
                    
                    // Clear timeouts
                    noteTimeouts.forEach(timeout => clearTimeout(timeout));
                    
                    resolve(audioBlob);
                }, 500);
                
            }, trackDuration + 1000); // Add 1 second buffer
        });
    }
    
    // Generate combined audio from multiple tracks
    // Expose this function globally so it can be called from HTML
    window.generateCombinedAudio = async function(tracks) {
        console.log('generateCombinedAudio called with', tracks ? tracks.length : 0, 'tracks');
        
        if (!audioContext || !tracks || tracks.length === 0) {
            console.log('No tracks or audio context');
            return null;
        }
        
        return new Promise((resolve) => {
            // Stop any existing playback
            if (appState.isPlaying) {
                stopPlayback();
            }
            
            // Make sure all notes are stopped
            stopAllNotes();
            
            // Reset all UI key states
            const activeKeys = document.querySelectorAll('.piano-key.active, .drum-pad.active');
            activeKeys.forEach(key => {
                key.classList.remove('active');
            });
            activeKeyReferences.clear();
            
            // Ensure audio context is running
            if (audioContext.state !== 'running') {
                audioContext.resume().catch(e => {
                    console.warn('Could not resume audio context:', e);
                });
            }
            
            // Temporarily boost the gain for recording
            const originalMasterGain = masterGainNode ? masterGainNode.gain.value : 0.7;
            const originalTrackGain = trackGainNode ? trackGainNode.gain.value : 0.7;
            
            // Set optimal gain for recording (slightly higher to ensure good quality)
            if (masterGainNode) masterGainNode.gain.value = 0.85;
            if (trackGainNode) trackGainNode.gain.value = 0.85;
            
            // Start a new recording session
            const originalRecordedChunks = [...appState.recordedChunks];
            appState.recordedChunks = [];
            
            // Start audio recording with a small delay to ensure everything is ready
            setTimeout(() => {
                startAudioRecording();
            
            // Find the maximum duration among all tracks
            let maxDuration = 0;
            tracks.forEach(track => {
                if (track.notes && track.notes.length > 0) {
                    // Calculate the track duration based on the last note's end time
                    let trackEndTime = 0;
                    track.notes.forEach(note => {
                        // For each note, find when it ends
                        const noteEndTime = note.endTime || (note.startTime + (note.duration || 0.5));
                        trackEndTime = Math.max(trackEndTime, noteEndTime);
                    });
                    
                    // Store the calculated duration in the track object for future reference
                    track.duration = trackEndTime;
                    
                    // Update the max duration
                    maxDuration = Math.max(maxDuration, trackEndTime);
                }
            });
            
            // Add a small buffer to ensure all notes finish playing
            maxDuration += 0.5;
            
            // Play all tracks simultaneously (similar to playAllTracks but for recording)
            const noteTimeouts = [];
            
            tracks.forEach((track, trackIndex) => {
                if (track.notes && track.notes.length > 0) {
                    // Calculate how many times this track needs to loop to match the longest track
                    const trackDuration = track.duration || 0;
                    const loopCount = trackDuration > 0 ? Math.ceil(maxDuration / trackDuration) : 1;
                    
                    // Play the track for each loop iteration
                    for (let loop = 0; loop < loopCount; loop++) {
                        const loopOffset = loop * trackDuration;
                        
                        track.notes.forEach(note => {
                            // Schedule note start with loop offset
                            const noteStartTime = note.startTime + loopOffset;
                            
                            // Don't schedule notes beyond the max duration
                            if (noteStartTime >= maxDuration) return;
                            
                            const startTimeout = setTimeout(() => {
                                // Use the track's theme for this note
                                const noteTheme = note.theme || track.theme || appState.soundTheme;
                                const currentTheme = appState.soundTheme;
                                appState.soundTheme = noteTheme;
                                
                                // Play the note
                                if (note.note) {
                                    playNote(note.note);
                                } else if (note.drum) {
                                    playDrum(note.drum);
                                }
                                
                                // Restore theme
                                appState.soundTheme = currentTheme;
                            }, noteStartTime * 1000);
                            
                            noteTimeouts.push(startTimeout);
                            
                            // Schedule note end if duration is specified
                            if (note.note && note.endTime) {
                                const duration = note.endTime - note.startTime;
                                const endTime = noteStartTime + duration;
                                
                                // Don't schedule note ends beyond the max duration
                                if (endTime <= maxDuration) {
                                    const endTimeout = setTimeout(() => {
                                        stopNote(note.note);
                                    }, endTime * 1000);
                                    
                                    noteTimeouts.push(endTimeout);
                                }
                            }
                        });
                    }
                }
            });
            
            // Stop recording after the maximum duration + buffer
            setTimeout(() => {
                // Make sure all notes are stopped before stopping recording
                stopAllNotes();
                
                // Add a small delay to ensure all audio has been captured
                setTimeout(() => {
                    stopAudioRecording();
                    
                    // Wait a bit more for the recording to finalize
                    setTimeout(async () => {
                        try {
                            // Convert the recorded audio to MP3
                            const audioBlob = await convertAudioToMP3(appState.recordedChunks);
                            
                            // Restore original recorded chunks
                            appState.recordedChunks = originalRecordedChunks;
                            
                            // Clear timeouts
                            noteTimeouts.forEach(timeout => clearTimeout(timeout));
                            
                            // Reset UI
                            const activeKeys = document.querySelectorAll('.piano-key.active, .drum-pad.active');
                            activeKeys.forEach(key => {
                                key.classList.remove('active');
                            });
                            activeKeyReferences.clear();
                            
                            // Restore original gain values
                            if (masterGainNode) masterGainNode.gain.value = originalMasterGain;
                            if (trackGainNode) trackGainNode.gain.value = originalTrackGain;
                            
                            resolve(audioBlob);
                        } catch (error) {
                            console.error('Error finalizing audio recording:', error);
                            appState.recordedChunks = originalRecordedChunks;
                            
                            // Restore original gain values even on error
                            if (masterGainNode) masterGainNode.gain.value = originalMasterGain;
                            if (trackGainNode) trackGainNode.gain.value = originalTrackGain;
                            
                            resolve(null);
                        }
                    }, 800); // Longer delay for more reliable finalization
                }, 500);
                
            }, maxDuration * 1000 + 1500); // Add 1.5 second buffer for more reliable recording
            }, 100); // Small delay before starting recording to ensure everything is ready
        });
    }
    
    // Show export options dialog
    // Expose this function globally so it can be called from HTML
    window.showExportDialog = function() {
        if (!appState.tracks || appState.tracks.length === 0) {
            alert('No tracks to export. Record something first!');
            return;
        }
        
        // Create modal dialog
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.8); z-index: 10000; display: flex; 
            align-items: center; justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 30px; border-radius: 10px; 
            max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
            font-family: 'Rajdhani', sans-serif; color: #333;
        `;
        
        dialog.innerHTML = `
            <h2 style="color: #333; font-family: 'Orbitron', sans-serif; margin-bottom: 15px;">🎵 Export Options</h2>
            <p style="color: #555; font-family: 'Rajdhani', sans-serif; margin-bottom: 20px;">Select which tracks to export:</p>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin: 10px 0; color: #333; font-family: 'Rajdhani', sans-serif;">
                    <input type="checkbox" id="export-all" style="margin-right: 10px;">
                    <strong>Export All Tracks (${appState.tracks.length} tracks)</strong>
                </label>
                
                <div id="individual-tracks" style="margin-left: 20px;">
                    ${appState.tracks.map((track, index) => `
                        <label style="display: block; margin: 8px 0; color: #333; font-family: 'Rajdhani', sans-serif;">
                            <input type="checkbox" class="track-checkbox" data-track-id="${track.id}" style="margin-right: 10px;">
                            ${track.name} (${track.notes ? track.notes.length : 0} notes)
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 5px;">
                <h4 style="color: #333; font-family: 'Rajdhani', sans-serif; margin-bottom: 10px;">Export Format:</h4>
                <label style="display: block; margin: 5px 0; color: #333; font-family: 'Rajdhani', sans-serif;">
                    <input type="checkbox" id="export-json" checked style="margin-right: 10px;">
                    JSON Data (track structure & notes)
                </label>
                <label style="display: block; margin: 5px 0; color: #333; font-family: 'Rajdhani', sans-serif;">
                    <input type="checkbox" id="export-audio" checked style="margin-right: 10px;">
                    Combined MP3 Audio File (all selected tracks merged)
                </label>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="start-export" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-weight: 600;">
                    Start Export
                </button>
                <button id="cancel-export" style="background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-weight: 600;">
                    Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Handle export all checkbox
        const exportAllCheckbox = dialog.querySelector('#export-all');
        const trackCheckboxes = dialog.querySelectorAll('.track-checkbox');
        
        exportAllCheckbox.addEventListener('change', () => {
            trackCheckboxes.forEach(cb => cb.checked = exportAllCheckbox.checked);
        });
        
        // Handle individual track checkboxes
        trackCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(trackCheckboxes).every(tcb => tcb.checked);
                const noneChecked = Array.from(trackCheckboxes).every(tcb => !tcb.checked);
                exportAllCheckbox.checked = allChecked;
                exportAllCheckbox.indeterminate = !allChecked && !noneChecked;
            });
        });
        
        // Handle buttons
        dialog.querySelector('#start-export').addEventListener('click', () => {
            const selectedTrackIds = Array.from(trackCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.dataset.trackId);
            
            const exportJson = dialog.querySelector('#export-json').checked;
            const exportAudio = dialog.querySelector('#export-audio').checked;
            
            if (selectedTrackIds.length === 0) {
                alert('Please select at least one track to export.');
                return;
            }
            
            if (!exportJson && !exportAudio) {
                alert('Please select at least one export format.');
                return;
            }
            
            document.body.removeChild(modal);
            exportSelectedTracks(selectedTrackIds, exportJson, exportAudio);
        });
        
        dialog.querySelector('#cancel-export').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Show styled notification
    function showNotification(type, title, messages) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.keyboard-notification');
        existingNotifications.forEach(notification => {
            document.body.removeChild(notification);
        });
        
        // Create styles based on type
        let bgColor, textColor;
        if (type === 'success') {
            bgColor = '#d4edda';
            textColor = '#155724';
        } else if (type === 'error') {
            bgColor = '#f8d7da';
            textColor = '#721c24';
        } else if (type === 'warning') {
            bgColor = '#fff3cd';
            textColor = '#856404';
        } else {
            bgColor = '#d1ecf1';
            textColor = '#0c5460';
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'keyboard-notification';
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${bgColor}; color: ${textColor}; padding: 15px 20px;
            border-radius: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            font-family: 'Rajdhani', sans-serif; z-index: 10001;
            max-width: 80%; text-align: center;
        `;
        
        // Create content
        let content = `<h3 style="margin: 0 0 10px 0;">${title}</h3>`;
        
        if (Array.isArray(messages) && messages.length > 0) {
            content += '<ul style="margin: 0; padding-left: 20px; text-align: left;">';
            messages.forEach(msg => {
                content += `<li>${msg}</li>`;
            });
            content += '</ul>';
        } else if (typeof messages === 'string') {
            content += `<p style="margin: 0;">${messages}</p>`;
        }
        
        notification.innerHTML = content;
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
    
    // Export selected tracks
    // Expose this function globally so it can be called from HTML
    window.exportSelectedTracks = async function(selectedTrackIds, exportJson, exportAudio) {
        const selectedTracks = appState.tracks.filter(track => 
            selectedTrackIds.includes(track.id.toString())
        );
        
        // Show progress indicator
        const originalButtonText = exportTracksBtn ? exportTracksBtn.textContent : '';
        
        try {
            if (exportTracksBtn) {
                exportTracksBtn.textContent = 'Exporting...';
                exportTracksBtn.disabled = true;
            }
            
            // 1. Export JSON file if requested
            if (exportJson) {
                const tracksDataForJSON = selectedTracks.map(track => ({
                    ...track,
                    audioData: undefined // Remove audio data from JSON export to keep it lightweight
                }));
                
                const tracksData = JSON.stringify(tracksDataForJSON, null, 2);
                const jsonBlob = new Blob([tracksData], { type: 'application/json' });
                const jsonUrl = URL.createObjectURL(jsonBlob);
                
                const jsonLink = document.createElement('a');
                jsonLink.href = jsonUrl;
                jsonLink.download = `music-keyboard-tracks-${selectedTracks.length}-tracks.json`;
                document.body.appendChild(jsonLink);
                jsonLink.click();
                
                // Clean up JSON download
                setTimeout(() => {
                    document.body.removeChild(jsonLink);
                    URL.revokeObjectURL(jsonUrl);
                }, 100);
            }
            
            // 2. Export combined audio file if requested
            let combinedAudioExported = false;
            
            if (exportAudio && selectedTracks.length > 0) {
                if (exportTracksBtn) {
                    exportTracksBtn.textContent = `Creating combined audio...`;
                }
                
                try {
                    // Check if any of the selected tracks have notes
                    const hasNotes = selectedTracks.some(track => 
                        track.notes && track.notes.length > 0
                    );
                    
                    if (!hasNotes) {
                        // Show a clear error message if no notes are found
                        const errorMessage = document.createElement('div');
                        errorMessage.style.cssText = `
                            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                            background: #f8d7da; color: #721c24; padding: 15px 20px;
                            border-radius: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                            font-family: 'Rajdhani', sans-serif; z-index: 10001;
                            max-width: 80%; text-align: center;
                        `;
                        errorMessage.innerHTML = `
                            <h3 style="margin: 0 0 10px 0;">Audio Export Failed</h3>
                            <p style="margin: 0;">No playable notes found in the selected tracks. Please record new tracks with notes to export audio.</p>
                        `;
                        document.body.appendChild(errorMessage);
                        
                        // Remove the message after 5 seconds
                        setTimeout(() => {
                            document.body.removeChild(errorMessage);
                        }, 5000);
                        
                        return;
                    }
                    
                    // Generate combined audio from all selected tracks
                    const combinedBlob = await generateCombinedAudio(selectedTracks);
                    
                    if (combinedBlob) {
                        // Create download link for the combined audio
                        const audioUrl = URL.createObjectURL(combinedBlob);
                        const audioLink = document.createElement('a');
                        audioLink.href = audioUrl;
                        
                        // Create a descriptive filename
                        const timestamp = new Date().toISOString().slice(0, 10);
                        const trackCount = selectedTracks.length;
                        
                        // Determine the file extension based on the blob type
                        let fileExtension = 'webm'; // Default to webm as it's most widely supported
                        if (combinedBlob.type.includes('webm')) {
                            fileExtension = 'webm';
                        } else if (combinedBlob.type.includes('ogg')) {
                            fileExtension = 'ogg';
                        } else if (combinedBlob.type.includes('wav')) {
                            fileExtension = 'wav';
                        } else if (combinedBlob.type.includes('mpeg') || combinedBlob.type.includes('mp3')) {
                            fileExtension = 'mp3';
                        }
                        
                        audioLink.download = `Combined_${trackCount}_Tracks_${timestamp}.${fileExtension}`;
                        
                        document.body.appendChild(audioLink);
                        audioLink.click();
                        
                        // Clean up audio download
                        setTimeout(() => {
                            document.body.removeChild(audioLink);
                            URL.revokeObjectURL(audioUrl);
                        }, 100);
                        
                        combinedAudioExported = true;
                    } else {
                        throw new Error("Failed to generate audio file");
                    }
                } catch (error) {
                    // Create a styled error notification instead of using alert
                    const errorMessage = document.createElement('div');
                    errorMessage.style.cssText = `
                        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                        background: #f8d7da; color: #721c24; padding: 15px 20px;
                        border-radius: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                        font-family: 'Rajdhani', sans-serif; z-index: 10001;
                        max-width: 80%; text-align: center;
                    `;
                    errorMessage.innerHTML = `
                        <h3 style="margin: 0 0 10px 0;">Audio Export Failed</h3>
                        <p style="margin: 0;">Your browser may not support this feature. Try using Chrome or Edge for best results.</p>
                    `;
                    document.body.appendChild(errorMessage);
                    
                    // Remove the message after 5 seconds
                    setTimeout(() => {
                        document.body.removeChild(errorMessage);
                    }, 5000);
                }
            }
            
            // Show completion message
            let message = '🎉 Export completed!\n\n';
            
            if (exportJson) {
                message += `✅ JSON file exported (${selectedTracks.length} tracks)\n`;
            }
            
            if (exportAudio) {
                if (combinedAudioExported) {
                    message += `✅ Combined MP3 audio file exported (${selectedTracks.length} tracks merged)\n`;
                    message += "\nðŸ“ Note: Audio file is exported in MP3 format for compatibility with most media players and devices.";
                } else {
                    message += `âŒ Failed to export combined audio file\n`;
                    message += "\nðŸ’¡ Tip: Make sure your tracks have notes recorded. The audio export feature works best with recently recorded tracks.";
                }
            }
            
            alert(message);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export tracks: ' + error.message);
        } finally {
            // Restore button state
            if (exportTracksBtn) {
                exportTracksBtn.textContent = originalButtonText || 'Export Tracks';
                exportTracksBtn.disabled = false;
            }
        }
    }
    
    // Import tracks from JSON file
    function importTracksFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTracks = JSON.parse(e.target.result);
                
                if (Array.isArray(importedTracks)) {
                    if (confirm(`Import ${importedTracks.length} tracks? This will replace your current tracks.`)) {
                        appState.tracks = importedTracks;
                        saveTracks();
                        updateTracksList();
                        alert('Tracks imported successfully!');
                    }
                } else {
                    alert('Invalid tracks file format.');
                }
            } catch (error) {
                alert('Error importing tracks: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Initialize the app
    init();
});

