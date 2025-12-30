class AddNotesToUserCountries < ActiveRecord::Migration[8.1]
  def change
    add_column :user_countries, :notes, :text
  end
end
