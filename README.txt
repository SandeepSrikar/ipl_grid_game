IPL Cricket Challenge

Run locally with VS Code Live Server (or another local HTTP server).
Open index.html through the server; fetch() may not work when opening the file directly.

Games:
- Grid: existing 3x3 clue game.
- Guess Player: identify a player from their IPL team history, starting with two teams.
  Each incorrect guess reveals one more team. Five guesses maximum. Repeated guesses are blocked.

Guess Player uses:
- data/players.json
- data/player_team.json

Team logos are loaded from assets/teams/.
