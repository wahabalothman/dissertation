# Getting the site live (about 45 minutes)

1. Install Git (git-scm.com), Quarto (quarto.org/docs/get-started), and GitHub Desktop if you prefer clicking to typing.
2. Create a repository on GitHub named `dissertation` (public if you want Claude to read it directly; private also works and the site can still be public).
3. Unzip this folder, open a terminal inside it, and run:

        git init
        git add .
        git commit -m "Initial structure: theory, design, data manifest, log"
        git branch -M main
        git remote add origin https://github.com/YOUR-USERNAME/dissertation.git
        git push -u origin main

4. Replace YOUR-USERNAME in `_quarto.yml` (the GitHub link) and push again.
5. On GitHub: Settings > Pages > Source: Deploy from a branch > branch `gh-pages`. The first push runs the workflow and creates that branch; allow two minutes.
6. Your site is at https://YOUR-USERNAME.github.io/dissertation/. A custom domain is Settings > Pages > Custom domain, plus a CNAME record at your registrar.
7. Preview locally any time with `quarto preview`.

## Daily routine
- Open the week's file in `notes/` and write what you decided.
- Work in `analysis/` or `design/`.
- `git add . && git commit -m "what changed" && git push`. The site rebuilds itself.
