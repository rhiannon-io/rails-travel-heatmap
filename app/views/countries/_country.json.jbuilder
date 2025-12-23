json.extract! country, :id, :name, :iso_code, :visit_count, :created_at, :updated_at
json.url country_url(country, format: :json)
