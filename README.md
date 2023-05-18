# Yet Another Collaborative JSON-schema Editor

I've been looking for a way to collaborate on the design of JSON schemas but couldn't find one. JSON.link was good but missed a few features, and is blocked at work...
...So I "created" one - rather, I glued a few fantastic tools into a single UI.

- CodeMirror
- Firepad / Firebase
- HJSON
- JSON Schema Faker

# Instructions

To deploy your own instance, head to https://hub.docker.com/r/alexlepape/yacje to get the basic image.

The container requires several environment variables to run.
Please refer to the docker compose example below for guidance.

```
version: "3.6"
services:
  yacje:
    container_name: yacje
    image: alexlepape/yacje:latest
    environment:
      - FB_APIKEY=<INSERT FIREBASE API KEY>
      - FB_AUTHDOMAIN=<INSERT FIREBASE AUTH DOMAIN>
      - FB_PROJECTID=<INSERT FIREBASE PROJECT ID>
      - FB_MESSAGINGSENDERID=<INSERT FIREBASE SENDER ID>
      - FB_APPID=<INSERT FIREBASE APP ID>
      - FB_MEASUREMENTID=<INSERT FIREBASE MEASUREMENT ID> # might be optional
      - FB_DATABASEURL=<INSERT FIREBASE DATABASE URL> # note that this version of the firebase SDK is a bot old, so it only works if the database is hosted in the US!!!
    ports:
      - 5766:80 # dial 1-800-JSON ;)
```
