# frozen_string_literal: true

Grover.configure do |config|
  config.options = {
    format: "png",
    viewport: {
      width: 1200,
      height: 630
    },
    launch_args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ],
    wait_until: "networkidle0"
  }

  # Use environment variable for Puppeteer cache if set
  if ENV["PUPPETEER_CACHE_DIR"].present?
    config.options[:executable_path] = Dir.glob("#{ENV['PUPPETEER_CACHE_DIR']}/chrome/*/chrome-linux64/chrome").first
  end
end
