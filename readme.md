# MIDI Sampler

A simple, browser-based MIDI sampler built with the Web Audio and Web MIDI APIs. Connect your MIDI controller, map your notes, and start playing!

**[➡️ Live Demo](https://hsgw.github.io/midi-sampler/)**

---

## ✨ Features

- **MIDI Input:** Connect any MIDI controller to play audio samples.
- **Customizable Mappings:** Easily map MIDI notes to different audio samples directly in the UI.
- **Real-time Visualization:** See the waveform for each sample, with a playhead and background fade effect during playback.
- **Persistent Settings:** Your custom note mappings are automatically saved in your browser's local storage.
- **Responsive Design:** The grid layout adapts to both portrait and landscape orientations.
- **Zero Dependencies:** Built with vanilla JavaScript, HTML, and CSS. No frameworks needed.

## 🛠️ Built With

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

## 🚀 How to Use

1.  **Open the [Live Demo](https://YOUR_USERNAME.github.io/midi-sampler/).**
2.  Connect your MIDI device to your computer.
3.  Click anywhere on the screen to start the audio context.
4.  Play notes on your MIDI device to trigger the default sounds.
5.  To change a mapping, click on a waveform to open the settings panel, then adjust the MIDI note number or select a different sample from the dropdown. Changes are saved automatically.

## 📂 Project Structure

```
/
├── samples/              # Audio sample files (.flac)
├── index.html            # Main HTML file
├── style.css             # All styles for the application
└── script.js             # All application logic
```

## 🙏 Acknowledgements

This project was developed with the assistance of an AI coding assistant (Gemini Code Assist).

## 📜 License

This project's source code is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note on Audio Samples:** The audio files in the `samples/` directory are from an external collection and are licensed under the GPLv2.　See `samples/readme.md` for details.
