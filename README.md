# Lab Legends — classroom quiz game

A Docker-hosted, Kahoot-style multiplayer game for a classroom of 9 students.

## Start it
1. Copy this folder to a machine with Docker Engine and Docker Compose.
2. In this folder run: `docker compose up -d --build`
3. On the host, open `http://localhost:3000` and choose **Instructor**.
4. Students on the same Wi-Fi/LAN open `http://SERVER-IP:3000` and choose **Join game**.
5. Share the room PIN shown on the instructor screen.

Allow inbound TCP port 3000 through the host firewall on your trusted classroom LAN.
Do not expose this initial version directly to the public internet without adding HTTPS and access controls.

## Included
- 25 virtualization/lab questions plus 5 questions from Test-1 Questions.pdf (30 total)
- Instructor-controlled questions and answer reveal
- Room PIN, student/team join, live answers
- Points, speed bonuses, live leaderboard and final results
- Responsive student interface
