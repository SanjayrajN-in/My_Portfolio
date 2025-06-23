// Music Keyboard App - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Audio Context
    let audioContext;
    let masterGainNode;
    
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
    const appState = {
        isRecording: false,
        isPlaying: false,
        isLooping: false, // Track if loop mode is enabled
        currentTrack: [],
        tracks: [],
        recordingStartTime: 0,
        soundTheme: 'piano',
        showKeyLabels: true,
        editingKeyMap: false,
        activeNotes: new Map(), // For tracking currently playing notes
        keyMappingMode: false,
        pressedKeys: new Set(), // Track currently pressed keys to prevent stuck notes
        drumSamples: {}, // Store loaded drum samples
        isLowPerformanceMode: isLowEndDevice(), // Auto-detect low-end devices
        lastNoteTime: 0, // Track when the last note was played (for stuck note detection)
        noteTimeouts: new Map(), // Store timeouts for each note to ensure cleanup
        maxNoteLength: 15, // Maximum note length in seconds (to prevent stuck notes)
        audioNodesRegistry: new Set(), // Registry of all created audio nodes for global cleanup
        playbackTimeouts: [], // Store timeouts for track playback to support looping
        keyboardEnabled: true // Track if PC keyboard input is enabled
    };
    
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
                console.log("Potential stuck notes detected, cleaning up...");
                stopAllNotes();
            }
            
            // Check for audio context issues
            if (audioContext.state === 'suspended') {
                console.log("Audio context is suspended, attempting to resume");
                audioContext.resume().catch(e => {
                    console.error("Failed to resume audio context:", e);
                });
            }
            
            // Check for inactive UI but active notes
            const activeUIElements = document.querySelectorAll('.piano-key.active, .drum-pad.active');
            if (activeUIElements.length === 0 && appState.activeNotes.size > 0) {
                console.log("UI/audio state mismatch detected, cleaning up");
                stopAllNotes();
            }
            
            // Check for no recent activity but active notes
            if (appState.activeNotes.size > 0 && audioContext.currentTime - appState.lastNoteTime > 5) {
                console.log("No recent activity but notes still playing, cleaning up");
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
                    console.log(`Note ${note} has been playing for over ${maxDuration} seconds, stopping it`);
                    stopNote(note);
                    stuckNotesFound = true;
                }
            });
            
            if (stuckNotesFound) {
                console.log("Stuck notes cleaned up");
            }
            
            // Check for memory usage (indirect way to detect leaks)
            if (appState.audioNodesRegistry.size > 100) {
                console.log("Too many audio nodes registered, performing full cleanup");
                forceCleanupAllAudio();
            }
            
            // Check for browser performance issues
            if (appState.isLowPerformanceMode === false && 
                (document.visibilityState === 'visible' && 
                 performance && performance.now && 
                 performance.memory && performance.memory.usedJSHeapSize > 50000000)) {
                
                console.log("High memory usage detected, switching to low performance mode");
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
                    console.log(`Cleaned up orphaned timeout for note ${note}`);
                }
            });
            
            // If we have active notes but UI doesn't match, force reset
            const activeUICount = document.querySelectorAll('.piano-key.active, .drum-pad.active').length;
            if (activeUICount !== appState.activeNotes.size) {
                console.log(`UI/audio state mismatch: ${activeUICount} active UI elements, ${appState.activeNotes.size} active notes`);
                
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
                console.log("Unusually high number of active notes, performing cleanup");
                forceCleanupAllAudio();
            }
        }, 30000);
    }
    
    // Force cleanup all audio nodes
    function forceCleanupAllAudio() {
        console.log("Forcing cleanup of all audio nodes");
        
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
            
            // If all else fails, recreate the audio context
            if (audioContext) {
                try {
                    const oldContext = audioContext;
                    audioContext = null;
                    masterGainNode = null;
                    
                    // Try to close the old context
                    if (oldContext.state !== 'closed') {
                        oldContext.close().catch(() => {
                            console.log("Could not close old audio context");
                        });
                    }
                    
                    // Create a new context
                    setTimeout(() => {
                        initAudioContext();
                    }, 300);
                } catch (e) {
                    console.error("Error recreating audio context:", e);
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
            console.error("Error in forceCleanupAllAudio:", e);
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
                audioContext.resume().catch(err => console.error("Failed to resume audio context:", err));
            }
        }, { once: true });
        
        // Apply low performance mode if detected
        if (appState.isLowPerformanceMode) {
            console.log("Low performance mode activated");
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
                console.log("Window focus: cleaning up potential stuck notes");
                stopAllNotes();
            }
        });
        
        // Add panic button with double-click for force cleanup
        if (panicButton) {
            panicButton.addEventListener('dblclick', forceCleanupAllAudio);
        }
        
        // Add emergency cleanup on errors
        window.addEventListener('error', function(e) {
            console.error("Global error caught, cleaning up audio:", e);
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
                    console.log('Sound is globally disabled');
                    return null;
                }
                
                // Create audio context with lower latency settings for better performance
                const contextOptions = {
                    latencyHint: 'interactive',
                    sampleRate: 44100
                };
                
                audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
                
                // Create master gain node
                masterGainNode = audioContext.createGain();
                masterGainNode.gain.value = volumeSlider ? (volumeSlider.value / 100) : 0.7;
                
                // Create a compressor to prevent clipping when multiple notes play
                const compressor = audioContext.createDynamicsCompressor();
                compressor.threshold.value = -24;
                compressor.knee.value = 30;
                compressor.ratio.value = 12;
                compressor.attack.value = 0.003;
                compressor.release.value = 0.25;
                
                // Connect the audio chain
                masterGainNode.connect(compressor);
                compressor.connect(audioContext.destination);
                
                // Register for cleanup
                appState.audioNodesRegistry.add(compressor);
                appState.audioNodesRegistry.add(masterGainNode);
                
                // Create drum samples
                createDrumSamples();
                
                console.log("Audio context initialized with optimized settings");
            } catch (e) {
                console.error("Failed to initialize audio context:", e);
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
        
        console.log('Keyboard event listeners set up');
        

        
        // Sound theme selection
        if (soundThemeSelect) {
            soundThemeSelect.addEventListener('change', () => {
                console.log('Theme changed to:', soundThemeSelect.value, 'Keyboard enabled:', appState.keyboardEnabled);
                appState.soundTheme = soundThemeSelect.value;
                createPianoKeyboard(); // Recreate keyboard UI based on selected theme
                updateKeyMappingDisplay(); // Update key mapping display
                updateKeyboardButtonState(); // Ensure keyboard button state is preserved
                
                // Ensure keyboard focus is properly set
                setTimeout(() => {
                    ensureKeyboardFocus();
                }, 100);
                
                console.log('After theme change - Keyboard enabled:', appState.keyboardEnabled);
            });
        }
        
        // Volume control
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                if (masterGainNode) {
                    masterGainNode.gain.value = volumeSlider.value / 100;
                }
            });
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
            exportTracksBtn.addEventListener('click', exportTracks);
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
        // Debug logging
        console.log('Key pressed:', e.key, 'Keyboard enabled:', appState.keyboardEnabled, 'Target:', e.target.tagName);
        
        // Ignore if keyboard is disabled, key is already pressed, or if we're in an input field
        if (!appState.keyboardEnabled || e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            console.log('Key ignored - Keyboard disabled or in input field');
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
            audioContext.resume().catch(err => console.error("Failed to resume audio context:", err));
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
                    playDrum(drumData.name);
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
                playDrum(drumKitMap[drumKey].name);
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
        
        // Synthesize drum sounds
        let oscillator, gainNode, filterNode;
        
        // Create gain node for all drum types
        gainNode = audioContext.createGain();
        gainNode.connect(masterGainNode);
        
        // Configure based on drum type
        switch (drumName) {
            case 'kick':
                // Create oscillator for kick
                oscillator = audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.1);
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                // Connect and start
                oscillator.connect(gainNode);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
                
            case 'snare':
                // Create oscillator component
                oscillator = audioContext.createOscillator();
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(250, audioContext.currentTime);
                
                // Create filter for oscillator
                filterNode = audioContext.createBiquadFilter();
                filterNode.type = 'highpass';
                filterNode.frequency.value = 1000;
                
                // Connect oscillator through filter to gain
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                
                // Set gain envelope for oscillator
                gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                
                // Start oscillator
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
                
                // Add noise for snare
                let noiseNode = audioContext.createBufferSource();
                let noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate);
                let noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseBuffer.length; i++) {
                    noiseData[i] = Math.random() * 2 - 1;
                }
                noiseNode.buffer = noiseBuffer;
                
                // Create noise filter
                let noiseFilter = audioContext.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 1000;
                
                // Create noise gain
                let noiseGain = audioContext.createGain();
                noiseGain.gain.setValueAtTime(0.8, audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                
                // Connect noise components
                noiseNode.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(masterGainNode);
                
                // Start noise
                noiseNode.start();
                noiseNode.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'hihat':
                // Create noise for hi-hat
                let hihatBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
                let hihatData = hihatBuffer.getChannelData(0);
                for (let i = 0; i < hihatBuffer.length; i++) {
                    hihatData[i] = Math.random() * 2 - 1;
                }
                
                // Create source
                let hihatSource = audioContext.createBufferSource();
                hihatSource.buffer = hihatBuffer;
                
                // Create filter
                let hihatFilter = audioContext.createBiquadFilter();
                hihatFilter.type = 'highpass';
                hihatFilter.frequency.value = 7000;
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                
                // Connect components
                hihatSource.connect(hihatFilter);
                hihatFilter.connect(gainNode);
                
                // Start source
                hihatSource.start();
                hihatSource.stop(audioContext.currentTime + 0.1);
                break;
                
            case 'clap':
                // Create noise for clap
                let clapBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
                let clapData = clapBuffer.getChannelData(0);
                for (let i = 0; i < clapBuffer.length; i++) {
                    clapData[i] = Math.random() * 2 - 1;
                }
                
                // Create source
                let clapSource = audioContext.createBufferSource();
                clapSource.buffer = clapBuffer;
                
                // Create filter
                let clapFilter = audioContext.createBiquadFilter();
                clapFilter.type = 'bandpass';
                clapFilter.frequency.value = 1500;
                clapFilter.Q.value = 2;
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(0.7, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
                
                // Connect components
                clapSource.connect(clapFilter);
                clapFilter.connect(gainNode);
                
                // Start source
                clapSource.start();
                clapSource.stop(audioContext.currentTime + 0.2);
                break;
                
            case 'tom':
                // Create oscillator for tom
                oscillator = audioContext.createOscillator();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.2);
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                // Connect and start
                oscillator.connect(gainNode);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
                
            case 'crash':
                // Create noise for crash
                let crashBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
                let crashData = crashBuffer.getChannelData(0);
                for (let i = 0; i < crashBuffer.length; i++) {
                    crashData[i] = Math.random() * 2 - 1;
                }
                
                // Create source
                let crashSource = audioContext.createBufferSource();
                crashSource.buffer = crashBuffer;
                
                // Create filter
                let crashFilter = audioContext.createBiquadFilter();
                crashFilter.type = 'highpass';
                crashFilter.frequency.value = 5000;
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                
                // Connect components
                crashSource.connect(crashFilter);
                crashFilter.connect(gainNode);
                
                // Start source
                crashSource.start();
                crashSource.stop(audioContext.currentTime + 0.5);
                break;
                
            case 'ride':
                // Create oscillator for ride
                oscillator = audioContext.createOscillator();
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(2000, audioContext.currentTime);
                
                // Create filter
                filterNode = audioContext.createBiquadFilter();
                filterNode.type = 'highpass';
                filterNode.frequency.value = 8000;
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                // Connect components
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                
                // Start oscillator
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
                
            case 'rim':
                // Create oscillator for rim
                oscillator = audioContext.createOscillator();
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                
                // Create filter
                filterNode = audioContext.createBiquadFilter();
                filterNode.type = 'bandpass';
                filterNode.frequency.value = 3000;
                filterNode.Q.value = 10;
                
                // Set gain envelope
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                
                // Connect components
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                
                // Start oscillator
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
        }
        
        // Record the drum hit if recording
        if (appState.isRecording) {
            appState.currentTrack.push({
                drum: drumName,
                startTime: audioContext.currentTime - appState.recordingStartTime,
                endTime: audioContext.currentTime - appState.recordingStartTime + 0.1 // Short duration for drums
            });
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
            return;
        }
        
        // Limit the number of simultaneous notes to prevent audio glitching
        if (appState.activeNotes.size >= 6) {
            console.log("Too many simultaneous notes, stopping oldest");
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
        
        // Get the sound theme configuration
        const theme = soundThemes[appState.soundTheme];
        
        try {
            // Create oscillator with ultra-simplified settings
            const oscillator = audioContext.createOscillator();
            oscillator.type = theme.oscillatorType;
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
                    console.log(`Note ${note} reached maximum duration, stopping automatically`);
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
                    endTime: null // Will be set when the note is released
                });
            }
            
            // Update UI
            updateKeyUI(note, true);
        } catch (e) {
            console.error(`Error playing note ${note}:`, e);
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
            const theme = soundThemes[appState.soundTheme];
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
            console.error("Error in stopNote:", e);
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
            
            // Clear active notes
            appState.activeNotes.clear();
            
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
                    console.error("Error reconnecting master gain:", e);
                    
                    // If reconnection fails, recreate the audio context
                    try {
                        if (audioContext) {
                            audioContext.close().then(() => {
                                audioContext = null;
                                masterGainNode = null;
                                initAudioContext();
                            }).catch(() => {
                                // If close fails, force new context
                                audioContext = null;
                                masterGainNode = null;
                                initAudioContext();
                            });
                        }
                    } catch (e2) {
                        // Last resort: force new context
                        audioContext = null;
                        masterGainNode = null;
                        initAudioContext();
                    }
                }
            }, 50);
            
        } catch (e) {
            console.error("Error in stopAllNotes:", e);
            
            // Emergency reset - recreate audio context
            try {
                audioContext = null;
                masterGainNode = null;
                setTimeout(initAudioContext, 100);
            } catch (e2) {
                console.error("Failed to reset audio:", e2);
            }
        }
    }
    
    // Update key UI state
    function updateKeyUI(note, isActive) {
        const keyElement = document.querySelector(`.piano-key[data-note="${note}"]`);
        if (keyElement) {
            if (isActive) {
                keyElement.classList.add('active');
            } else {
                keyElement.classList.remove('active');
            }
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
    
    // Start recording
    function startRecording() {
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) return; // Exit if audio context initialization failed
        
        appState.isRecording = true;
        appState.currentTrack = [];
        appState.recordingStartTime = audioContext.currentTime;
        
        // Update UI
        if (startRecordingBtn) startRecordingBtn.disabled = true;
        if (stopRecordingBtn) stopRecordingBtn.disabled = false;
        if (saveRecordingBtn) saveRecordingBtn.disabled = true;
    }
    
    // Stop recording
    function stopRecording() {
        appState.isRecording = false;
        
        // Update UI
        if (startRecordingBtn) startRecordingBtn.disabled = false;
        if (stopRecordingBtn) stopRecordingBtn.disabled = true;
        if (saveRecordingBtn) saveRecordingBtn.disabled = false;
    }
    
    // Save recording
    function saveRecording() {
        if (!trackNameInput) return;
        
        const trackName = trackNameInput.value.trim() || `Track ${appState.tracks.length + 1}`;
        
        const track = {
            id: Date.now(),
            name: trackName,
            notes: appState.currentTrack,
            theme: appState.soundTheme,
            duration: Math.max(...appState.currentTrack.map(note => note.endTime || 0))
        };
        
        appState.tracks.push(track);
        
        // Save to localStorage
        saveTracks();
        
        // Update UI
        updateTracksList();
        trackNameInput.value = '';
        if (saveRecordingBtn) saveRecordingBtn.disabled = true;
    }
    
    // Play all tracks
    function playAllTracks() {
        if (appState.isPlaying) {
            stopPlayback();
        }
        
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) return; // Exit if audio context initialization failed
        
        if (appState.tracks.length === 0) {
            alert('No tracks to play. Record something first!');
            return;
        }
        
        // Clear any existing playback timeouts
        clearPlaybackTimeouts();
        
        appState.isPlaying = true;
        const startTime = audioContext.currentTime;
        
        // Schedule all notes from all tracks
        appState.tracks.forEach(track => {
            const theme = track.theme || appState.soundTheme;
            
            track.notes.forEach(note => {
                // Schedule note start
                const noteStartTimeout = setTimeout(() => {
                    if (!appState.isPlaying) return; // Check if playback was stopped
                    
                    // Play the note or drum
                    if (note.note) {
                        playNote(note.note);
                    } else if (note.drum) {
                        playDrum(note.drum);
                    }
                    
                    // Schedule note end (for sustained notes)
                    if (note.note && note.endTime) {
                        const duration = note.endTime - note.startTime;
                        const noteEndTimeout = setTimeout(() => {
                            if (!appState.isPlaying) return;
                            stopNote(note.note);
                        }, duration * 1000);
                        
                        // Store the timeout for cleanup
                        appState.playbackTimeouts.push(noteEndTimeout);
                    }
                }, note.startTime * 1000);
                
                // Store the timeout for cleanup
                appState.playbackTimeouts.push(noteStartTimeout);
            });
        });
        
        // Find the longest track duration
        const maxDuration = Math.max(...appState.tracks.map(track => track.duration || 0));
        
        // Schedule playback end or loop
        const playbackEndTimeout = setTimeout(() => {
            if (appState.isLooping) {
                // If looping is enabled, restart playback
                playAllTracks();
            } else {
                stopPlayback();
            }
        }, (maxDuration + 0.5) * 1000); // Add a small buffer
        
        // Store the timeout for cleanup
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
        
        if (!audioContext) {
            initAudioContext();
        }
        
        if (!audioContext) return; // Exit if audio context initialization failed
        
        const track = appState.tracks.find(t => t.id === trackId);
        if (!track) return;
        
        appState.isPlaying = true;
        const startTime = audioContext.currentTime;
        const theme = track.theme || appState.soundTheme;
        
        // Schedule all notes
        track.notes.forEach(note => {
            // Schedule note start
            setTimeout(() => {
                if (!appState.isPlaying) return; // Check if playback was stopped
                
                // Play the note or drum
                if (note.note) {
                    playNote(note.note);
                } else if (note.drum) {
                    playDrum(note.drum);
                }
                
                // Schedule note end (for sustained notes)
                if (note.note && note.endTime) {
                    const duration = note.endTime - note.startTime;
                    setTimeout(() => {
                        if (!appState.isPlaying) return;
                        stopNote(note.note);
                    }, duration * 1000);
                }
            }, note.startTime * 1000);
        });
        
        // Schedule playback end
        setTimeout(() => {
            stopPlayback();
        }, (track.duration + 0.5) * 1000); // Add a small buffer
        
        // Update UI
        if (playAllTracksBtn) playAllTracksBtn.disabled = true;
        if (stopPlaybackBtn) stopPlaybackBtn.disabled = false;
    }
    
    // Stop playback
    function stopPlayback() {
        appState.isPlaying = false;
        
        // Stop all active notes
        stopAllNotes();
        
        // Clear all playback timeouts
        clearPlaybackTimeouts();
        
        // Update UI
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
            trackDetails.textContent = `${track.notes.length} notes · ${track.duration.toFixed(1)}s · ${track.theme}`;
            
            trackInfo.appendChild(trackName);
            trackInfo.appendChild(trackDetails);
            
            const trackActions = document.createElement('div');
            trackActions.className = 'track-actions';
            
            const playBtn = document.createElement('button');
            playBtn.className = 'btn';
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.title = 'Play track';
            playBtn.addEventListener('click', () => playTrack(track.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn';
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
        
        console.log('Keyboard focus ensured, active element:', document.activeElement.tagName);
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
            console.error("Error saving preferences:", e);
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
            console.error("Error loading preferences:", e);
            // Use defaults if loading fails
            appState.soundTheme = 'piano';
            appState.showKeyLabels = true;
            keyMap = { ...defaultKeyMap };
        }
    }
    
    // Save tracks to localStorage
    function saveTracks() {
        try {
            localStorage.setItem('musicKeyboardTracks', JSON.stringify(appState.tracks));
        } catch (e) {
            console.error("Error saving tracks:", e);
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
            console.error("Error loading tracks:", e);
            // Use empty tracks array if loading fails
            appState.tracks = [];
        }
    }
    
    // Export tracks to JSON file
    function exportTracks() {
        if (appState.tracks.length === 0) {
            alert('No tracks to export. Record something first!');
            return;
        }
        
        try {
            const tracksData = JSON.stringify(appState.tracks, null, 2);
            const blob = new Blob([tracksData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'music-keyboard-tracks.json';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (e) {
            console.error("Error exporting tracks:", e);
            alert('Failed to export tracks: ' + e.message);
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