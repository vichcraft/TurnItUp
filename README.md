# TurnItUp Chrome Extension

A modern Chrome extension to boost the volume of any media (audio/video) playing in your browser beyond 100% (up to 500%).

## Features
- Boost volume up to 5x (500%).
- Real-time control via a sleek popup UI.
- Preset buttons for quick adjustments.
- Works on all websites (YouTube, Netflix, Spotify Web, etc.).
- Persists volume settings per tab.

## How to Load for Testing

1.  **Open Chrome Extensions Page**:
    - Open Google Chrome.
    - Navigate to `chrome://extensions/` by typing it in the address bar.
    - Alternatively, click the three dots menu (⋮) -> **Extensions** -> **Manage Extensions**.

2.  **Enable Developer Mode**:
    - In the top right corner of the Extensions page, toggle the **Developer mode** switch to **ON**.

3.  **Load the Extension**:
    - Click the **Load unpacked** button that appears in the top left.
    - In the file picker, navigate to and select the project folder:
      `/Users/vichu/Documents/Coding stuff/Volume Extension`
    - Click **Select** or **Open**.

4.  **Pin the Extension (Optional but Recommended)**:
    - Click the puzzle piece icon (🧩) next to your profile picture in Chrome.
    - Find **TurnItUp** and click the pin icon (📌) to keep it visible in your toolbar.

## How to Use
1.  Navigate to a website with audio or video (e.g., YouTube).
2.  Click the **TurnItUp** icon in your toolbar.
3.  Adjust the slider or click a preset button to increase the volume.
4.  **Note**: If the extension says "Ready" but doesn't seem to work, try clicking anywhere on the page first (Chrome requires user interaction before allowing audio manipulation).

## Project Structure
- `manifest.json`: Extension configuration and permissions.
- `popup.html` / `popup.js`: The user interface and logic for the extension popup.
- `content.js`: The script that injects into web pages to handle audio processing.
- `icons/`: Extension icons.
- `generate-icons.html` / `generate-icons.js`: Tools for generating icons.
