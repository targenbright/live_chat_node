FROM node:latest

WORKDIR /src
COPY src/package.json .
RUN npm install -g nodemon
RUN npm install
ADD ./src/ /src/
CMD [ "node", "/src/app.js" ]
