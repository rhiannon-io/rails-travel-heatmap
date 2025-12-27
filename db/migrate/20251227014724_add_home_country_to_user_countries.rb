class AddHomeCountryToUserCountries < ActiveRecord::Migration[8.1]
  def change
    add_column :user_countries, :home_country, :boolean, default: false, null: false
    add_index :user_countries, [ :user_id, :home_country ]
  end
end
