FROM node:18

WORKDIR /app

# # copy dependencies
COPY package.json package-lock.json ./

# # install dependencies
RUN npm install

## COPY FILES INTO CONTAINER
COPY . .

## BUILD
RUN npm run build

EXPOSE 3000

CMD ["npm","start"]
