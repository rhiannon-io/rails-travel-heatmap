Rails.application.routes.draw do
  devise_for :users
  root "countries#index"
  resources :countries
  patch "update_visited_countries", to: "countries#update_visited"
  post "countries/create_shared", to: "countries#create_shared"
  get "shared/:token", to: "countries#shared", as: :shared

  get "up" => "rails/health#show", as: :rails_health_check
end
