<a id="readme-top"></a>

<!-- PROJECT HEADER -->
<br />
<div align="center">
  <h1 align="center">🌿 Plant Care</h1>

  <p align="center">
    A gamified houseplant tracker that helps you keep your plants alive, and makes it fun.
    <br />
    <br />
    <a href="https://your-app.vercel.app"><strong>View Live Demo »</strong></a>
    &middot;
    <a href="https://github.com/your-github-username/your-repo-name/issues">Report Bug</a>
    &middot;
    <a href="https://github.com/your-github-username/your-repo-name/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#the-idea">The Idea</a></li>
        <li><a href="#target-audience">Target Audience</a></li>
        <li><a href="#competitors">Competitors</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#features">Features</a>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#database-setup">Database Setup</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#installing-as-an-app-pwa">Installing as an App (PWA)</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#known-limitations">Known Limitations</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

<!-- Add a screenshot here once you have one:
[![Plant Care Screenshot][product-screenshot]](https://your-app.vercel.app)
-->

**Plant Care** is a mobile-first web app (installable as a PWA) for keeping track of your houseplants. It tells you when each plant needs water, stores the care information for every plant you own, and is growing into a **gamified, Pou-style experience** where your plants feel like pets rather than objects.

### The Idea

Most people don't kill their plants on purpose. They forget to water them, don't know what a plant needs, or lose track of how it was doing. Plant Care tackles this in two ways:

1. **Practical care tracking.** Pick a species and the app looks up how much water and light it needs, turns that into a watering schedule, and shows which plants are due or overdue.
2. **Emotional attachment through play.** Every plant gets a name ("Timmy") and, in the planned version, a set of status bars (thirst, hunger, cleanliness, fun) that you maintain by watering, feeding and washing it, like a virtual pet. Taking regular pictures builds a growth history, which the app will turn into a **stop-motion video** when the plant reaches its full size, or when it dies.

The full vision:

- Reminders that tell you when to water your plants
- A photo collection per plant, taken over time
- Multiple plants, each with its own name and personality
- Status bars (thirst, hunger, cleanliness, fun, ...) and Pou-style care actions
- Hand-drawn sprites, and plants cut out of your photos so they become characters
- Rooms you can swipe between (living room, kitchen, bathroom, ...)
- A stop-motion growth video when a plant is fully grown, or after it dies

### Target Audience

- **Beginner plant owners** (students, young professionals, people in apartments) who want houseplants but don't know how often to water them.
- **Chronic plant-forgetters** who need a nudge at the right moment.
- **Plant lovers who enjoy tracking progress**, such as seeing a plant grow over months.
- **Casual gamers** who like virtual-pet apps (Tamagotchi, Pou) and would be motivated by a game layer on top of a real chore.

### Competitors

| App | What it does well | Where Plant Care differs |
|---|---|---|
| **Planta** | Watering reminders and care schedules, plant identification | Plant Care adds a game and pet layer, and growth tracking with stop-motion output |
| **Greg** | Smart watering schedules based on the plant's environment | Plant Care focuses on emotional attachment and play, not only scheduling |
| **Blossom** | Plant identification and care guidance | Plant Care is built around a long-term relationship with your own plants |
| **PictureThis** | Identifying plants from a photo | Identification is not the goal; ongoing care and progress are |
| **Pou / Tamagotchi-style pets** | Caring for a virtual creature through status bars | These are purely virtual; Plant Care ties the game to a **real** plant |

**My angle:** existing plant apps are utilities (reminders and databases). Existing virtual pet games have nothing to do with real life. Plant Care combines the two, so that doing the real chore is what keeps your digital pet happy.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![React Native][ReactNative-badge]][ReactNative-url]
* [![Expo][Expo-badge]][Expo-url]
* [![TypeScript][TypeScript-badge]][TypeScript-url]
* [![Supabase][Supabase-badge]][Supabase-url]
* [![Vercel][Vercel-badge]][Vercel-url]
* [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
* [Perenual Plant API](https://perenual.com/docs/api) for species data

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FEATURES -->
## Features

**Available now**

- 📸 Add a plant with a photo, or without one. If you skip the photo, the species picture from the plant database is used.
- 🔍 Search the Perenual species database and auto-fill the plant's common name, other names, watering need and sunlight
- 💧 Automatic watering schedule ("Every ~7 days · Water in 3 days"), calculated from the species data
- 🔴 Overdue indicator when a plant should have been watered already
- 🌱 Overview of all your plants in a 2-column grid
- 📋 Detail page per plant with all care information
- ✏️ Fill in missing care data yourself (watering, sunlight, interval) when the database doesn't know it
- 💦 "Water" button that records today as the last watered date
- 📱 Installable as a Progressive Web App on Android and iOS

**Planned**: see the [roadmap](#roadmap).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

### Phase 1: Core tracking ✅

- [x] Add plants with name, type and optional photo
- [x] Species lookup through the Perenual API
- [x] Store plants in Supabase
- [x] Plant overview and detail pages
- [x] Watering schedule and "Water" button
- [x] Edit missing care information
- [x] Deploy as an installable PWA (Vercel)

### Phase 2: Accounts (09/11 - 15/11)

- [ ] Login with a persistent session (log in once, stay logged in)
- [ ] Plants belong to a user

### Phase 3: Reminders (09/11 - 15/11)

- [ ] Notifications when a plant needs water
- [ ] "Give Timmy some water, he's thirsty" pop-up when the thirst bar hits zero

### Phase 4: Growth tracking (16/11 - 22/11)

- [ ] Take a new picture of a plant at any time
- [ ] Store a collection of pictures per plant (Supabase Storage instead of base64 in the database)
- [ ] Generate a stop-motion video from the photo collection

### Phase 5: Gamification (23/11 - 29/11)

- [ ] Status bars per plant: thirst, hunger, cleanliness, fun
- [ ] Care actions: water, feed, wash the plant with digital items
- [ ] Hand-drawn sprites
- [ ] Cut the plant out of the photo so it can become a character
- [ ] The "house": swipe between rooms (living room, kitchen, bathroom, ...)

### Phase 6: Plant life cycle (30/11 - 06/12)

- [ ] Reminders about replanting
- [ ] "Timmy reached his full age!" celebration pop-up with the stop-motion video
- [ ] "My plant died" flow: take a final picture, get the stop-motion video

### Intended user flow

1. Log in once; the app remembers you.
2. **Character creation:** take a picture of the plant and fill in the necessary information.
3. The character is saved and moves into your house, an overview of all your plants.
4. The house is a list of your plants, each showing its status.
5. Tap a plant for a closer look.
6. Swipe to move between rooms (bathroom, kitchen, living room, ...).
7. When the thirst bar hits zero, a pop-up asks you to give the plant some water.
8. When the plant is fully grown, you get a congratulation pop-up with the stop-motion video.
9. If the plant dies, you tell the app, take a final picture, and get the stop-motion video.

See the [open issues](https://github.com/your-github-username/your-repo-name/issues) for proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

* Node.js (LTS) and npm
  ```sh
  npm install npm@latest -g
  ```
* A free [Supabase](https://supabase.com) project
* A free API key from [Perenual](https://perenual.com/docs/api)
* Optional: the **Expo Go** app on your phone, to run the native version

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your-github-username/your-repo-name.git
   cd your-repo-name
   ```
2. Install packages
   ```sh
   npm install
   ```
3. Create a `.env` file in the project root:
   ```sh
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_PERENUAL_API_KEY=your-perenual-api-key
   ```
   > `EXPO_PUBLIC_*` variables are bundled into the app, so only use public keys here. Never put a Supabase service-role key in this file.
4. Set up the database (see below)
5. Start the app
   ```sh
   npm start
   ```
   Press `w` for the web version, or scan the QR code with Expo Go.

### Database Setup

Run this in the Supabase SQL editor:

```sql
create table public.plant (
  id bigint generated by default as identity primary key,
  name text not null,
  common_name text not null,
  other_name text not null,
  watering text not null,
  sunlight text not null,
  last_watered timestamp without time zone null,
  image_url text null,
  water_interval_days integer null
);
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->
## Usage

1. **First launch:** with no plants yet you see the welcome screen. Choose **Get Started with Photo** to take a picture of your plant, or **Start without Photo**.
2. **Add the plant:** give it a name, pick a species (this fills in watering and sunlight automatically), and set when you last watered it.
3. **Overview:** after saving you land on your plant overview. From now on the app opens here whenever you have plants.
4. **Plant details:** tap a plant to see its care info and watering schedule. Press **💧 Water** after watering it.
5. **Missing information:** if the plant database doesn't know the watering need, sunlight or interval, choose them yourself on the detail page.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PWA -->
## Installing as an App (PWA)

The app is deployed on Vercel and can be installed on your phone without an app store:

**🔗 https://mobileapplications.vercel.app/**

- **iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap the **⋮** menu, then **Install app**.

Once installed, the app opens full screen from your home screen, like a native app.

### Building the web version yourself

```sh
npx expo export -p web
```

The output is in the `dist` folder. The project includes a web app manifest and a service worker (in `public/`) that caches the app shell.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- PROJECT STRUCTURE -->
## Project Structure

```
app/
  (app)/index.tsx        Welcome screen (redirects if you already have plants)
  add-plant/index.tsx    Add a plant: photo, species search, care info
  plant-overview/        Grid of all plants
  plant/[id]/index.tsx   Plant detail page
  _layout.tsx            Native layout
  _layout.web.tsx        Web layout (manifest, service worker)
public/
  manifest.json          PWA manifest
  sw.js                  Service worker
  icons/                 App icons
src/
  services/              Supabase, Perenual and helper functions
  components/            Shared UI components
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- KNOWN LIMITATIONS -->
## Known Limitations

- **Photos are stored in the database as base64 text.** This works for a prototype but makes the overview slower as the collection grows. Moving to Supabase Storage is on the roadmap.
- **The free Perenual plan is limited.** Some species have incomplete watering or sunlight data, and the number of requests per day is capped. That is why missing values can be filled in manually.
- **Camera support on the web varies.** Taking photos works through the browser's file picker; on some devices it behaves differently from the native app. "Start without Photo" is always available.
- **Offline use is limited.** The app shell loads offline, but plant data comes from Supabase and needs a connection.
- **Watering intervals are estimates.** They come from general species data (or defaults per category) and don't account for pot size, light or season.
- **No user accounts yet.** All plants are visible in one shared list until Phase 2 is finished.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

No license has been chosen yet. All rights reserved by the author until one is added.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Maxim Tomilin - maxim.tomilin@student.ucll.be

Project Link: [https://github.com/maximtomilin/mobileapplications](https://github.com/maximtomilin/mobileapplications)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Perenual](https://perenual.com) for the plant species API
* [Supabase](https://supabase.com) for the database
* [Expo](https://expo.dev) for the React Native tooling
* [Vercel](https://vercel.com) for hosting
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template) for the README structure

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[product-screenshot]: images/screenshot.png
[ReactNative-badge]: https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[ReactNative-url]: https://reactnative.dev/
[Expo-badge]: https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white
[Expo-url]: https://expo.dev/
[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Supabase-badge]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[Vercel-badge]: https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white
[Vercel-url]: https://vercel.com/