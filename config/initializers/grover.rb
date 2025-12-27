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
      "--disable-gpu"
    ],
    wait_until: "networkidle0"
  }
end
