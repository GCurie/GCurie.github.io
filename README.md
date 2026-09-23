# Personal Website

A starter website for IAT 806 students. A home page, a **Projects** page, and an **IAT 806** page where you add a folder for each thing you hand in.

Set it up once. After that, every change you push goes live on its own.

```
personal-website/
├── index.html                      home page — who you are
├── style.css                       styles for every page
├── README.md                       this file
└── projects/
    ├── index.html                  your courses and projects
    └── iat-806/
        ├── index.html              your IAT 806 submissions
        └── lab-01/                 one submission = one folder
            ├── index.html
            └── sketch.js
```

---

## 1. Make your own copy

1. At the top of [this repository](https://github.com/IAT-806/personal-website), click the green **Use this template** button, then **Create a new repository**.
2. **Owner:** your own account. Not IAT-806.
3. **Repository name:** your GitHub username followed by `.github.io`. If your username is `jsmith`, name the repo `jsmith.github.io`. Type it exactly — this name is what makes the site publish.
4. Set it to **Public**. Pages needs public on a free account.
5. Click **Create repository**.

Your site is now live at:

```
https://your-username.github.io
```

Give it two or three minutes the first time. There is nothing to turn on — a repo named `your-username.github.io` publishes by itself.

If nothing loads after five minutes, go to **Settings → Pages** in your repo and check that **Source** is **Deploy from a branch**, branch **main**, folder **/ (root)**. Also check your repo name for typos. `jsmith.github.io.io` and `Jsmith.github.io` will not work.

You get one of these per account. The next site you make will be a normal repo — see [Any repo can be a website](#any-repo-can-be-a-website) at the bottom.

---

## 2. Get it onto your computer

In VS Code, open the Command Palette — `Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows — type `Git: Clone`, paste the URL of **your** repo, and pick a folder.

---

## 3. Change the site

It's plain HTML and CSS. Open a file, change it, save it.

Start with `index.html`. Look for the `EDIT ME` comments:

```html
<!-- EDIT ME: your name -->
<a class="site-name" href="index.html">Your Name</a>
```

Put your name in. Do the same in `projects/index.html`, `projects/iat-806/index.html`, and `projects/iat-806/lab-01/index.html`.

To change how it looks, open `style.css`. The colors are at the top:

```css
:root {
  --ink: #16161a;          /* main text color */
  --muted: #6b6b76;        /* quieter text */
  --accent: #2f4fd8;       /* links and highlights */
  --paper: #fdfdfb;        /* page background */
  --line: #e4e4e0;         /* borders */
}
```

Change `--accent` and every link on every page changes with it. Make the site yours. Nothing here is precious.

### Look at it before you publish

1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

The site opens from your own computer. Save a file and the page reloads itself.

### Publish

Open the **Source Control** panel — the branching icon in the left bar.

1. Type what you changed: "added lab 01".
2. Click **Commit**.
3. Click **Sync Changes**.

The live site updates in a minute or two. If it looks the same, hard-refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`.

---

## 4. Add a submission

Each thing you hand in is one folder inside `projects/iat-806/`.

**Make the folder.** Copy `lab-01/` and rename the copy. Lowercase, dashes instead of spaces:

```
projects/iat-806/
├── lab-01/
├── lab-02/            ← your new one
├── assignment-1/
└── final-project/
```

**Put your work in it.** Replace `sketch.js` with yours. Edit that folder's `index.html` — the title, the description, your notes. Images and sounds go in the same folder, and you load them by name alone: `loadImage("cat.jpg")`, not a long path.

Each folder has to run on its own. Open its `index.html` with Live Server. The sketch should work with nothing from any other folder.

**Link to it.** Open `projects/iat-806/index.html` and find the list:

```html
<ul class="card-list">
  <li>
    <a href="lab-01/index.html">
      <span class="title">Lab 01 — Two Drawings</span>
      <span class="description">Shapes and color in p5.js.</span>
    </a>
  </li>
</ul>
```

Copy one `<li>` block, paste it below, change three things: the folder name in `href`, the title, the description. Nobody finds a folder you didn't link to.

**Commit and sync.** Your work is live at:

```
https://your-username.github.io/projects/iat-806/lab-02/
```

---

## When it breaks

**Blank page, or no sketch.** Right-click the page → **Inspect** → **Console**. Read the red error. It names the file it couldn't find or the line that broke.

**One page lost its styling.** Its link to `style.css` points at the wrong place. `../` means go up one folder. You need one for every folder you're inside:

| Page | Link |
|---|---|
| `index.html` | `style.css` |
| `projects/index.html` | `../style.css` |
| `projects/iat-806/index.html` | `../../style.css` |
| `projects/iat-806/lab-01/index.html` | `../../../style.css` |

**Works on your computer, broken on the live site.** Capitalization. Your computer treats `Sketch.js` and `sketch.js` as the same file. The server does not. Keep filenames lowercase and make your HTML match exactly.

**Spaces in filenames.** `my sketch.js` will cause you trouble. Write `my-sketch.js`.

---

## Handing work in

Unless the assignment says otherwise, submit two links on Canvas:

- your live page — `https://your-username.github.io/projects/iat-806/lab-02/`
- your repo — `https://github.com/your-username/your-username.github.io`

Open the live link in a private window first. If it loads there, it loads for anyone.

---

## Any repo can be a website

The `username.github.io` trick only works once. Any other repo can still be a website, you just turn it on yourself:

1. Go to that repo's **Settings** tab.
2. Click **Pages** in the left sidebar.
3. **Source:** **Deploy from a branch**.
4. **Branch:** **main**, folder **/ (root)**. Click **Save**.

Wait a minute and the address appears at the top of that same screen:

```
https://your-username.github.io/repo-name/
```

The repo needs to be public, and it needs an `index.html` at the top level. That's it — a sketch, a game, a class project, anything.
