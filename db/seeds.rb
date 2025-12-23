# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

countries = [
  { name: "United States of America", iso_code: "USA", visited: true },
  { name: "Canada", iso_code: "CAN", visited: true },
  { name: "United Kingdom", iso_code: "GBR", visited: true },
  { name: "France", iso_code: "FRA", visited: true },
  { name: "Germany", iso_code: "DEU", visited: true },
  { name: "Japan", iso_code: "JPN", visited: false },
  { name: "Australia", iso_code: "AUS", visited: false },
  { name: "Brazil", iso_code: "BRA", visited: false },
  { name: "India", iso_code: "IND", visited: false },
  { name: "China", iso_code: "CHN", visited: false }
]

countries.each do |country|
  Country.find_or_create_by!(iso_code: country[:iso_code]) do |c|
    c.name = country[:name]
    c.visited = country[:visited]
  end
end
