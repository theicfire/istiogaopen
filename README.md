Pardon the hackiness. I just wanted to get something working quickly ><.

See package.json for some common commands.

# Initial Setup
- `yarn build-scripts`
- `yarn clear-and-backfill-history (creates database)`
- add a .env file in the storage/ folder with `GMAIL_USER, GMAIL_PASS, OPENAI_API_KEY`

# Running locally
- `nvm use`
- `yarn dev`

# Deploying
This is deployed on a tiny server with Dokku. It's small enough that `yarn build` is too slow, so that happens locally and then gets packaged up. You need to commit this to git to deploy.

## One time setup
- `dokku apps:create tioga`
- `dokku letsencrypt:enable tioga`
- `dokku storage:ensure-directory tioga`
- `dokku storage:mount tioga /var/lib/dokku/data/storage/tioga:/usr/src/app/storage`
- `dokku ps:restart tioga`
    - Only if the app already exists.. do this after adding storage
- Add .env file at /var/lib/dokku/data/storage/tioga/.env
- Then do this once: `yarn clear-and-backfill-history`

## Steps to deploy
Then, the steps are:
- Make changes
- `nvm use`
- `yarn build`
- commit the new .tar.gz file
- `git push dokku main`
- If you get a 500 error, you may need to run `yarn check-tioga` to create some db tables.
- `git push` (to also keep github updated/have a backup)

*NOTE* if you change something in gitignore (like .env), that will not be deployed. You have to manually copy that over.

# Logs
- Logs from `logger.ts` sit in the storage/ directory. On the deployed machine, that's at /var/lib/dokku/data/storage/tioga/
- I don't know how to directly get logs from nextjs. I should probably send the output to some file in the last command of the Dockerfile.

# Cronjob
dokku has the cronjob set up via app.json

# Sqlite database
## Query the database:
Simply run `sqlite3 /var/lib/dokku/data/storage/tioga/tioga.db`

## Backup
I periodically copy the file over to `Dropbox/code/tioga-backup`

# Testing
- Run `yarn build-scripts && yarn test-scripts`. Look at the output -- the logging will tell you if there's a problem.
- Additionally, you can also add `DEVELOPMENT_BUTTONS="True"` to the .env file to get some buttons to run the tests on the homepage. Restart the yarn server after doing this.