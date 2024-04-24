#!/usr/bin/env bash

sudo apt-get install rclone
mkdir -p ~/.config/rclone
touch ~/.config/rclone/rclone.conf
echo "[nectar-swift]" >> ~/.config/rclone/rclone.conf
echo "type = swift" >> ~/.config/rclone/rclone.conf
echo "env_auth = true" >> ~/.config/rclone/rclone.conf
echo "[DEBUG] Uploading via swift..."
rclone copy ~/.config/rclone/rclone.conf nectar-swift:deepsyence/model