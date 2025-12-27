#!/usr/bin/env bash
# exit on error
set -o errexit

# Note: This script is for native Ruby runtime on Render.
# For OG image generation with Puppeteer, use Docker runtime instead.
# See render.yaml for Docker configuration.

bundle install
bundle exec rails assets:precompile
bundle exec rails assets:clean
bundle exec rails db:migrate
bundle exec rails db:seed
