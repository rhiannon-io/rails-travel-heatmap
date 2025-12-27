class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  # Note: This might block social media crawlers on og_image endpoints, 
  # but we handle that with fallback redirects
  allow_browser versions: :modern

  # Changes to the importmap will invalidate the etag for HTML responses
  stale_when_importmap_changes

  private

  # Override to allow any browser for specific actions
  def allow_browser?
    # Skip browser check for og_image routes (for social crawlers)
    return true if request.path.include?("/og_image")
    super
  end
end
