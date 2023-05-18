# HTTPD Base Image from https://hub.docker.com/r/arm32v7/httpd
FROM arm32v7/httpd:alpine

COPY ./index.html /usr/local/apache2/htdocs/
COPY ./firepad-userlist.css /usr/local/apache2/htdocs/
COPY ./firepad-userlist.js /usr/local/apache2/htdocs/
COPY ./hjson.js /usr/local/apache2/htdocs/
COPY ./json-schema-faker.js /usr/local/apache2/htdocs/
COPY ./material.css /usr/local/apache2/htdocs/

COPY ./env_mgt.sh /tmp/

ENTRYPOINT /tmp/env_mgt.sh

EXPOSE 80