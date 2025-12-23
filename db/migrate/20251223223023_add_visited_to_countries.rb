class AddVisitedToCountries < ActiveRecord::Migration[8.1]
  def change
    add_column :countries, :visited, :boolean
  end
end
