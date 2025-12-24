# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).


# Use the countries gem for seeding
require 'countries'

ISO3166::Country.all.each do |country|
  Country.find_or_create_by!(iso_code: country.alpha3) do |c|
    c.name = country.iso_short_name
    c.visited = false
  end
end
