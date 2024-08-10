# 🧩 Tetrixel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA: Ready](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![GitHub stars](https://img.shields.io/github/stars/MohdYahyaMahmodi/tetrixel.svg)](https://github.com/MohdYahyaMahmodi/tetrixel/stargazers)

Tetrixel is a modern, pixel-perfect implementation of the classic Tetris game, built as a Progressive Web App (PWA) using vanilla JavaScript, HTML5, and CSS3.

![Desktop Gameplay](desktop-gameplay.png)

## 🌟 Features

- 🎮 Classic Tetris gameplay with a modern twist
- 📱 Fully responsive design for desktop and mobile
- 🚀 Progressive Web App (PWA) for offline play
- 🌈 Vibrant, customizable color schemes
- 📊 Real-time statistics tracking
- 🏆 Local high score system
- 🔊 (Coming Soon) Sound effects and background music

## 🚀 Live Demo

Try out Tetrixel now: [Play Tetrixel](https://mohdyahyamahmodi.github.io/tetrixel/)

## 📱 Mobile Experience

Tetrixel is optimized for mobile play, offering intuitive touch controls and a seamless PWA experience.

<div style="display: flex; justify-content: space-around;">
  <img src="mobile.png" alt="Mobile Gameplay" width="200"/>
  <img src="stats.png" alt="Statistics Screen" width="200"/>
  <img src="how-to-play.png" alt="How to Play Screen" width="200"/>
</div>

## 🛠️ Installation

1. Clone the repository:
   ```
   git clone https://github.com/MohdYahyaMahmodi/tetrixel.git
   ```
2. Navigate to the project directory:
   ```
   cd tetrixel
   ```
3. Open `index.html` in your browser or use a local server.

## 🧠 Game Logic

Tetrixel follows the classic Tetris game mechanics:

1. **Piece Generation**: Random tetromino shapes are generated and fall from the top of the game board.
2. **Movement**: Players can move pieces left, right, and down using arrow keys or touch controls.
3. **Rotation**: Pieces can be rotated clockwise using the up arrow or tap gesture.
4. **Line Clearing**: When a horizontal line is filled, it clears and awards points.
5. **Leveling**: The game speed increases as the player clears more lines and levels up.
6. **Game Over**: The game ends when new pieces can no longer be placed on the board.

## 💻 Code Structure

The game is built with a modular approach:

- `index.html`: The main structure of the game interface.
- `tetris.js`: Contains the core game logic, including:
  - `Piece` class for tetromino management
  - Board state handling
  - Collision detection
  - Scoring system
  - Touch controls using Hammer.js
- CSS: Styling is handled inline in the HTML file for simplicity.

### Key Functions

- `createPiece()`: Generates new tetromino pieces.
- `drawBoard()`: Renders the current state of the game board.
- `clearLines()`: Checks for and clears completed lines, updating the score.
- `update()`: The main game loop, handling piece movement and game state.

## 🌐 PWA Functionality

Tetrixel is a fully functional Progressive Web App, allowing users to install it on their devices and play offline. The PWA features include:

- Offline caching of game assets
- "Add to Home Screen" functionality
- Fast loading times and smooth performance

## 🎨 Customization

Feel free to customize the game by modifying the `COLORS` array in `tetris.js` to create your own unique color schemes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- Inspired by the original Tetris game
- Built with love for the gaming community

---

Enjoy playing Tetrixel! Don't forget to star ⭐ the repository if you had fun!

