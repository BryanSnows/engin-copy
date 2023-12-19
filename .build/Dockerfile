FROM node:20-slim

WORKDIR /app

RUN apt update -yq && apt upgrade -yq && apt install -yq vim

ENV TZ=America/Manaus

ADD . .
#COPY .build/.npmrc ./.npmrc

RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    npm i && \
    npm run build

EXPOSE 3000

CMD ["node","/app/dist/main"]
