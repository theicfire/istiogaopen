Pardon the hackiness. I just wanted to get something working quickly.

See package.json for some common commands.

# Initial Setup
- yarn build-scripts
- yarn clear-and-backfill-history (creates database)
- add a .env file in the storage/ folder with `GMAIL_USER, GMAIL_PASS, OPENAI_API_KEY`
- yarn dev .. and things should work locally!

# Deploying
This is deployed on a tiny server with Dokku. It's small enough that `yarn build` is too slow, so that happens locally and then gets packaged up. You need to commit this to git to deploy.

## One time setup
- dokku apps:create tioga
- dokku letsencrypt:enable tioga
- dokku storage:ensure-directory tioga
- dokku storage:mount tioga /var/lib/dokku/data/storage/tioga:/usr/src/app/storage
- dokku ps:restart tioga
    - Only if the app already exists.. do this after adding storage
- Add .env file at /var/lib/dokku/data/storage/tioga/.env
- Then do this once: yarn clear-and-backfill-history

## Steps to deploy
Then, the steps are:
- Make changes
- yarn build
- commit the new .tar.gz file
- git push dokku main:master

# Logs
Logs sit in the storage/ directory. On the deployed machine, that's at /var/lib/dokku/data/storage/tioga/

# Cronjob
- dokku has the cronjob set up via app.json

