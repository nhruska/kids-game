# Kids Game

A collection of mini games built with plain HTML, CSS and JavaScript. Each game lives in its own folder and can be played directly in the browser. The main `index.html` acts as a hub linking to all available games.

## Repository Structure

- `index.html` - Hub page listing all games
- `*/index.html` - Individual game implementations located in subfolders
- standalone `.html` files - Additional demos or experiments

### Game Folders

```text
2048/
balloon_pop/
band_simulator/
beat_maker/
breakout/
bubble_pop/
color_cascade/
color_match/
drawing_canvas/
drum_pad/
mandlebrot_viewer/
math_complete/
math_wiz/
memory_match/
merge_mania/
number_guess/
particle_system/
pattern_master/
piano/
polling_place_peace_keeper/
progress_indicator/
rainbow_bubble_pop/
rock_paper_scissors/
shape_swipe/
space_hangman/
speed_click/
star_wars/
synth_controller/
tic_tac-toe/
tic_tac_toe_ai/
voice_visualization/
word_chain/
word_scramble/
```

Each folder contains an `index.html` file with inline styles and scripts.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kids-game
   ```

2. **Run locally**

   Since the project is entirely static, you can simply open `index.html` in your browser. For a smoother experience, especially when navigating between folders, run a small local server. Any static server will work. For example with Python:

   ```bash
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000` and click on a game.

3. **Open individual games**

   Navigate to any game folder in the browser (e.g. `http://localhost:8000/2048/`) to play directly.

## Development

These games are small, self‑contained HTML files. Feel free to edit a game's `index.html` or add new folders with additional games. Changes appear immediately when you refresh the page if using a local server.

### Adding a Game

1. Create a new folder inside the repository.
2. Add an `index.html` with the game's code (inline or using separate assets).
3. Optionally add a link to the new game on the hub page (`index.html`).
4. Commit your changes.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is for educational and experimentation purposes and does not currently specify a license. Please contact the repository owner before using the games in a production setting.
