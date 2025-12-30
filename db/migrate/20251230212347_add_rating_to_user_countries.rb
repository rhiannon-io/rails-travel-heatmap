class AddRatingToUserCountries < ActiveRecord::Migration[8.1]
  def change
    add_column :user_countries, :rating, :integer
  end
end
