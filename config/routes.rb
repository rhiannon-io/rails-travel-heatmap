Rails.application.routes.draw do
  root "countries#index"
  resources :countries
  patch "update_visited_countries", to: "countries#update_visited"

  get "up" => "rails/health#show", as: :rails_health_check
end
