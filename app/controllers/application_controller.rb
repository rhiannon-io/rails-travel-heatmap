class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  # Exclude og_image endpoint so social media crawlers and bots can access it
  allow_browser versions: :modern, only: -> { !request.path.include?("/og_image") }

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes
end
