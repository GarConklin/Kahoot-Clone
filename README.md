# Lab Legends — Docker classroom quiz

A browser-based multiplayer quiz for a classroom, designed for an instructor and up to 9 student players/teams on the same trusted network.

## Start

From this folder, run:

```bash
docker compose up -d --build
```

Open `http://localhost:3000` on the instructor computer. Choose **Launch instructor console**. Students open `http://SERVER-IP:3000` on their own devices, enter the room PIN, and choose a player/team name.

The instructor screen shows the same question and answer choices students see while they answer. Students select an option and press **Lock In Answer**; before the instructor reveals the answer, they can choose **Change Answer**, select another option, and lock it in again. Only the final locked answer is scored. The correct answer is not highlighted until **Reveal answer** is selected. After reveal, the correct choice is highlighted and vote counts are shown.

## Update an existing installation

Extract this updated package to a folder, open a terminal in that folder, and run `docker compose up -d --build`. If the old container is using port 3000, stop the old version first from its original folder with `docker compose down`, then start the updated version from this folder.

## Notes

- This is a classroom prototype; test it with a couple of devices before running it with the class.
- Allow TCP port 3000 only on your trusted classroom LAN.
- Do not expose it directly to the public internet without adding HTTPS and suitable access controls.
