<p align="center">
  <img alt="penpal-logo" src="./public/app-icon.svg" width="200"><a/>
</p>

<h2 align="center">Penpal<h2/>
<p align="center">
  <i align="center">The real-human language exchange matching app</i>
</p>


<p align="center">
<a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg"><a/>
<a href="http://makeapullrequest.com"><img alt="PRs Welcome" src="https://img.shields.io/badge/pull%20requests-welcome-brightgreen.svg"><a/>
</p>

---

## Overview

Penpal is a mini app that helps you connect with **real humans** who speak your *target language*, so you can **practice** and **improve** together. Our matching algorithm ensures you're paired with the right person, and you can chat safely through the World app – making it easy to find genuine partners for language exchange.

**Features include**:

- **One-click matching**: Just select your language and your target partner’s language, and the app does the rest.  
- **Secure sign-in** with World – ensures you're talking to real people, not bots.  
- **Lightweight** UI with quick, minimal transitions.  
- **Cancel** or **Delete** your match easily if you're no longer interested.  
- **“Start Chat”** button for direct conversation once matched.

---

## How It Works

1. **Sign In with World**  
   - Verifies that you’re a real human and fetches your World username.  
2. **Request a Penpal**  
   - Select your current language and the language you wish to learn.  
   - The app searches for a suitable partner who wants to learn your language.  
3. **Get Matched**  
   - Once a match is found, you’ll see their username – plus an option to start chatting.  
4. **Build Your Skills**  
   - Practice your target language with a real human partner.  
   - If you want a new partner, remove the old match and request again.

---

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** – App Router  
- **[Tailwind CSS](https://tailwindcss.com/)** – for styles and utility classes  
- **[Supabase](https://supabase.com/)** – data storage (penpal requests, matching info)  
- **[MiniKit (World App)](https://developer.world.org/)** – secure real-human verification & incognito actions  

---

## Contributing

We welcome contributions! Feel free to open issues for feature requests, bug reports, or general improvements. Submit a PR, and we’ll review it as soon as possible.

**Steps to Contribute:**
1. Fork this repository.
2. Create a feature branch.
3. Commit your changes with clear commit messages.
4. Submit a Pull Request.

Please ensure all commits pass our lint checks and do not break existing tests.

## License

[MIT License](./LICENSE)

**© 2025 Penpal** – connect with real humans, learn new languages faster.
