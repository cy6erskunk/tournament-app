## How to clone repo and run locally

Run `git clone <CLONE URL>`

```bash
$ cd <YOUR CLONED FOLDER>
$ npm install
$ npm run dev
```

## How to create your own branch and push it to github

- Pull latest changes from main

  - `git checkout main`
  - `git pull`

- Create your own branch `git checkout -b your_branch_name`
- Make changes, stage, commit
  - `git add .` or `git add filename`
  - `git commit -m "message here"`
- Push your changes
  - `git push`

## If there is new changes in main while you are done with own branch

- Commit your changes in your branch
- Pull latest changes from main
  - `git checkout main`
  - `git pull`
- Switch back to your branch
  - `git checkout your_branch_name`
- Merge main to your own branch
  - `git merge main`
- Push your changes
  - `git push`
