# Start with the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN yarn install --network-concurrency 4

ENV NODE_ENV production

# Copy the built Next.js output
COPY public ./public
COPY scripts ./scripts
COPY tsconfig.json ./


COPY next.tar.gz ./
# COPY prebuilt_node_modules.tar.gz ./

# Install dependencies .. npm install hangs b/c of low memory I think

RUN tar -xzf next.tar.gz .next
# RUN tar -xzf prebuilt_node_modules.tar.gz node_modules
RUN yarn build-scripts
RUN ln -s ./storage/.env .env

# Set the environment to production

# Expose the port the app runs on
#EXPOSE 3000

#CMD sleep 10000000
# Start the application
#CMD npm start
CMD yarn start --port 5000

