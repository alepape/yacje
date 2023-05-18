#!/bin/sh
# get some vars from env and write to json
RUNTIME_CONF="{
  \"apiKey\": \"$FB_APIKEY\",
  \"authDomain\": \"$FB_AUTHDOMAIN\",
  \"projectId\": \"$FB_PROJECTID\",
  \"messagingSenderId\": \"$FB_MESSAGINGSENDERID\",
  \"appId\": \"$FB_APPID\",
  \"measurementId\": \"$FB_MEASUREMENTID\",
  \"databaseURL\": \"$FB_DATABASEURL\" 
}"
echo "configuration loaded:"
echo $FB_APPID

echo $RUNTIME_CONF > /usr/local/apache2/htdocs/config.json
echo "json created - starting httpd..."

# OOTB starting command
httpd-foreground
