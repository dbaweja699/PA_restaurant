import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Registers routes for checking sound file availability and troubleshooting
 */
export function registerSoundRoutes(app: any) {
  console.log("Registering sound routes for API access");
  
  // Debug endpoint to check if sound files are accessible
  app.get('/api/check-sounds', (_req: Request, res: Response) => {
    try {
      const soundsDir = path.join(process.cwd(), 'public', 'sounds');
      let files: string[] = [];
      
      // Check if directory exists
      if (fs.existsSync(soundsDir)) {
        files = fs.readdirSync(soundsDir);
      }
      
      // Check if we can access the alarm sound specifically
      const alarmPath = path.join(soundsDir, 'alarm_clock.mp3');
      const alarmExists = fs.existsSync(alarmPath);
      
      // Also check if we can access it through the public path
      const publicSoundUrl = '/sounds/alarm_clock.mp3';
      const apiSoundUrl = '/api/sound/alarm_clock.mp3';
      
      res.json({
        soundsDirExists: fs.existsSync(soundsDir),
        soundFiles: files,
        alarmExists,
        soundsDir,
        alarmPath,
        publicSoundUrl,
        apiSoundUrl,
        cwd: process.cwd()
      });
    } catch (error) {
      console.error("Error checking sound files:", error);
      res.status(500).json({ error: "Error checking sound files", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Endpoint to serve sound files with proper headers
  app.get('/api/sound/:filename', (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const soundsDir = path.join(process.cwd(), 'public', 'sounds');
      const filePath = path.join(soundsDir, filename);
      
      console.log(`Request for sound file: ${filename}, checking path: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Sound file not found: ${filePath}`);
        return res.status(404).json({ error: "Sound file not found" });
      }
      
      console.log(`Sound file found, sending: ${filePath}`);
      
      // Determine content type based on file extension
      let contentType = 'audio/mpeg';
      if (filename.endsWith('.wav')) {
        contentType = 'audio/wav';
      } else if (filename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      }
      
      // Set headers for proper cross-origin audio playback
      // These headers are crucial for browser compatibility
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error(`Error streaming sound file ${filename}:`, error);
        res.status(500).json({ error: "Error streaming sound file" });
      });
    } catch (error) {
      console.error("Error serving sound file:", error);
      res.status(500).json({ error: "Error serving sound file", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Play sound test endpoint - useful for debugging
  app.get('/api/play-test', (_req: Request, res: Response) => {
    try {
      // Send a simple HTML page that tests audio playback
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sound Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          button { padding: 10px 15px; margin: 5px; cursor: pointer; }
          .success { color: green; }
          .error { color: red; }
          .test-group { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Sound Playback Test</h1>
        <p>This page tests various methods of playing notification sounds.</p>
        
        <div class="test-group">
          <h2>1. Basic Audio Element</h2>
          <button onclick="playBasicAudio()">Play Basic Audio</button>
          <audio id="basicAudio" src="/sounds/alarm_clock.mp3" preload="auto"></audio>
          <div id="basicAudioResult"></div>
        </div>
        
        <div class="test-group">
          <h2>2. API Endpoint Audio</h2>
          <button onclick="playApiAudio()">Play API Audio</button>
          <audio id="apiAudio" src="/api/sound/alarm_clock.mp3" preload="auto"></audio>
          <div id="apiAudioResult"></div>
        </div>
        
        <div class="test-group">
          <h2>3. Dynamic Audio Creation</h2>
          <button onclick="playDynamicAudio()">Play Dynamic Audio</button>
          <div id="dynamicAudioResult"></div>
        </div>
        
        <div class="test-group">
          <h2>4. AudioContext API (Advanced)</h2>
          <button onclick="playAudioContext()">Play AudioContext</button>
          <div id="audioContextResult"></div>
        </div>
        
        <div class="test-group">
          <h2>5. User Gesture Required Test</h2>
          <p>Click anywhere on this page to test if audio can play after user interaction:</p>
          <div id="gestureTestResult"></div>
        </div>
        
        <script>
          // Test 1: Basic Audio Element
          function playBasicAudio() {
            const audio = document.getElementById('basicAudio');
            const resultEl = document.getElementById('basicAudioResult');
            resultEl.innerHTML = "Attempting to play...";
            
            try {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    resultEl.innerHTML = '<span class="success">✓ Success! Audio is playing.</span>';
                  })
                  .catch(err => {
                    resultEl.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
                  });
              }
            } catch (err) {
              resultEl.innerHTML = '<span class="error">✗ Exception: ' + err.message + '</span>';
            }
          }
          
          // Test 2: API Endpoint Audio
          function playApiAudio() {
            const audio = document.getElementById('apiAudio');
            const resultEl = document.getElementById('apiAudioResult');
            resultEl.innerHTML = "Attempting to play from API endpoint...";
            
            try {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    resultEl.innerHTML = '<span class="success">✓ Success! API audio is playing.</span>';
                  })
                  .catch(err => {
                    resultEl.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
                  });
              }
            } catch (err) {
              resultEl.innerHTML = '<span class="error">✗ Exception: ' + err.message + '</span>';
            }
          }
          
          // Test 3: Dynamic Audio Creation
          function playDynamicAudio() {
            const resultEl = document.getElementById('dynamicAudioResult');
            resultEl.innerHTML = "Creating and playing dynamic audio...";
            
            try {
              const audio = new Audio('/sounds/alarm_clock.mp3');
              audio.volume = 1.0;
              
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    resultEl.innerHTML = '<span class="success">✓ Success! Dynamic audio is playing.</span>';
                  })
                  .catch(err => {
                    resultEl.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
                    
                    // Try API endpoint as fallback
                    const apiAudio = new Audio('/api/sound/alarm_clock.mp3');
                    apiAudio.volume = 1.0;
                    
                    return apiAudio.play()
                      .then(() => {
                        resultEl.innerHTML = '<span class="success">✓ Success with API fallback!</span>';
                      })
                      .catch(apiErr => {
                        resultEl.innerHTML += '<br><span class="error">✗ API Fallback also failed: ' + apiErr.message + '</span>';
                      });
                  });
              }
            } catch (err) {
              resultEl.innerHTML = '<span class="error">✗ Exception: ' + err.message + '</span>';
            }
          }
          
          // Test 4: AudioContext API
          function playAudioContext() {
            const resultEl = document.getElementById('audioContextResult');
            resultEl.innerHTML = "Attempting to play with AudioContext...";
            
            try {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              const audioContext = new AudioContext();
              
              fetch('/api/sound/alarm_clock.mp3')
                .then(response => {
                  if (!response.ok) {
                    throw new Error('Network response not OK: ' + response.status);
                  }
                  resultEl.innerHTML = "Fetched sound file, decoding...";
                  return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                  resultEl.innerHTML = "Decoding audio data...";
                  return audioContext.decodeAudioData(arrayBuffer);
                })
                .then(audioBuffer => {
                  resultEl.innerHTML = "Audio decoded, creating source...";
                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioContext.destination);
                  source.start(0);
                  resultEl.innerHTML = '<span class="success">✓ Success! AudioContext sound is playing.</span>';
                })
                .catch(err => {
                  resultEl.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
                });
            } catch (err) {
              resultEl.innerHTML = '<span class="error">✗ Exception: ' + err.message + '</span>';
            }
          }
          
          // Test 5: User Gesture Required
          document.addEventListener('click', function() {
            const resultEl = document.getElementById('gestureTestResult');
            if (resultEl.innerHTML.includes('Success')) return;
            
            resultEl.innerHTML = "User clicked, trying to play audio...";
            
            const audio = new Audio('/sounds/alarm_clock.mp3');
            audio.volume = 1.0;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  resultEl.innerHTML = '<span class="success">✓ Success! Audio played after user gesture.</span>';
                })
                .catch(err => {
                  resultEl.innerHTML = '<span class="error">✗ Error: ' + err.message + '</span>';
                  
                  // Try API endpoint as fallback
                  const apiAudio = new Audio('/api/sound/alarm_clock.mp3');
                  apiAudio.volume = 1.0;
                  
                  return apiAudio.play()
                    .then(() => {
                      resultEl.innerHTML = '<span class="success">✓ Success with API fallback after user gesture!</span>';
                    })
                    .catch(apiErr => {
                      resultEl.innerHTML += '<br><span class="error">✗ API Fallback also failed after user gesture: ' + apiErr.message + '</span>';
                    });
                });
            }
          }, { once: true });
        </script>
      </body>
      </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving test page:", error);
      res.status(500).json({ error: "Error serving test page" });
    }
  });
}